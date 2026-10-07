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
    <div className="flex flex-col gap-4">
      {clinicError && (
        <div className="p-3 rounded-xl text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/25 mb-4">
          {clinicError}
        </div>
      )}

      <div className="flex flex-col gap-4">
        {!profile.clinicas || profile.clinicas.length === 0 ? (
          <Card className="p-6 border border-[var(--border)]">
            <p className="text-center text-xs text-[var(--text-muted)] py-4">
              No perteneces a ninguna clínica actualmente.
            </p>
          </Card>
        ) : (
          profile.clinicas.map((clinica) => {
            const isEditingClinic = editingClinicId === clinica.id;

            return (
              <Card key={clinica.id} className="p-6 border border-[var(--border)]">
                {isEditingClinic ? (
                  <div className="flex flex-col gap-4">
                    <h3 className="text-base font-bold text-[var(--text-h)]">Editar Clínica</h3>
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
                    <div className="flex justify-end gap-3 mt-2">
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
                  <div className="flex justify-between items-center gap-4 flex-wrap">
                    <div className="flex-1 min-w-[250px]">
                      <div className="flex items-center gap-2 mb-1.5">
                        <Building size={16} className="text-[var(--accent)]" />
                        <h4 className="text-base font-bold text-[var(--text-h)]">{clinica.nombre_comercial}</h4>
                      </div>
                      <div className="flex flex-col gap-1 text-xs text-[var(--text-muted)]">
                        <p className="flex items-center gap-1.5">
                          <MapPin size={12} /> {clinica.direccion || 'Sin dirección'}
                        </p>
                        <p className="flex items-center gap-1.5">
                          <Phone size={12} /> {clinica.telefono || 'Sin teléfono'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
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
                  <div className="mt-4 p-4 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl animate-fade-in">
                    <div className="flex justify-between items-center mb-2">
                      <h5 className="text-sm font-semibold text-[var(--text-h)]">Invitación para Veterinarios</h5>
                      <button
                        className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-h)] hover:bg-[var(--border)] transition cursor-pointer"
                        onClick={() => setInviteClinicId(null)}
                      >
                        <X size={14} />
                      </button>
                    </div>

                    {inviting ? (
                      <div className="flex justify-center p-3">
                        <Spinner size={20} />
                      </div>
                    ) : invitationToken ? (
                      <div className="space-y-2">
                        <p className="text-xs text-[var(--text)]">Copiá y compartí este enlace con el veterinario que querés invitar:</p>
                        <div className="flex gap-2 w-full max-w-lg">
                          <input
                            type="text"
                            readOnly
                            value={`${window.location.origin}/register?invitation=${invitationToken}`}
                            className="flex-1 bg-[var(--surface-solid)] border border-[var(--border)] rounded-xl px-3 py-2 text-xs text-[var(--text-h)] outline-none"
                          />
                          <Button size="sm" onClick={() => handleCopyLink(invitationToken)}>
                            {copied ? <Check size={14} /> : <Copy size={14} />}
                            {copied ? 'Copiado' : 'Copiar'}
                          </Button>
                        </div>
                        <span className="text-xs text-[var(--text-muted)] block">
                          El enlace expira en 7 días y sirve únicamente para unirse a {clinica.nombre_comercial}.
                        </span>
                      </div>
                    ) : null}
                  </div>
                )}

                {/* Schedule Box inside the active clinic card */}
                {activeScheduleClinicId === clinica.id && (
                  <div className="mt-4 p-4 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl animate-fade-in">
                    <div className="flex justify-between items-center mb-4">
                      <h5 className="text-sm font-semibold text-[var(--text-h)]">Horarios de Atención Semanal</h5>
                      <button
                        className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-h)] hover:bg-[var(--border)] transition cursor-pointer"
                        onClick={() => setActiveScheduleClinicId(null)}
                      >
                        <X size={14} />
                      </button>
                    </div>
                    {loadingHorarios ? (
                      <div className="flex justify-center p-6">
                        <Spinner size={20} />
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {DAYS_OF_WEEK.map((day) => {
                          const daySlots = tempHorarios.filter(h => h.dia_semana === day.id);
                          return (
                            <div key={day.id} className="flex items-start border-b border-[var(--border)] last:border-b-0 py-2.5 gap-4">
                              <div className="w-24 text-sm font-semibold text-[var(--text-h)] pt-1.5">
                                {day.label}
                              </div>
                              <div className="flex-1 flex flex-col gap-1.5">
                                {daySlots.length === 0 ? (
                                  <span className="text-xs text-[var(--text-muted)] italic py-1">No laborable</span>
                                ) : (
                                  daySlots.map((slot, index) => {
                                    const origIndex = tempHorarios.findIndex(h => h === slot);
                                    return (
                                      <div key={index} className="flex items-center gap-2">
                                        <div className="flex items-center gap-1.5">
                                          <input
                                            type="time"
                                            value={slot.hora_inicio}
                                            onChange={(e) => handleTimeChange(origIndex, 'hora_inicio', e.target.value)}
                                            required
                                            className="bg-[var(--surface-solid)] border border-[var(--border)] rounded-lg px-2 py-1 text-xs text-[var(--text-h)] outline-none focus:border-[var(--accent)]"
                                          />
                                          <span className="text-xs text-[var(--text-muted)]">a</span>
                                          <input
                                            type="time"
                                            value={slot.hora_fin}
                                            onChange={(e) => handleTimeChange(origIndex, 'hora_fin', e.target.value)}
                                            required
                                            className="bg-[var(--surface-solid)] border border-[var(--border)] rounded-lg px-2 py-1 text-xs text-[var(--text-h)] outline-none focus:border-[var(--accent)]"
                                          />
                                        </div>
                                        <button
                                          type="button"
                                          className="p-1 text-slate-400 hover:text-rose-500 rounded cursor-pointer transition hover:bg-rose-50 dark:hover:bg-rose-950/30"
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
                                  className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--accent)] hover:bg-[var(--accent-light)] px-2 py-1 rounded transition cursor-pointer w-fit mt-0.5"
                                  onClick={() => handleAddSlot(day.id)}
                                >
                                  <Plus size={12} /> Agregar franja
                                </button>
                              </div>
                            </div>
                          );
                        })}
                        <div className="flex justify-end gap-3 mt-4 pt-3 border-t border-[var(--border)]">
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
