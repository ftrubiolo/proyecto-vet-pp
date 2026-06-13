import { useState } from 'react';
import { useFetch } from '../../../hooks/useFetch';
import { api } from '../../../api/client';
import { useAuth } from '../../../hooks/useAuth';
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

        {!isOwner && (
          <>
            <div className="divider" style={{ margin: 'var(--space-md) 0' }}></div>
            <h3 style={{ fontSize: '0.9375rem', marginBottom: 'var(--space-sm)' }}>Información Clínica Crítica</h3>
            
            <div className="form-group">
              <label className="form-label">Alergias Conocidas</label>
              <textarea
                className="form-input form-textarea"
                placeholder="Ej: Penicilina, Dipirona (o 'Ninguna')"
                value={alergias}
                onChange={(e) => setAlergias(e.target.value)}
                rows={2}
              />
            </div>

            <div className="form-group" style={{ marginTop: 'var(--space-sm)' }}>
              <label className="form-label">Condiciones Crónicas</label>
              <textarea
                className="form-input form-textarea"
                placeholder="Ej: Cardiopatía congénita, Insuficiencia renal"
                value={condicionesCronicas}
                onChange={(e) => setCondicionesCronicas(e.target.value)}
                rows={2}
              />
            </div>

            <div className="form-group" style={{ marginTop: 'var(--space-sm)' }}>
              <label className="form-label">Contraindicaciones Medicamentosas</label>
              <textarea
                className="form-input form-textarea"
                placeholder="Ej: No administrar AINEs, evitar corticoides"
                value={contraindicaciones}
                onChange={(e) => setContraindicaciones(e.target.value)}
                rows={2}
              />
            </div>
          </>
        )}

        {error && (
          <div className="login-message error" style={{ marginTop: 0 }}>{error}</div>
        )}
      </form>
    </Modal>
  );
}
