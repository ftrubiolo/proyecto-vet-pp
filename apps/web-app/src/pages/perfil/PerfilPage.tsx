import { useState, useEffect } from 'react';
import { Mail, Stethoscope, Edit3 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useFetch } from '../../hooks/useFetch';
import { api } from '../../api/client';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Spinner } from '../../components/ui/Spinner';
import './PerfilPage.css';

interface VetProfile {
  id: string;
  nombre: string;
  apellido: string;
  telefono: string;
  numero_matricula: string;
  foto_url?: string;
  usuario?: {
    email: string;
  };
}

interface OwnerProfile {
  id: string;
  nombre: string;
  apellido: string;
  telefono: string;
  direccion?: string;
  es_empresa: boolean;
  razon_social?: string;
  foto_url?: string;
  usuario?: {
    email: string;
  };
}

export function PerfilPage() {
  const { user } = useAuth();
  const isVet = user?.rol === 'Veterinario';
  const profileId = isVet ? user?.vetId : user?.proId;

  const endpoint = profileId
    ? isVet
      ? `/veterinarios/${profileId}`
      : `/propietarios/${profileId}`
    : null;

  const { data: profile, isLoading, refetch } = useFetch<VetProfile | OwnerProfile>(endpoint);

  const [isEditing, setIsEditing] = useState(false);
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [telefono, setTelefono] = useState('');
  const [direccion, setDireccion] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (profile) {
      setNombre(profile.nombre || '');
      setApellido(profile.apellido || '');
      setTelefono(profile.telefono || '');
      if (!isVet && 'direccion' in profile) {
        setDireccion((profile as OwnerProfile).direccion || '');
      }
    }
  }, [profile, isVet]);

  const handleSave = async () => {
    if (!profileId) return;
    setSaving(true);
    setError('');
    setSuccessMsg('');

    try {
      const updateEndpoint = isVet ? `/veterinarios/${profileId}` : `/propietarios/${profileId}`;
      const body: Record<string, unknown> = { nombre, apellido, telefono };
      if (!isVet) body.direccion = direccion;

      await api.patch(updateEndpoint, body);
      setIsEditing(false);
      setSuccessMsg('Perfil actualizado correctamente.');
      refetch();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Error al guardar los cambios');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="page" style={{ display: 'flex', justifyContent: 'center', padding: '64px' }}>
        <Spinner size={40} />
      </div>
    );
  }

  const displayName = profile ? `${profile.nombre} ${profile.apellido}` : user?.email || '';
  const initials = profile
    ? `${profile.nombre?.[0] || ''}${profile.apellido?.[0] || ''}`
    : user?.email?.[0]?.toUpperCase() || '?';

  return (
    <div className="page">
      <Card>
        <div className="perfil-header">
          <div className="perfil-avatar">{initials}</div>
          <div className="perfil-header-info">
            <h2>{displayName}</h2>
            <div className="perfil-header-email">
              <Mail size={14} style={{ display: 'inline', verticalAlign: '-2px', marginRight: 4 }} />
              {profile?.usuario?.email || user?.email}
            </div>
            <div style={{ marginTop: 'var(--space-xs)' }}>
              <Badge variant="accent">
                {isVet ? (
                  <>
                    <Stethoscope size={12} /> Veterinario
                  </>
                ) : (
                  'Propietario'
                )}
              </Badge>
            </div>
          </div>
          {!isEditing && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsEditing(true)}
              style={{ marginLeft: 'auto', alignSelf: 'flex-start' }}
            >
              <Edit3 size={14} />
              Editar
            </Button>
          )}
        </div>
      </Card>

      {successMsg && (
        <div className="login-message success" style={{ marginTop: 'var(--space-md)' }}>
          {successMsg}
        </div>
      )}

      {error && (
        <div className="login-message error" style={{ marginTop: 'var(--space-md)' }}>
          {error}
        </div>
      )}

      <div className="perfil-section">
        <Card>
          <h3 className="perfil-section-title">Información Personal</h3>

          {isEditing ? (
            <div className="perfil-edit-form">
              <div className="form-row">
                <Input
                  label="Nombre"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                />
                <Input
                  label="Apellido"
                  value={apellido}
                  onChange={(e) => setApellido(e.target.value)}
                />
              </div>
              <Input
                label="Teléfono"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
              />
              {!isVet && (
                <Input
                  label="Dirección"
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                />
              )}
              <div className="perfil-edit-actions">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setIsEditing(false);
                    setError('');
                    // Reset to original values
                    if (profile) {
                      setNombre(profile.nombre);
                      setApellido(profile.apellido);
                      setTelefono(profile.telefono);
                      if (!isVet && 'direccion' in profile) {
                        setDireccion((profile as OwnerProfile).direccion || '');
                      }
                    }
                  }}
                >
                  Cancelar
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="perfil-fields">
              <div className="perfil-field">
                <span className="perfil-field-label">Nombre</span>
                <span className="perfil-field-value">{profile?.nombre || '–'}</span>
              </div>
              <div className="perfil-field">
                <span className="perfil-field-label">Apellido</span>
                <span className="perfil-field-value">{profile?.apellido || '–'}</span>
              </div>
              <div className="perfil-field">
                <span className="perfil-field-label">Teléfono</span>
                <span className="perfil-field-value">{profile?.telefono || '–'}</span>
              </div>
              <div className="perfil-field">
                <span className="perfil-field-label">Email</span>
                <span className="perfil-field-value">{profile?.usuario?.email || user?.email || '–'}</span>
              </div>
              {isVet && (
                <div className="perfil-field">
                  <span className="perfil-field-label">Matrícula</span>
                  <span className="perfil-field-value font-mono">
                    {(profile as VetProfile)?.numero_matricula || '–'}
                  </span>
                </div>
              )}
              {!isVet && (
                <div className="perfil-field">
                  <span className="perfil-field-label">Dirección</span>
                  <span className="perfil-field-value">
                    {(profile as OwnerProfile)?.direccion || '–'}
                  </span>
                </div>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
