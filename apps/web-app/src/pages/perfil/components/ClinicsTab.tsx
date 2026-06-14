import { useState } from 'react';
import { Building, MapPin, Phone, Edit3, X, Check, Copy } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Spinner } from '../../../components/ui/Spinner';
import { api } from '../../../api/client';
import type { VetProfile } from '@vetvault/shared';

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
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
