import { useState } from 'react';
import { Building, MapPin, Phone, Edit3, X, Check, Copy, Clock, Plus, Trash2 } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Spinner } from '../../../components/ui/Spinner';
import { api } from '../../../api/client';
import type { VetProfile, HorarioLaboral } from '@vetvault/shared';

interface ClinicsTabProps {
  profile: VetProfile;
  refetch: () => void;
}

export function ClinicsTab({ profile, refetch }: ClinicsTabProps) {
  // Clinic Editing States
  const [editingClinicId, setEditingClinicId] = useState<string | null>(null);
  const [clinicNombreComercial, setClinicNombreComercial] = useState('');
  const [clinicDireccion, setClinicDireccion] = useState('');
  const [clinicTelefono, setClinicTelefono] = useState('');
  const [savingClinic, setSavingClinic] = useState(false);
  const [clinicError, setClinicError] = useState('');

  // Invitation States
  const [inviteClinicId, setInviteClinicId] = useState<string | null>(null);
  const [invitationToken, setInvitationToken] = useState<string | null>(null);
  const [inviting, setInviting] = useState(false);
  const [copied, setCopied] = useState(false);

  // Scheduling States
  const [activeScheduleClinicId, setActiveScheduleClinicId] = useState<string | null>(null);
  const [tempHorarios, setTempHorarios] = useState<HorarioLaboral[]>([]);
  const [loadingHorarios, setLoadingHorarios] = useState(false);
  const [savingHorarios, setSavingHorarios] = useState(false);

  const DAYS_OF_WEEK = [
    { id: 1, label: 'Lunes' },
    { id: 2, label: 'Martes' },
    { id: 3, label: 'Miércoles' },
    { id: 4, label: 'Jueves' },
    { id: 5, label: 'Viernes' },
    { id: 6, label: 'Sábado' },
    { id: 0, label: 'Domingo' }
  ];

  const handleConfigureSchedules = async (clinicaId: string) => {
    if (activeScheduleClinicId === clinicaId) {
      setActiveScheduleClinicId(null);
      return;
    }

    setActiveScheduleClinicId(clinicaId);
    setLoadingHorarios(true);
    setInviteClinicId(null); // Close invite box if open

    try {
      const response = await api.get<HorarioLaboral[]>(`/veterinarios/${profile.id}/horarios`);
      const clinicSchedules = (response || []).filter((h) => h.clinica_id === clinicaId);
      setTempHorarios(clinicSchedules);
    } catch (err: any) {
      alert(err.message || 'Error al cargar los horarios');
      setActiveScheduleClinicId(null);
    } finally {
      setLoadingHorarios(false);
    }
  };

  const handleAddSlot = (day: number) => {
    setTempHorarios((prev) => [
      ...prev,
      { dia_semana: day, hora_inicio: '08:00', hora_fin: '12:00' }
    ]);
  };

  const handleRemoveSlot = (index: number) => {
    setTempHorarios((prev) => prev.filter((_, i) => i !== index));
  };

  const handleTimeChange = (index: number, field: 'hora_inicio' | 'hora_fin', value: string) => {
    setTempHorarios((prev) =>
      prev.map((slot, i) => (i === index ? { ...slot, [field]: value } : slot))
    );
  };

  const handleSaveSchedules = async () => {
    if (!activeScheduleClinicId) return;
    setSavingHorarios(true);

    try {
      const formattedHorarios = tempHorarios.map(h => ({
        dia_semana: h.dia_semana,
        hora_inicio: h.hora_inicio,
        hora_fin: h.hora_fin
      }));

      await api.put(`/veterinarios/${profile.id}/clinicas/${activeScheduleClinicId}/horarios`, {
        horarios: formattedHorarios
      });
      alert('Horarios actualizados correctamente');
      setActiveScheduleClinicId(null);
    } catch (err: any) {
      alert(err.message || 'Error al guardar los horarios');
    } finally {
      setSavingHorarios(false);
    }
  };

  const handleSaveClinic = async (clinicId: string) => {
    setSavingClinic(true);
    setClinicError('');

    try {
      await api.patch(`/clinicas/${clinicId}`, {
        nombre_comercial: clinicNombreComercial,
        direccion: clinicDireccion,
        telefono: clinicTelefono,
      });
      setEditingClinicId(null);
      refetch();
    } catch (err: any) {
      setClinicError(err.message || 'Error al guardar los cambios de la clínica');
    } finally {
      setSavingClinic(false);
    }
  };

  const handleGenerateInvite = async (clinicaId: string) => {
    setInviting(true);
    setInvitationToken(null);
    setCopied(false);
    setInviteClinicId(clinicaId);

    try {
      const response = await api.post<{ token: string }>('/veterinarios/invitar', { clinicaId });
      setInvitationToken(response.token);
    } catch (err: any) {
      alert(err.message || 'Error al generar la invitación');
      setInviteClinicId(null);
    } finally {
      setInviting(false);
    }
  };

  const handleCopyLink = (token: string) => {
    const inviteLink = `${window.location.origin}/register?invitation=${token}`;
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="perfil-clinicas-section">
      {clinicError && (
        <div className="login-message error" style={{ marginBottom: 'var(--space-md)' }}>
          {clinicError}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
        {!profile.clinicas || profile.clinicas.length === 0 ? (
          <Card>
            <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
              No perteneces a ninguna clínica actualmente.
            </p>
          </Card>
        ) : (
          profile.clinicas.map((clinica) => {
            const isEditingClinic = editingClinicId === clinica.id;

            return (
              <Card key={clinica.id}>
                {isEditingClinic ? (
                  <div className="perfil-edit-form">
                    <h3 className="perfil-section-title">Editar Clínica</h3>
                    <Input
                      label="Nombre Comercial"
                      value={clinicNombreComercial}
                      onChange={(e) => setClinicNombreComercial(e.target.value)}
                    />
                    <Input
                      label="Dirección"
                      value={clinicDireccion}
                      onChange={(e) => setClinicDireccion(e.target.value)}
                    />
                    <Input
                      label="Teléfono"
                      value={clinicTelefono}
                      onChange={(e) => setClinicTelefono(e.target.value)}
                    />
                    <div className="perfil-edit-actions">
                      <Button
                        variant="secondary"
                        onClick={() => setEditingClinicId(null)}
                      >
                        Cancelar
                      </Button>
                      <Button onClick={() => handleSaveClinic(clinica.id)} disabled={savingClinic}>
                        {savingClinic ? 'Guardando...' : 'Guardar Cambios'}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="perfil-clinica-card">
                    <div className="perfil-clinica-info">
                      <div className="perfil-clinica-title">
                        <Building size={16} style={{ color: 'var(--accent)', marginRight: 6 }} />
                        <h4>{clinica.nombre_comercial}</h4>
                      </div>
                      <div className="perfil-clinica-details">
                        <p>
                          <MapPin size={12} /> {clinica.direccion || 'Sin dirección'}
                        </p>
                        <p>
                          <Phone size={12} /> {clinica.telefono || 'Sin teléfono'}
                        </p>
                      </div>
                    </div>
                    <div className="perfil-clinica-actions">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setEditingClinicId(clinica.id);
                          setClinicNombreComercial(clinica.nombre_comercial || '');
                          setClinicDireccion(clinica.direccion || '');
                          setClinicTelefono(clinica.telefono || '');
                        }}
                      >
                        <Edit3 size={12} />
                        Editar
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleConfigureSchedules(clinica.id)}
                      >
                        <Clock size={12} />
                        Horarios
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleGenerateInvite(clinica.id)}
                      >
                        Invitar Vet
                      </Button>
                    </div>
                  </div>
                )}

                {/* Invite Box inside the active clinic card */}
                {inviteClinicId === clinica.id && (
                  <div className="perfil-invitation-box">
                    <div className="perfil-invitation-header">
                      <h5>Invitación para Veterinarios</h5>
                      <button className="perfil-invitation-close" onClick={() => setInviteClinicId(null)}>
                        <X size={14} />
                      </button>
                    </div>

                    {inviting ? (
                      <div style={{ display: 'flex', justifyContent: 'center', padding: '12px' }}>
                        <Spinner size={20} />
                      </div>
                    ) : invitationToken ? (
                      <div className="perfil-invitation-success">
                        <p>Copiá y compartí este enlace con el veterinario que querés invitar:</p>
                        <div className="perfil-invitation-input-group">
                          <input
                            type="text"
                            readOnly
                            value={`${window.location.origin}/register?invitation=${invitationToken}`}
                          />
                          <Button size="sm" onClick={() => handleCopyLink(invitationToken)}>
                            {copied ? <Check size={14} /> : <Copy size={14} />}
                            {copied ? 'Copiado' : 'Copiar'}
                          </Button>
                        </div>
                        <span className="perfil-invitation-expiry">
                          El enlace expira en 7 días y sirve únicamente para unirse a {clinica.nombre_comercial}.
                        </span>
                      </div>
                    ) : null}
                  </div>
                )}

                {/* Schedule Box inside the active clinic card */}
                {activeScheduleClinicId === clinica.id && (
                  <div className="perfil-horarios-box">
                    <div className="perfil-horarios-header">
                      <h5>Horarios de Atención Semanal</h5>
                      <button className="perfil-invitation-close" onClick={() => setActiveScheduleClinicId(null)}>
                        <X size={14} />
                      </button>
                    </div>
                    {loadingHorarios ? (
                      <div style={{ display: 'flex', justifyContent: 'center', padding: '24px' }}>
                        <Spinner size={20} />
                      </div>
                    ) : (
                      <div className="perfil-horarios-list">
                        {DAYS_OF_WEEK.map((day) => {
                          const daySlots = tempHorarios.filter(h => h.dia_semana === day.id);
                          return (
                            <div key={day.id} className="perfil-horario-day-group">
                              <div className="perfil-horario-day-label">
                                <strong>{day.label}</strong>
                              </div>
                              <div className="perfil-horario-slots">
                                {daySlots.length === 0 ? (
                                  <span className="no-horarios-text">No laborable</span>
                                ) : (
                                  daySlots.map((slot, index) => {
                                    // Find original index in tempHorarios
                                    const origIndex = tempHorarios.findIndex(h => h === slot);
                                    return (
                                      <div key={index} className="perfil-horario-slot-row">
                                        <div className="perfil-horario-time-inputs">
                                          <input
                                            type="time"
                                            value={slot.hora_inicio}
                                            onChange={(e) => handleTimeChange(origIndex, 'hora_inicio', e.target.value)}
                                            required
                                          />
                                          <span>a</span>
                                          <input
                                            type="time"
                                            value={slot.hora_fin}
                                            onChange={(e) => handleTimeChange(origIndex, 'hora_fin', e.target.value)}
                                            required
                                          />
                                        </div>
                                        <button
                                          type="button"
                                          className="btn-remove-slot"
                                          onClick={() => handleRemoveSlot(origIndex)}
                                          title="Eliminar franja"
                                        >
                                          <Trash2 size={14} />
                                        </button>
                                      </div>
                                    );
                                  })
                                )}
                                <button
                                  type="button"
                                  className="btn-add-slot-day"
                                  onClick={() => handleAddSlot(day.id)}
                                >
                                  <Plus size={12} /> Agregar franja
                                </button>
                              </div>
                            </div>
                          );
                        })}
                        <div className="perfil-horarios-actions" style={{ marginTop: 'var(--space-md)', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                          <Button variant="secondary" size="sm" onClick={() => setActiveScheduleClinicId(null)}>
                            Cancelar
                          </Button>
                          <Button size="sm" onClick={handleSaveSchedules} disabled={savingHorarios}>
                            {savingHorarios ? 'Guardando...' : 'Guardar Horarios'}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
