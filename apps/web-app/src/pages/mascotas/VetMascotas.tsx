import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PawPrint, Search, Plus, Calendar, Tag } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useFetch } from '../../hooks/useFetch';
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

export function VetMascotas() {
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
          <h2 className="text-2xl font-bold text-[var(--text-h)] font-[var(--heading)]">Pacientes</h2>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">Gestión de pacientes de la clínica</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus size={16} />
          Registrar Paciente
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
            title={search ? 'Sin resultados' : 'Sin pacientes registrados'}
            message={
              search
                ? `No se encontraron pacientes que coincidan con "${search}"`
                : 'Registrá tu primer paciente para comenzar.'
            }
            action={
              !search ? (
                <Button onClick={() => setShowCreate(true)}>
                  <Plus size={16} />
                  Registrar Paciente
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
        <CreatePacienteModal
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

// ── Create Paciente Modal (Vet only) ──
interface CreatePacienteModalProps {
  onClose: () => void;
  onCreated: () => void;
}

function CreatePacienteModal({ onClose, onCreated }: CreatePacienteModalProps) {
  const { user } = useAuth();
  const [mode, setMode] = useState<'create' | 'admit'>('create');

  // Create mode state
  const [nombre, setNombre] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [sexo, setSexo] = useState('');
  const [razaId, setRazaId] = useState('');
  const [esCastrado, setEsCastrado] = useState(false);
  const [propietarioId, setPropietarioId] = useState('');
  const [tipoRelacionId, setTipoRelacionId] = useState('1');
  const [saving, setSaving] = useState(false);

  // Autocomplete Owner search states
  const [ownerSearchQuery, setOwnerSearchQuery] = useState('');
  const [ownerSearchResults, setOwnerSearchResults] = useState<any[]>([]);
  const [isSearchingOwners, setIsSearchingOwners] = useState(false);
  const [showOwnerDropdown, setShowOwnerDropdown] = useState(false);
  const [selectedOwner, setSelectedOwner] = useState<any | null>(null);

  // New/Temp owner fields state
  const [isNewOwnerMode, setIsNewOwnerMode] = useState(false);
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerNombre, setOwnerNombre] = useState('');
  const [ownerApellido, setOwnerApellido] = useState('');
  const [ownerTelefono, setOwnerTelefono] = useState('');

  // Admit mode state
  const [admissionCode, setAdmissionCode] = useState('');
  const [searching, setSearching] = useState(false);
  const [foundPet, setFoundPet] = useState<{ id: string; nombre: string; especie: string; raza: string; propietario: string; sexo: string } | null>(null);
  const [admitting, setAdmitting] = useState(false);

  const [error, setError] = useState('');

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

  // Debounce API search for owners
  useEffect(() => {
    if (ownerSearchQuery.trim().length < 2) {
      setOwnerSearchResults([]);
      return;
    }
    const delayDebounce = setTimeout(async () => {
      setIsSearchingOwners(true);
      try {
        const results = await api.get<any[]>(`/propietarios/buscar?q=${encodeURIComponent(ownerSearchQuery)}`);
        setOwnerSearchResults(results || []);
      } catch (err) {
        console.error('Error searching owners:', err);
      } finally {
        setIsSearchingOwners(false);
      }
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [ownerSearchQuery]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    const propietarioData: any = {
      tipo_relacion_id: Number(tipoRelacionId),
    };

    if (isNewOwnerMode) {
      if (!ownerEmail || !ownerNombre || !ownerApellido || !ownerTelefono) {
        setError('Por favor complete todos los datos del nuevo tutor');
        setSaving(false);
        return;
      }
      propietarioData.email = ownerEmail;
      propietarioData.nombre = ownerNombre;
      propietarioData.apellido = ownerApellido;
      propietarioData.telefono = ownerTelefono;
    } else {
      if (!propietarioId) {
        setError('Por favor seleccione un tutor existente o cree uno nuevo');
        setSaving(false);
        return;
      }
      propietarioData.propietario_id = propietarioId;
    }

    try {
      await api.post('/mascotas', {
        mascota: {
          nombre,
          fecha_nacimiento: fechaNacimiento,
          sexo,
          raza_id: Number(razaId),
          es_castrado: esCastrado,
        },
        propietario: propietarioData,
      });
      onCreated();
    } catch (err: any) {
      setError(err.message || 'Error al crear mascota');
      setSaving(false);
    }
  };

  const handleSearchPet = async () => {
    if (!admissionCode) return;
    setSearching(true);
    setError('');
    setFoundPet(null);
    try {
      const pet = await api.get<any>(`/mascotas/buscar-existente/${admissionCode.trim()}`);
      setFoundPet(pet);
    } catch (err: any) {
      setError(err.message || 'Mascota no encontrada o código inválido');
    } finally {
      setSearching(false);
    }
  };

  const handleAdmitPet = async () => {
    if (!foundPet) return;
    const clinicaId = user?.clinicas?.[0]?.id;
    if (!clinicaId) {
      setError('No tienes una clínica asociada para admitir pacientes.');
      return;
    }
    setAdmitting(true);
    setError('');
    try {
      await api.post(`/clinicas/${clinicaId}/admision`, {
        mascotaId: foundPet.id
      });
      onCreated();
    } catch (err: any) {
      setError(err.message || 'Error al admitir paciente');
    } finally {
      setAdmitting(false);
    }
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Registrar Paciente"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          {mode === 'create' ? (
            <Button type="submit" form="create-mascota-form" disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar'}
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleAdmitPet}
              disabled={admitting || !foundPet}
            >
              {admitting ? 'Admitiendo...' : 'Admitir Paciente'}
            </Button>
          )}
        </>
      }
    >
      <div style={{ display: 'flex', gap: 12, marginBottom: 'var(--space-md)' }}>
        <Button
          type="button"
          variant={mode === 'create' ? 'primary' : 'secondary'}
          onClick={() => { setMode('create'); setError(''); }}
          style={{ flex: 1 }}
        >
          Nuevo Paciente
        </Button>
        <Button
          type="button"
          variant={mode === 'admit' ? 'primary' : 'secondary'}
          onClick={() => { setMode('admit'); setError(''); }}
          style={{ flex: 1 }}
        >
          Paciente Existente
        </Button>
      </div>

      {mode === 'create' ? (
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

          <div className="h-[1px] bg-[var(--border)] my-2" />

          {/* Owner Selection Section */}
          <div className="relative flex flex-col gap-1.5">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-semibold text-[var(--text-h)]">Tutor / Propietario</span>
              <button
                type="button"
                className="text-xs font-semibold text-[var(--accent)] hover:underline cursor-pointer bg-transparent border-0 p-0"
                onClick={() => {
                  setIsNewOwnerMode(!isNewOwnerMode);
                  setSelectedOwner(null);
                  setPropietarioId('');
                  setError('');
                }}
              >
                {isNewOwnerMode ? 'Buscar tutor existente' : 'Crear tutor temporal'}
              </button>
            </div>

            {isNewOwnerMode ? (
              <div className="flex flex-col gap-3 p-3.5 border border-dashed border-[var(--border)] rounded-xl bg-[var(--surface-2)]">
                <Input
                  label="Correo Electrónico *"
                  placeholder="ejemplo@email.com"
                  type="email"
                  value={ownerEmail}
                  onChange={(e) => setOwnerEmail(e.target.value)}
                  required
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="Nombre *"
                    placeholder="Nombre"
                    value={ownerNombre}
                    onChange={(e) => setOwnerNombre(e.target.value)}
                    required
                  />
                  <Input
                    label="Apellido *"
                    placeholder="Apellido"
                    value={ownerApellido}
                    onChange={(e) => setOwnerApellido(e.target.value)}
                    required
                  />
                </div>
                <Input
                  label="Teléfono *"
                  placeholder="Ej: 357315443322"
                  value={ownerTelefono}
                  onChange={(e) => setOwnerTelefono(e.target.value)}
                  required
                />
              </div>
            ) : selectedOwner ? (
              <div className="flex justify-between items-center p-3 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl">
                <div>
                  <div className="text-sm font-semibold text-[var(--text-h)]">{selectedOwner.nombre} {selectedOwner.apellido}</div>
                  <div className="text-xs text-[var(--text-muted)]">{selectedOwner.email} · Tel: {selectedOwner.telefono}</div>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setSelectedOwner(null);
                    setPropietarioId('');
                  }}
                >
                  Cambiar
                </Button>
              </div>
            ) : (
              <div className="relative">
                <input
                  type="text"
                  className="w-full px-3.5 py-2.5 bg-[var(--surface-solid)] border border-[var(--border)] rounded-xl text-sm text-[var(--text-h)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-light)] outline-none"
                  placeholder="Buscar por nombre, email o teléfono..."
                  value={ownerSearchQuery}
                  onChange={(e) => {
                    setOwnerSearchQuery(e.target.value);
                    setShowOwnerDropdown(true);
                  }}
                  onFocus={() => setShowOwnerDropdown(true)}
                  onBlur={() => {
                    setTimeout(() => setShowOwnerDropdown(false), 200);
                  }}
                />
                {isSearchingOwners && (
                  <div className="text-xs text-[var(--text-muted)] mt-1">Buscando...</div>
                )}
                {showOwnerDropdown && ownerSearchResults.length > 0 && (
                  <ul className="absolute top-full left-0 right-0 bg-[var(--surface-solid)] border border-[var(--border)] rounded-xl z-[1200] list-none py-1 mt-1 shadow-xl max-h-48 overflow-y-auto">
                    {ownerSearchResults.map(owner => (
                      <li
                        key={owner.id}
                        onClick={() => {
                          setSelectedOwner(owner);
                          setPropietarioId(owner.id);
                          setOwnerSearchQuery('');
                          setOwnerSearchResults([]);
                          setShowOwnerDropdown(false);
                        }}
                        className="px-3.5 py-2 cursor-pointer border-b border-[var(--border)] last:border-b-0 hover:bg-[var(--accent-light)] hover:text-[var(--accent)] transition-colors"
                      >
                        <div className="text-sm font-semibold text-[var(--text-h)]">{owner.nombre} {owner.apellido}</div>
                        <div className="text-xs text-[var(--text-muted)]">{owner.email} · {owner.telefono}</div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          <Select
            label="Tipo de Relación"
            options={tipoRelacionOptions}
            value={tipoRelacionId}
            onChange={(e) => setTipoRelacionId(e.target.value)}
            required
          />

          {error && (
            <div className="p-3 rounded-xl text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/25">{error}</div>
          )}
        </form>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <Input
                label="Código de Mascota (UUID)"
                placeholder="Ingrese el UUID de la mascota"
                value={admissionCode}
                onChange={(e) => setAdmissionCode(e.target.value)}
                onKeyDown={(e: any) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSearchPet();
                  }
                }}
                required
              />
            </div>
            <Button
              type="button"
              onClick={handleSearchPet}
              disabled={searching || !admissionCode}
              className="mb-1"
            >
              {searching ? 'Buscando...' : 'Buscar'}
            </Button>
          </div>

          {foundPet && (
            <div className="bg-[var(--surface-2)] p-4 rounded-xl border border-[var(--border)] space-y-2 animate-fade-in">
              <h4 className="text-sm font-bold text-[var(--accent)]">Mascota Encontrada</h4>
              <div className="grid grid-cols-2 gap-2 text-sm text-[var(--text)]">
                <div><strong className="text-[var(--text-h)]">Nombre:</strong> {foundPet.nombre}</div>
                <div><strong className="text-[var(--text-h)]">Sexo:</strong> {foundPet.sexo === 'M' ? 'Macho' : 'Hembra'}</div>
                <div><strong className="text-[var(--text-h)]">Especie:</strong> {foundPet.especie}</div>
                <div><strong className="text-[var(--text-h)]">Raza:</strong> {foundPet.raza}</div>
                <div className="col-span-2 mt-1">
                  <strong className="text-[var(--text-h)]">Propietario:</strong> {foundPet.propietario}
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-xl text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/25">{error}</div>
          )}
        </div>
      )}
    </Modal>
  );
}
