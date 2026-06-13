import { useState } from 'react';
import { useFetch } from '../../../hooks/useFetch';
import { api } from '../../../api/client';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Input, Select } from '../../../components/ui/Input';
import { Autocomplete } from './Autocomplete';
import type { MascotaDetail, Especie } from '../types';

interface EditMascotaModalProps {
  mascota: MascotaDetail;
  onClose: () => void;
  onUpdated: () => void;
}

export function EditMascotaModal({ mascota, onClose, onUpdated }: EditMascotaModalProps) {
  const [nombre, setNombre] = useState(mascota.nombre);
  const [fechaNacimiento, setFechaNacimiento] = useState(
    mascota.fecha_nacimiento ? mascota.fecha_nacimiento.substring(0, 10) : ''
  );
  const [sexo, setSexo] = useState(mascota.sexo);
  const [esCastrado, setEsCastrado] = useState(mascota.es_castrado);
  const [numeroMicrochip, setNumeroMicrochip] = useState(mascota.numero_microchip || '');
  const [fotoUrl, setFotoUrl] = useState(mascota.foto_url || '');
  const [razaId, setRazaId] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvedRazaId) {
      setError('Por favor seleccione una raza.');
      return;
    }
    setSaving(true);
    setError('');

    try {
      await api.patch(`/mascotas/${mascota.id}`, {
        nombre,
        fecha_nacimiento: fechaNacimiento,
        sexo,
        raza_id: Number(resolvedRazaId),
        es_castrado: esCastrado,
        numero_microchip: numeroMicrochip || null,
        foto_url: fotoUrl || null,
      });
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
      <form id="edit-mascota-form" className="create-mascota-form" onSubmit={handleSubmit}>
        <Input
          label="Nombre"
          placeholder="Nombre de la mascota"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
        />
        <div className="form-row">
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
        <Input
          label="URL de Foto"
          placeholder="https://ejemplo.com/foto.jpg"
          value={fotoUrl}
          onChange={(e) => setFotoUrl(e.target.value)}
        />
        <div className="form-group">
          <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={esCastrado}
              onChange={(e) => setEsCastrado(e.target.checked)}
              style={{ width: 16, height: 16 }}
            />
            Castrado/a
          </label>
        </div>

        {error && (
          <div className="login-message error" style={{ marginTop: 0 }}>{error}</div>
        )}
      </form>
    </Modal>
  );
}
