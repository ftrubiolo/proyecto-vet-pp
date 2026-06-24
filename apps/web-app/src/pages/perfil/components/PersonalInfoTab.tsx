import { useState, useEffect, useRef } from 'react';
import { Edit3, Upload, X } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { api, apiUpload } from '../../../api/client';
import type { VetProfile, OwnerProfile } from '@vetvault/shared';

interface PersonalInfoTabProps {
  profile: VetProfile | OwnerProfile;
  profileId: string;
  isVet: boolean;
  refetch: () => void;
}

export function PersonalInfoTab({ profile, profileId, isVet, refetch }: PersonalInfoTabProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [telefono, setTelefono] = useState('');
  const [direccion, setDireccion] = useState('');
  const [fotoUrl, setFotoUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile) {
      setNombre(profile.nombre || '');
      setApellido(profile.apellido || '');
      setTelefono(profile.telefono || '');
      setFotoUrl(profile.foto_url || '');
      if (!isVet && 'direccion' in profile) {
        setDireccion((profile as OwnerProfile).direccion || '');
      }
    }
  }, [profile, isVet]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const result = await apiUpload('/upload', file, isVet ? 'veterinarios' : 'propietarios');
      setFotoUrl(result.url);
    } catch (err: any) {
      setError(err.message || 'Error al subir la imagen');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSave = async () => {
    if (!profileId) return;
    setSaving(true);
    setError('');
    setSuccessMsg('');

    try {
      const updateEndpoint = isVet ? `/veterinarios/${profileId}` : `/propietarios/${profileId}`;
      const body: Record<string, unknown> = { nombre, apellido, telefono, foto_url: fotoUrl || null };
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

  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
        <h3 className="perfil-section-title" style={{ marginBottom: 0 }}>Información Personal</h3>
        {!isEditing && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsEditing(true)}
          >
            <Edit3 size={14} />
            Editar
          </Button>
        )}
      </div>

      {successMsg && (
        <div className="login-message success" style={{ marginBottom: 'var(--space-md)' }}>
          {successMsg}
        </div>
      )}

      {error && (
        <div className="login-message error" style={{ marginBottom: 'var(--space-md)' }}>
          {error}
        </div>
      )}

      {isEditing ? (
        <div className="perfil-edit-form">
          <div className="form-group">
            <label className="form-label">Foto de perfil</label>
            <div className="upload-photo-wrapper">
              {fotoUrl ? (
                <div className="upload-photo-preview">
                  <img src={fotoUrl} alt="Preview" />
                  <button
                    type="button"
                    className="upload-photo-remove"
                    onClick={() => setFotoUrl('')}
                    title="Eliminar foto"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div
                  className="upload-photo-placeholder"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload size={24} />
                  <span>{uploading ? 'Subiendo...' : 'Subir foto'}</span>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
                disabled={uploading}
              />
            </div>
          </div>
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
            <span className="perfil-field-value">{profile?.usuario?.email || '–'}</span>
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
  );
}
