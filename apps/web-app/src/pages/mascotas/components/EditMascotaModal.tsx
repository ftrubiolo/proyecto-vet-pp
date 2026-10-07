import { useState, useRef } from 'react';
import { Upload, X } from 'lucide-react';
import { useFetch } from '../../../hooks/useFetch';
import { api, apiUpload } from '../../../api/client';
import { useAuth } from '../../../hooks/useAuth';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Input, Select } from '../../../components/ui/Input';
import { Autocomplete } from './Autocomplete';
import type { MascotaDetail, Especie } from '@vetvault/shared';

interface EditMascotaModalProps {
  mascota: MascotaDetail;
  onClose: () => void;
  onUpdated: () => void;
}

export function EditMascotaModal({ mascota, onClose, onUpdated }: EditMascotaModalProps) {
  const { user } = useAuth();
  const isOwner = user?.rol === 'Propietario';

  const [nombre, setNombre] = useState(mascota.nombre);
  const [fechaNacimiento, setFechaNacimiento] = useState(
    mascota.fecha_nacimiento ? mascota.fecha_nacimiento.substring(0, 10) : ''
  );
  const [sexo, setSexo] = useState(mascota.sexo);
  const [esCastrado, setEsCastrado] = useState(mascota.es_castrado);
  const [numeroMicrochip, setNumeroMicrochip] = useState(mascota.numero_microchip || '');
  const [fotoUrl, setFotoUrl] = useState(mascota.foto_url || '');
  const [alergias, setAlergias] = useState(mascota.alergias || '');
  const [condicionesCronicas, setCondicionesCronicas] = useState(mascota.condiciones_cronicas || '');
  const [contraindicaciones, setContraindicaciones] = useState(mascota.contraindicaciones || '');
  const [razaId, setRazaId] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: especies, isLoading: isCatalogLoading } = useFetch<Especie[]>('/catalogo/especies');

  const razaItems = (especies || []).flatMap((e) =>
    e.razas.map((r) => ({ id: String(r.id), name: `${r.raza} (${e.especie})` }))
  );

  const matchedRaza = (especies || [])
    .flatMap((e) => e.razas)
    .find((r) => r.raza === mascota.raza);
  const resolvedRazaId = razaId || (matchedRaza ? String(matchedRaza.id) : '');

  const selectedItem = razaItems.find((item) => item.id === resolvedRazaId);
  const currentRazaName = selectedItem ? selectedItem.name : (mascota.raza ? `${mascota.raza} (${mascota.especie})` : '');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const result = await apiUpload('/upload', file, 'mascotas');
      setFotoUrl(result.url);
    } catch (err: any) {
      setError(err.message || 'Error al subir la imagen');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvedRazaId) {
      setError('Por favor seleccione una raza.');
      return;
    }
    setSaving(true);
    setError('');

    try {
      const payload: any = {
        nombre,
        fecha_nacimiento: fechaNacimiento,
        sexo,
        raza_id: Number(resolvedRazaId),
        es_castrado: esCastrado,
        numero_microchip: numeroMicrochip || null,
        foto_url: fotoUrl || null,
      };

      if (!isOwner) {
        payload.alergias = alergias || null;
        payload.condiciones_cronicas = condicionesCronicas || null;
        payload.contraindicaciones = contraindicaciones || null;
      }

      await api.patch(`/mascotas/${mascota.id}`, payload);
      onUpdated();
    } catch (err: any) {
      setError(err.message || 'Error al actualizar mascota');
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Editar Datos de Mascota"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit" form="edit-mascota-form" disabled={saving || isCatalogLoading}>
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </>
      }
    >
      <form id="edit-mascota-form" className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <Input
          label="Nombre"
          placeholder="Nombre de la mascota"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Fecha de Nacimiento"
            type="date"
            value={fechaNacimiento}
            onChange={(e) => setFechaNacimiento(e.target.value)}
            required
          />
          <Select
            label="Sexo"
            options={[
              { value: 'M', label: 'Macho' },
              { value: 'H', label: 'Hembra' },
            ]}
            value={sexo}
            onChange={(e) => setSexo(e.target.value)}
            required
          />
        </div>
        <Autocomplete
          label="Raza"
          placeholder="Escriba para buscar raza..."
          items={razaItems}
          onSelect={(item) => setRazaId(item.id)}
          valueName={currentRazaName}
          clearOnSelect={false}
        />
        <Input
          label="Número de Microchip"
          placeholder="Ej: 981020000..."
          value={numeroMicrochip}
          onChange={(e) => setNumeroMicrochip(e.target.value)}
        />
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-[var(--text-h)]">Foto</label>
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
                <span>{uploading ? 'Subiendo...' : 'Haz clic para subir foto'}</span>
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
        <div className="flex flex-col gap-1.5">
          <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-[var(--text-h)]">
            <input
              type="checkbox"
              checked={esCastrado}
              onChange={(e) => setEsCastrado(e.target.checked)}
              className="w-4 h-4 cursor-pointer accent-[var(--accent)]"
            />
            Castrado/a
          </label>
        </div>

        {!isOwner && (
          <>
            <div className="h-[1px] bg-[var(--border)] my-2" />
            <h3 className="text-sm font-bold text-[var(--text-h)] mb-1">Información Clínica Crítica</h3>
            
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[var(--text-h)]">Alergias Conocidas</label>
              <textarea
                className="w-full p-2.5 bg-[var(--surface-solid)] border border-[var(--border)] rounded-xl text-sm text-[var(--text-h)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-light)] outline-none min-h-[60px] resize-y"
                placeholder="Ej: Penicilina, Dipirona (o 'Ninguna')"
                value={alergias}
                onChange={(e) => setAlergias(e.target.value)}
                rows={2}
              />
            </div>

            <div className="flex flex-col gap-1.5 mt-2">
              <label className="text-xs font-semibold text-[var(--text-h)]">Condiciones Crónicas</label>
              <textarea
                className="w-full p-2.5 bg-[var(--surface-solid)] border border-[var(--border)] rounded-xl text-sm text-[var(--text-h)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-light)] outline-none min-h-[60px] resize-y"
                placeholder="Ej: Cardiopatía congénita, Insuficiencia renal"
                value={condicionesCronicas}
                onChange={(e) => setCondicionesCronicas(e.target.value)}
                rows={2}
              />
            </div>

            <div className="flex flex-col gap-1.5 mt-2">
              <label className="text-xs font-semibold text-[var(--text-h)]">Contraindicaciones Medicamentosas</label>
              <textarea
                className="w-full p-2.5 bg-[var(--surface-solid)] border border-[var(--border)] rounded-xl text-sm text-[var(--text-h)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-light)] outline-none min-h-[60px] resize-y"
                placeholder="Ej: No administrar AINEs, evitar corticoides"
                value={contraindicaciones}
                onChange={(e) => setContraindicaciones(e.target.value)}
                rows={2}
              />
            </div>
          </>
        )}

        {error && (
          <div className="p-3 rounded-xl text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/25">{error}</div>
        )}
      </form>
    </Modal>
  );
}
