import { useState, useEffect, useRef } from 'react';
import { Edit3, Upload, X } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { useToast } from '../../../hooks/useToast';
import { api, apiUpload } from '../../../api/client';
import type { VetProfile, OwnerProfile } from '@vetvault/shared';

interface PersonalInfoTabProps {
  profile: VetProfile | OwnerProfile;
  profileId: string;
  isVet: boolean;
  refetch: () => void;
}

export function PersonalInfoTab({ profile, profileId, isVet, refetch }: PersonalInfoTabProps) {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [telefono, setTelefono] = useState('');
  const [direccion, setDireccion] = useState('');
  const [fotoUrl, setFotoUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
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
      toast.success('Imagen subida correctamente');
    } catch (err: any) {
      const msg = err.message || 'Error al subir la imagen';
      toast.error(msg);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSave = async () => {
    if (!profileId) return;
    setSaving(true);
    setSuccessMsg('');

    try {
      const updateEndpoint = isVet ? `/veterinarios/${profileId}` : `/propietarios/${profileId}`;
      const body: Record<string, unknown> = { nombre, apellido, telefono, foto_url: fotoUrl || null };
      if (!isVet) body.direccion = direccion;

      await api.patch(updateEndpoint, body);
      setIsEditing(false);
      setSuccessMsg('Perfil actualizado correctamente.');
      toast.success('Perfil actualizado correctamente');
      refetch();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      const msg = err.message || 'Error al guardar los cambios';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="p-6 border border-[var(--border)]">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-base font-bold text-[var(--text-h)]">Información Personal</h3>
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
        <div className="p-3 rounded-xl text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 mb-4">
          {successMsg}
        </div>
      )}

      {isEditing ? (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[var(--text-h)]">Foto de perfil</label>
            <div className="flex items-center gap-4">
              {fotoUrl ? (
                <div className="relative w-24 h-24 rounded-xl overflow-hidden border-2 border-[var(--border)] flex-shrink-0 group">
                  <img src={fotoUrl} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => setFotoUrl('')}
                    title="Eliminar foto"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div
                  className="w-24 h-24 border-2 border-dashed border-[var(--border)] rounded-xl flex flex-col items-center justify-center gap-1 text-[var(--text-muted)] cursor-pointer hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors flex-shrink-0 text-xs text-center p-1"
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
          <div className="flex justify-end gap-3 mt-2">
            <Button
              variant="secondary"
              onClick={() => {
                setIsEditing(false);
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Nombre</span>
            <span className="text-sm font-semibold text-[var(--text-h)]">{profile?.nombre || '–'}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Apellido</span>
            <span className="text-sm font-semibold text-[var(--text-h)]">{profile?.apellido || '–'}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Teléfono</span>
            <span className="text-sm font-semibold text-[var(--text-h)]">{profile?.telefono || '–'}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Email</span>
            <span className="text-sm font-semibold text-[var(--text-h)]">{profile?.usuario?.email || '–'}</span>
          </div>
          {isVet && (
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Matrícula</span>
              <span className="text-sm font-semibold text-[var(--text-h)] font-mono">
                {(profile as VetProfile)?.numero_matricula || '–'}
              </span>
            </div>
          )}
          {!isVet && (
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Dirección</span>
              <span className="text-sm font-semibold text-[var(--text-h)]">
                {(profile as OwnerProfile)?.direccion || '–'}
              </span>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
