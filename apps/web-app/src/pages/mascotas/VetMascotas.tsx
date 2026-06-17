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
import './MascotasPage.css';

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
    <div className="page">
      <div className="page-header">
        <div>
          <h2 className="page-title">Pacientes</h2>
          <p className="page-subtitle">Gestión de pacientes de la clínica</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus size={16} />
          Registrar Paciente
        </Button>
      </div>

      <div className="mascotas-toolbar">
        <div className="mascotas-search">
          <Search size={16} className="mascotas-search-icon" />
          <Input
            placeholder="Buscar por nombre, raza o especie..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="mascotas-search-input"
            style={{ paddingLeft: 40 }}
          />
        </div>
        <Badge variant="neutral">{filtered.length} resultado{filtered.length !== 1 ? 's' : ''}</Badge>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '64px' }}>
          <Spinner size={40} />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
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
        <div className="mascotas-grid">
          {filtered.map((m, i) => (
            <Card
              key={m.id}
              clickable
              onClick={() => navigate(`/mascotas/${m.id}`)}
              style={{ animationDelay: `${i * 50}ms` }}
              className="mascota-card animate-fade-in-up"
            >
              <div className="mascota-card-content">
                <div className="mascota-card-avatar">
                  <PawPrint size={24} />
                </div>
                <div className="mascota-card-info">
                  <div className="mascota-card-name">{m.nombre}</div>
                  <div className="mascota-card-breed">
                    {m.raza || 'Sin raza'} · {m.especie || ''}
                  </div>
                </div>
              </div>
              <div className="mascota-card-meta">
                <span className="mascota-card-meta-item">
                  <Calendar size={12} />
                  {calcAge(m.fecha_nacimiento)}
                </span>
                <span className="mascota-card-meta-item">
                  <Tag size={12} />
                  {m.sexo === 'M' ? 'Macho' : 'Hembra'}
                </span>
                {m.es_castrado && (
                  <Badge variant="accent" className="text-sm">Castrado</Badge>
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
        <form id="create-mascota-form" className="create-mascota-form" onSubmit={handleSubmit}>
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

          <div className="sidebar-divider" style={{ margin: 'var(--space-md) 0' }}></div>

          {/* Owner Selection Section */}
          <div className="form-group" style={{ position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span className="form-label" style={{ marginBottom: 0 }}><strong>Tutor / Propietario</strong></span>
              <button
                type="button"
                className="forgot-password-btn"
                style={{ fontSize: '0.8rem', padding: 0 }}
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: 12, border: '1px dashed var(--border-color)', borderRadius: 8, background: 'var(--surface-2)' }}>
                <Input
                  label="Correo Electrónico *"
                  placeholder="ejemplo@email.com"
                  type="email"
                  value={ownerEmail}
                  onChange={(e) => setOwnerEmail(e.target.value)}
                  required
                />
                <div className="form-row">
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'var(--surface-2)', border: '1px solid var(--border-color)', borderRadius: 8 }}>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--text-color)' }}>{selectedOwner.nombre} {selectedOwner.apellido}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{selectedOwner.email} · Tel: {selectedOwner.telefono}</div>
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
              <div>
                <input
                  type="text"
                  className="form-input"
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
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>Buscando...</div>
                )}
                {showOwnerDropdown && ownerSearchResults.length > 0 && (
                  <ul className="autocomplete-results" style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    background: 'var(--surface-solid)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-inner)',
                    zIndex: 1200,
                    listStyle: 'none',
                    padding: '4px 0',
                    marginTop: '4px',
                    boxShadow: 'var(--shadow)',
                    maxHeight: '180px',
                    overflowY: 'auto'
                  }}>
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
                        style={{
                          padding: '8px 12px',
                          cursor: 'pointer',
                          fontSize: '0.82rem',
                          color: 'var(--text-color)',
                          borderBottom: '1px solid var(--border-color)'
                        }}
                        className="autocomplete-item"
                      >
                        <div><strong>{owner.nombre} {owner.apellido}</strong></div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{owner.email} · {owner.telefono}</div>
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
            <div className="login-message error" style={{ marginTop: 0 }}>{error}</div>
          )}
        </form>
      ) : (
        <div className="create-mascota-form">
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', marginBottom: 'var(--space-md)' }}>
            <div style={{ flex: 1 }}>
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
              style={{ marginBottom: 4 }}
            >
              {searching ? 'Buscando...' : 'Buscar'}
            </Button>
          </div>

          {foundPet && (
            <div style={{
              background: 'var(--surface-2)',
              padding: 'var(--space-md)',
              borderRadius: '12px',
              border: '1px solid var(--border-color)',
              marginBottom: 'var(--space-md)',
              animation: 'fadeIn 0.2s ease'
            }}>
              <h4 style={{ margin: '0 0 var(--space-xs) 0', color: 'var(--primary-color)' }}>Mascota Encontrada</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.9rem' }}>
                <div><strong>Nombre:</strong> {foundPet.nombre}</div>
                <div><strong>Sexo:</strong> {foundPet.sexo === 'M' ? 'Macho' : 'Hembra'}</div>
                <div><strong>Especie:</strong> {foundPet.especie}</div>
                <div><strong>Raza:</strong> {foundPet.raza}</div>
                <div style={{ gridColumn: 'span 2', marginTop: 4 }}>
                  <strong>Propietario:</strong> {foundPet.propietario}
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="login-message error" style={{ marginTop: 0, marginBottom: 'var(--space-md)' }}>{error}</div>
          )}
        </div>
      )}
    </Modal>
  );
}
