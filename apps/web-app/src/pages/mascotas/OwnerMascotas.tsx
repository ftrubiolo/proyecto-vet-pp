import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PawPrint, Search, Plus, Calendar, Tag } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useFetch } from '../../hooks/useFetch';
import { useToast } from '../../hooks/useToast';
import { api } from '../../api/client';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Spinner } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { Autocomplete } from './components/Autocomplete';

import { type Mascota, type MascotasResponse, type Especie, calcAge } from '@vetvault/shared';

export function OwnerMascotas() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Fetch mascotas (Unified endpoint)
  const { data: mascotasData, isLoading, refetch } = useFetch<MascotasResponse | Mascota[]>('/mascotas');

  const mascotas: Mascota[] = Array.isArray(mascotasData)
    ? mascotasData
    : (mascotasData as MascotasResponse)?.mascotas || [];

  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  // Filter
  const filtered = mascotas.filter((m) =>
    m.nombre.toLowerCase().includes(search.toLowerCase()) ||
    m.raza?.toLowerCase().includes(search.toLowerCase()) ||
    m.especie?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[var(--text-h)] font-[var(--heading)]">Mis Mascotas</h2>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">Tus mascotas registradas</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus size={16} />
          Agregar Mascota
        </Button>
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none z-10" />
          <Input
            placeholder="Buscar por nombre, raza o especie..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Badge variant="neutral">{filtered.length} resultado{filtered.length !== 1 ? 's' : ''}</Badge>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-16">
          <Spinner size={40} />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-8 border border-[var(--border)]">
          <EmptyState
            icon={<PawPrint size={56} />}
            title={search ? 'Sin resultados' : 'Sin mascotas registradas'}
            message={
              search
                ? `No se encontraron mascotas que coincidan con "${search}"`
                : 'Agregá tu primera mascota para comenzar.'
            }
            action={
              !search ? (
                <Button onClick={() => setShowCreate(true)}>
                  <Plus size={16} />
                  Agregar Mascota
                </Button>
              ) : undefined
            }
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((m, i) => (
            <Card
              key={m.id}
              clickable
              onClick={() => navigate(`/mascotas/${m.id}`)}
              style={{ animationDelay: `${i * 50}ms` }}
              className="p-4 border border-[var(--border)] hover:border-[var(--accent)]/50 transition-all"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-14 h-14 rounded-full bg-[var(--accent-light)] flex items-center justify-center text-[var(--accent)] flex-shrink-0">
                  <PawPrint size={24} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-base text-[var(--text-h)] truncate">{m.nombre}</div>
                  <div className="text-xs text-[var(--text-muted)] truncate">
                    {m.raza || 'Sin raza'} · {m.especie || ''}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 mt-3 pt-3 border-t border-[var(--border)] text-xs text-[var(--text-muted)]">
                <span className="flex items-center gap-1">
                  <Calendar size={12} />
                  {calcAge(m.fecha_nacimiento)}
                </span>
                <span className="flex items-center gap-1">
                  <Tag size={12} />
                  {m.sexo === 'M' ? 'Macho' : 'Hembra'}
                </span>
                {m.es_castrado && (
                  <Badge variant="accent" className="text-xs">Castrado</Badge>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {showCreate && (
        <CreateMascotaModal
          userId={user?.proId}
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            refetch();
          }}
        />
      )}
    </div>
  );
}

// ── Create Mascota Modal (Owner simplified) ──
interface CreateMascotaModalProps {
  userId?: string;
  onClose: () => void;
  onCreated: () => void;
}

function CreateMascotaModal({ userId, onClose, onCreated }: CreateMascotaModalProps) {
  const { toast } = useToast();
  const [nombre, setNombre] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [sexo, setSexo] = useState('');
  const [razaId, setRazaId] = useState('');
  const [esCastrado, setEsCastrado] = useState(false);
  const [tipoRelacionId, setTipoRelacionId] = useState('1'); // Por defecto 'Dueño'
  const [saving, setSaving] = useState(false);

  // Fetch especies (with razas)
  const { data: especies } = useFetch<Especie[]>('/catalogo/especies');
  const { data: tiposRelacion } = useFetch<{ id: number; tipo: string }[]>('/catalogo/mascotas/tipos-relacion');

  // Flatten razas for select
  const razaItems = (especies || []).flatMap((e) =>
    e.razas.map((r) => ({ id: String(r.id), name: `${r.raza} (${e.especie})` }))
  );

  const selectedRaza = razaItems.find(item => item.id === razaId);
  const currentRazaName = selectedRaza ? selectedRaza.name : '';

  const tipoRelacionOptions = (tiposRelacion || []).map((t) => ({
    value: t.id,
    label: t.tipo,
  }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) {
      toast.error('No se pudo identificar tu perfil de propietario.');
      return;
    }
    setSaving(true);

    try {
      await api.post('/mascotas', {
        mascota: {
          nombre,
          fecha_nacimiento: fechaNacimiento,
          sexo,
          raza_id: Number(razaId),
          es_castrado: esCastrado,
        },
        propietario: {
          propietario_id: userId,
          tipo_relacion_id: Number(tipoRelacionId),
        },
      });
      toast.success('Mascota registrada exitosamente');
      onCreated();
    } catch (err: any) {
      const msg = err.message || 'Error al crear mascota';
      toast.error(msg);
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Agregar Mascota"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit" form="create-mascota-form" disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar'}
          </Button>
        </>
      }
    >
      <form id="create-mascota-form" className="flex flex-col gap-4" onSubmit={handleSubmit}>
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

        <Select
          label="Tipo de Relación"
          options={tipoRelacionOptions}
          value={tipoRelacionId}
          onChange={(e) => setTipoRelacionId(e.target.value)}
          required
        />
      </form>
    </Modal>
  );
}
