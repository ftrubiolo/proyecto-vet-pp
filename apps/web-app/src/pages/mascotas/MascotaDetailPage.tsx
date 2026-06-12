import { useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  PawPrint,
  Syringe,
  Pill,
  ClipboardList,
  Calendar,
  Hash,
  X,
} from 'lucide-react';
import { useFetch } from '../../hooks/useFetch';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../api/client';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Tabs } from '../../components/ui/Tabs';
import { Spinner } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { Input, Select } from '../../components/ui/Input';
import './MascotaDetailPage.css';
import './ConsultationForm.css';

interface MascotaDetail {
  id: string;
  nombre: string;
  foto_url?: string;
  fecha_nacimiento: string;
  sexo: string;
  es_castrado: boolean;
  numero_microchip?: string;
  raza: string;
  especie: string;
  mascotas_propietarios?: {
    propietario?: {
      id: string;
      nombre: string;
      apellido: string;
      telefono: string;
    };
    tipo_relacion?: { tipo: string };
    activo: boolean;
  }[];
}

const tabs = [
  { id: 'datos', label: 'Datos' },
  { id: 'historial', label: 'Historial' },
  { id: 'vacunas', label: 'Vacunas' },
  { id: 'tratamientos', label: 'Tratamientos' },
];

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function calcAge(dateStr: string): string {
  const birth = new Date(dateStr);
  const now = new Date();
  const years = now.getFullYear() - birth.getFullYear();
  const months = now.getMonth() - birth.getMonth();
  const totalMonths = years * 12 + months;
  if (totalMonths < 12) return `${Math.max(totalMonths, 0)} meses`;
  const y = Math.floor(totalMonths / 12);
  const m = totalMonths % 12;
  return m > 0 ? `${y} año${y > 1 ? 's' : ''} y ${m} mes${m > 1 ? 'es' : ''}` : `${y} año${y > 1 ? 's' : ''}`;
}

export function MascotaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('datos');
  const { user } = useAuth();
  const isOwner = user?.rol === 'Propietario';

  const atenderCitaId = searchParams.get('atenderCitaId');
  const clinicaId = searchParams.get('clinicaId');

  // Fetch mascota general info
  const { data: mascota, isLoading, error } = useFetch<MascotaDetail>(
    id ? `/mascotas/${id}` : null
  );

  // Fetch clinical records (atenciones)
  const { data: atencionesData, isLoading: isHistorialLoading, refetch: refetchAtenciones } = useFetch<any[]>(
    id ? `/atenciones/mascota/${id}` : null
  );

  // Fetch applied vaccines (vacunas)
  const { data: vacunasData, isLoading: isVacunasLoading, refetch: refetchVacunas } = useFetch<any[]>(
    id ? `/vacunas/mascota/${id}` : null
  );

  // Fetch treatments (tratamientos)
  const { data: tratamientosData, isLoading: isTratamientosLoading, refetch: refetchTratamientos } = useFetch<any[]>(
    id ? `/tratamientos/mascota/${id}` : null
  );

  const triggerRefetches = () => {
    refetchAtenciones();
    refetchVacunas();
    refetchTratamientos();
  };

  if (isLoading) {
    return (
      <div className="page" style={{ display: 'flex', justifyContent: 'center', padding: '64px' }}>
        <Spinner size={40} />
      </div>
    );
  }

  if (error || !mascota) {
    return (
      <div className="page">
        <Card>
          <EmptyState
            icon={<PawPrint size={56} />}
            title="Mascota no encontrada"
            message="No se pudo cargar la información de esta mascota."
          />
        </Card>
      </div>
    );
  }

  const renderLeftPanel = () => (
    <div className="consultation-main-col">
      <button className="mascota-detail-back" onClick={() => navigate('/mascotas')}>
        <ArrowLeft size={16} />
        Volver a mascotas
      </button>

      <Card>
        <div className="mascota-detail-profile">
          <div className="mascota-detail-avatar">
            <PawPrint size={32} />
          </div>
          <div className="mascota-detail-info">
            <h2>{mascota.nombre}</h2>
            <div className="mascota-detail-breed">
              {mascota.raza || 'Sin raza'} · {mascota.especie || ''}
            </div>
            <div className="mascota-detail-badges">
              <Badge variant="accent">{calcAge(mascota.fecha_nacimiento)}</Badge>
              <Badge variant={mascota.sexo === 'M' ? 'accent' : 'success'}>
                {mascota.sexo === 'M' ? 'Macho' : 'Hembra'}
              </Badge>
              {mascota.es_castrado && <Badge variant="neutral">Castrado/a</Badge>}
            </div>
          </div>
        </div>
      </Card>

      <div style={{ marginTop: 'var(--space-lg)' }}>
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

        <div className="mascota-tab-content">
          {activeTab === 'datos' && <DatosTab mascota={mascota} isOwner={isOwner} />}
          {activeTab === 'historial' && <HistorialTab atenciones={atencionesData || []} isLoading={isHistorialLoading} />}
          {activeTab === 'vacunas' && <VacunasTab vacunas={vacunasData || []} isLoading={isVacunasLoading} />}
          {activeTab === 'tratamientos' && <TratamientosTab tratamientos={tratamientosData || []} isLoading={isTratamientosLoading} />}
        </div>
      </div>
    </div>
  );

  const hasActiveConsultation = atenderCitaId && clinicaId && !isOwner;

  return (
    <div className="page">
      {hasActiveConsultation ? (
        <div className="consultation-layout">
          {renderLeftPanel()}
          <div className="consultation-sidebar-col">
            <ActiveConsultationForm
              citaId={atenderCitaId!}
              clinicaId={clinicaId!}
              mascotaId={mascota.id}
              onClose={() => setSearchParams({})}
              onSuccess={() => {
                setSearchParams({});
                triggerRefetches();
                navigate('/citas');
              }}
            />
          </div>
        </div>
      ) : (
        renderLeftPanel()
      )}
    </div>
  );
}

// ── Datos Tab ──
function DatosTab({ mascota, isOwner }: { mascota: MascotaDetail; isOwner: boolean }) {
  const propietario = mascota.mascotas_propietarios?.find((mp) => mp.activo)?.propietario;

  return (
    <div>
      <Card>
        <h3 style={{ marginBottom: 'var(--space-md)', fontSize: '1rem' }}>Información General</h3>
        <div className="mascota-datos-grid">
          <div className="mascota-dato-item">
            <span className="mascota-dato-label">Nombre</span>
            <span className="mascota-dato-value">{mascota.nombre}</span>
          </div>
          <div className="mascota-dato-item">
            <span className="mascota-dato-label">Especie</span>
            <span className="mascota-dato-value">{mascota.especie || '–'}</span>
          </div>
          <div className="mascota-dato-item">
            <span className="mascota-dato-label">Raza</span>
            <span className="mascota-dato-value">{mascota.raza || '–'}</span>
          </div>
          <div className="mascota-dato-item">
            <span className="mascota-dato-label">Fecha de Nacimiento</span>
            <span className="mascota-dato-value">{formatDate(mascota.fecha_nacimiento)}</span>
          </div>
          <div className="mascota-dato-item">
            <span className="mascota-dato-label">Edad</span>
            <span className="mascota-dato-value">{calcAge(mascota.fecha_nacimiento)}</span>
          </div>
          <div className="mascota-dato-item">
            <span className="mascota-dato-label">Sexo</span>
            <span className="mascota-dato-value">{mascota.sexo === 'M' ? 'Macho' : 'Hembra'}</span>
          </div>
          <div className="mascota-dato-item">
            <span className="mascota-dato-label">Castrado/a</span>
            <span className="mascota-dato-value">{mascota.es_castrado ? 'Sí' : 'No'}</span>
          </div>
          <div className="mascota-dato-item">
            <span className="mascota-dato-label">Microchip</span>
            <span className="mascota-dato-value font-mono">{mascota.numero_microchip || '–'}</span>
          </div>
        </div>
      </Card>

      {propietario && (
        <Card style={{ marginTop: 'var(--space-md)' }}>
          <h3 style={{ marginBottom: 'var(--space-md)', fontSize: '1rem' }}>Propietario</h3>
          <div className="mascota-datos-grid">
            <div className="mascota-dato-item">
              <span className="mascota-dato-label">Nombre</span>
              <span className="mascota-dato-value">{propietario.nombre} {propietario.apellido}</span>
            </div>
            <div className="mascota-dato-item">
              <span className="mascota-dato-label">Teléfono</span>
              <span className="mascota-dato-value">{propietario.telefono}</span>
            </div>
          </div>
        </Card>
      )}

      {isOwner && (
        <Card style={{ marginTop: 'var(--space-md)' }}>
          <h3 style={{ marginBottom: 'var(--space-md)', fontSize: '1rem' }}>Código de Admisión</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 'var(--space-md)' }}>
            Compartí este código o el código QR con tu veterinario para que pueda admitir a tu mascota como paciente.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <div style={{
              background: '#fff',
              padding: '12px',
              borderRadius: '16px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
              display: 'inline-block'
            }}>
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${mascota.id}`}
                alt="Código QR de Admisión"
                style={{ width: 150, height: 150, display: 'block' }}
              />
            </div>
            <div style={{ display: 'flex', gap: 8, width: '100%', maxWidth: 350 }}>
              <input
                type="text"
                readOnly
                value={mascota.id}
                style={{
                  flex: 1,
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  fontSize: '0.8rem',
                  fontFamily: 'monospace',
                  textAlign: 'center',
                  color: 'var(--text-color)'
                }}
              />
              <Button
                onClick={() => {
                  navigator.clipboard.writeText(mascota.id);
                  alert('Código copiado al portapapeles');
                }}
                size="sm"
              >
                Copiar
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

// ── Historial Tab ──
interface HistorialTabProps {
  atenciones: any[];
  isLoading: boolean;
}

function HistorialTab({ atenciones, isLoading }: HistorialTabProps) {
  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '32px' }}>
        <Spinner />
      </div>
    );
  }

  if (atenciones.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={<ClipboardList size={48} />}
          title="Sin historial clínico"
          message="Esta mascota no tiene atenciones registradas."
        />
      </Card>
    );
  }

  return (
    <div className="timeline">
      {atenciones.map((a) => {
        const diagnostics: string[] = a.atenciones_diagnosticos?.map((ad: any) => ad.diagnostico?.diagnostico) || [];
        const vetName = a.veterinario ? `${a.veterinario.nombre} ${a.veterinario.apellido || ''}`.trim() : 'Veterinario';
        return (
          <div key={a.id} className="timeline-item">
            <div className="timeline-dot" />
            <Card variant="inner" className="timeline-content">
              <div className="timeline-date">
                <Calendar size={12} style={{ display: 'inline', verticalAlign: '-2px', marginRight: 4 }} />
                {formatDate(a.fecha_atencion)} · {vetName}
              </div>
              <div className="timeline-title">
                {diagnostics.length > 0 ? diagnostics.join(', ') : 'Consulta médica'}
              </div>
              <p className="timeline-text">{a.notes_clinicas || a.notas_clinicas || 'Sin notas adicionales.'}</p>
              {a.peso_actual && (
                <span style={{ marginTop: 8, display: 'inline-block' }}>
                  <Badge variant="neutral" className="text-sm">
                    Peso: {a.peso_actual} kg
                  </Badge>
                </span>
              )}
            </Card>
          </div>
        );
      })}
    </div>
  );
}

// ── Vacunas Tab ──
interface VacunasTabProps {
  vacunas: any[];
  isLoading: boolean;
}

function VacunasTab({ vacunas, isLoading }: VacunasTabProps) {
  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '32px' }}>
        <Spinner />
      </div>
    );
  }

  if (vacunas.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={<Syringe size={48} />}
          title="Sin vacunas registradas"
          message="Esta mascota no tiene vacunas aplicadas."
        />
      </Card>
    );
  }

  return (
    <div className="vaccine-list">
      {vacunas.map((v) => {
        const prodName = v.producto?.nombre_comercial || 'Vacuna';
        return (
          <Card key={v.id} variant="inner">
            <div className="vaccine-card">
              <div className="vaccine-icon">
                <Syringe size={18} />
              </div>
              <div className="vaccine-info">
                <div className="vaccine-name">{prodName}</div>
                <div className="vaccine-detail">
                  Aplicada: {formatDate(v.fecha_aplicacion)}
                  {v.fecha_proxima_dosis && ` · Próxima: ${formatDate(v.fecha_proxima_dosis)}`}
                </div>
                {v.numero_lote && (
                  <div className="vaccine-detail">
                    <Hash size={10} style={{ display: 'inline', verticalAlign: '-1px', marginRight: 2 }} />
                    Lote: {v.numero_lote}
                  </div>
                )}
              </div>
              {v.fecha_proxima_dosis && new Date(v.fecha_proxima_dosis) > new Date() ? (
                <Badge variant="success">Al día</Badge>
              ) : (
                <Badge variant="warning">Vencida</Badge>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}

// ── Tratamientos Tab ──
interface TratamientosTabProps {
  tratamientos: any[];
  isLoading: boolean;
}

function TratamientosTab({ tratamientos, isLoading }: TratamientosTabProps) {
  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '32px' }}>
        <Spinner />
      </div>
    );
  }

  if (tratamientos.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={<Pill size={48} />}
          title="Sin tratamientos"
          message="Esta mascota no tiene tratamientos registrados."
        />
      </Card>
    );
  }

  return (
    <div className="treatment-list">
      {tratamientos.map((t) => {
        const typeName = t.tipo_tratamiento?.tipo || 'Tratamiento';
        const prodName = t.producto?.nombre_comercial || 'Medicamento';
        return (
          <Card key={t.id} variant="inner">
            <div className="treatment-card">
              <div className="treatment-icon">
                <Pill size={18} />
              </div>
              <div className="treatment-info">
                <div className="treatment-name">
                  {typeName} — {prodName}
                </div>
                <div className="treatment-detail">
                  Dosis: {t.dosis} · Frecuencia: {t.frecuencia}
                </div>
                <div className="treatment-detail">
                  Desde: {formatDate(t.fecha_inicio)}
                  {t.fecha_fin ? ` hasta ${formatDate(t.fecha_fin)}` : ' (en curso)'}
                </div>
                {t.indicaciones_adicionales && (
                  <div className="treatment-detail" style={{ marginTop: 4, fontStyle: 'italic' }}>
                    "{t.indicaciones_adicionales}"
                  </div>
                )}
              </div>
              <Badge variant={t.fecha_fin ? 'neutral' : 'accent'}>
                {t.fecha_fin ? 'Finalizado' : 'Activo'}
              </Badge>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

// ── Autocomplete Selector Component ──
interface AutocompleteProps {
  label: string;
  placeholder: string;
  items: { id: any; name: string }[];
  onSelect: (item: { id: any; name: string }) => void;
}

function Autocomplete({ label, placeholder, items, onSelect }: AutocompleteProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const filtered = query.trim() === ''
    ? []
    : items.filter(item => item.name.toLowerCase().includes(query.toLowerCase())).slice(0, 8);

  return (
    <div className="autocomplete-container form-group" style={{ position: 'relative' }}>
      <label className="form-label">{label}</label>
      <input
        type="text"
        className="form-input"
        placeholder={placeholder}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        onBlur={() => {
          // Give small timeout so onClick triggers before list closes
          setTimeout(() => setIsOpen(false), 200);
        }}
      />
      {isOpen && filtered.length > 0 && (
        <ul className="autocomplete-results" style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          background: 'var(--surface-solid)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-inner)',
          zIndex: 1100,
          listStyle: 'none',
          padding: '4px 0',
          marginTop: '4px',
          boxShadow: 'var(--shadow)',
          maxHeight: '200px',
          overflowY: 'auto'
        }}>
          {filtered.map(item => (
            <li
              key={item.id}
              onClick={() => {
                onSelect(item);
                setQuery('');
              }}
              style={{
                padding: '8px 12px',
                cursor: 'pointer',
                fontSize: '0.875rem',
                color: 'var(--text-h)',
                borderBottom: '1px solid var(--border)'
              }}
              className="autocomplete-item"
            >
              {item.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Active Consultation Form ──
interface ActiveConsultationFormProps {
  citaId: string;
  clinicaId: string;
  mascotaId: string;
  onClose: () => void;
  onSuccess: () => void;
}

function ActiveConsultationForm({ citaId, clinicaId, mascotaId, onClose, onSuccess }: ActiveConsultationFormProps) {
  const [pesoActual, setPesoActual] = useState('');
  const [notasClinicas, setNotasClinicas] = useState('');
  const [selectedDiag, setSelectedDiag] = useState<{ id: number; name: string }[]>([]);
  const [treatments, setTreatments] = useState<any[]>([]);
  const [vacunasApplied, setVacunasApplied] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // States for treatments form
  const [tTipoId, setTTipoId] = useState('');
  const [tProducto, setTProducto] = useState<any>(null);
  const [tDosis, setTDosis] = useState('');
  const [tFrecuencia, setTFrecuencia] = useState('');
  const [tFechaInicio, setTFechaInicio] = useState(new Date().toISOString().split('T')[0]);
  const [tFechaFin, setTFechaFin] = useState('');
  const [tIndicaciones, setTIndicaciones] = useState('');

  // States for vaccines form
  const [vProducto, setVProducto] = useState<any>(null);
  const [vLote, setVLote] = useState('');
  const [vFechaAplicacion, setVFechaAplicacion] = useState(new Date().toISOString().split('T')[0]);
  const [vFechaProxima, setVFechaProxima] = useState('');

  // Fetch lookup lists
  const { data: diagnosticosRaw } = useFetch<any[]>('/catalogo/diagnosticos');
  const { data: tiposTratamiento } = useFetch<any[]>('/catalogo/tipos-tratamiento');
  const { data: productosRaw } = useFetch<any[]>('/catalogo/productos');
  const { data: vacunasRaw } = useFetch<any[]>('/catalogo/productos/vacunas');

  const lookupDiag = (diagnosticosRaw || []).map((d: any) => ({ id: d.id, name: d.diagnostico }));
  const lookupProducts = (productosRaw || []).map((p: any) => ({ id: p.id, name: p.nombre_comercial }));
  const lookupVacunas = (vacunasRaw || []).map((v: any) => ({ id: v.id, name: v.nombre_comercial }));

  const handleAddDiagnosis = (item: { id: number; name: string }) => {
    if (!selectedDiag.find(d => d.id === item.id)) {
      setSelectedDiag([...selectedDiag, item]);
    }
  };

  const handleRemoveDiagnosis = (id: number) => {
    setSelectedDiag(selectedDiag.filter(d => d.id !== id));
  };

  const handleAddTreatment = () => {
    if (!tTipoId || !tProducto || !tDosis || !tFrecuencia) {
      alert('Por favor complete todos los datos requeridos del tratamiento.');
      return;
    }
    const selectedTipo = (tiposTratamiento || []).find((tt: any) => String(tt.id) === tTipoId);
    
    setTreatments([...treatments, {
      tipo_tratamiento_id: Number(tTipoId),
      tipoName: selectedTipo?.tipo || 'Tratamiento',
      producto_id: tProducto.id,
      productoName: tProducto.name,
      dosis: tDosis,
      frecuencia: tFrecuencia,
      fecha_inicio: tFechaInicio,
      fecha_fin: tFechaFin || null,
      indicaciones_adicionales: tIndicaciones || null,
    }]);

    // Reset sub-form
    setTTipoId('');
    setTProducto(null);
    setTDosis('');
    setTFrecuencia('');
    setTIndicaciones('');
  };

  const handleRemoveTreatment = (index: number) => {
    setTreatments(treatments.filter((_, i) => i !== index));
  };

  const handleAddVacuna = () => {
    if (!vProducto) {
      alert('Por favor seleccione una vacuna.');
      return;
    }
    setVacunasApplied([...vacunasApplied, {
      producto_id: vProducto.id,
      productoName: vProducto.name,
      numero_lote: vLote || null,
      fecha_aplicacion: vFechaAplicacion,
      fecha_proxima_dosis: vFechaProxima || null,
    }]);

    setVProducto(null);
    setVLote('');
  };

  const handleRemoveVacuna = (index: number) => {
    setVacunasApplied(vacunasApplied.filter((_, i) => i !== index));
  };

  const handleFinalize = async () => {
    if (!notasClinicas.trim()) {
      alert('Por favor ingrese las notas clínicas de la consulta.');
      return;
    }

    setIsSaving(true);
    try {
      await api.post('/atenciones', {
        cita_id: citaId,
        mascota_id: mascotaId,
        clinica_id: clinicaId,
        notas_clinicas: notasClinicas,
        peso_actual: pesoActual || null,
        diagnosticos: selectedDiag.map(d => d.id),
        tratamientos: treatments.map(t => ({
          tipo_tratamiento_id: t.tipo_tratamiento_id,
          producto_id: t.producto_id,
          dosis: t.dosis,
          frecuencia: t.frecuencia,
          fecha_inicio: t.fecha_inicio,
          fecha_fin: t.fecha_fin,
          indicaciones_adicionales: t.indicaciones_adicionales,
        })),
        vacunas: vacunasApplied.map(v => ({
          producto_id: v.producto_id,
          numero_lote: v.numero_lote,
          fecha_aplicacion: v.fecha_aplicacion,
          fecha_proxima_dosis: v.fecha_proxima_dosis,
        })),
      });

      alert('Consulta finalizada y registrada con éxito.');
      onSuccess();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al guardar la consulta');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="consultation-form-section">
      <div className="consultation-form-title-bar">
        <h3>Atención Médica Activa</h3>
        <button className="consultation-close-btn" onClick={onClose} title="Cerrar Consulta">
          <X size={16} />
        </button>
      </div>

      <Input
        label="Peso del Paciente (kg)"
        type="number"
        step="0.01"
        placeholder="Ej: 12.5"
        value={pesoActual}
        onChange={(e) => setPesoActual(e.target.value)}
      />

      <div className="form-group">
        <label className="form-label">Notas Clínicas / Anamnesis *</label>
        <textarea
          className="form-input form-textarea"
          placeholder="Describa los síntomas, exploración física y estado general..."
          value={notasClinicas}
          onChange={(e) => setNotasClinicas(e.target.value)}
          required
        />
      </div>

      {/* Diagnosticos autocomplete */}
      <Autocomplete
        label="Diagnosticar (Buscador)"
        placeholder="Escriba para buscar diagnóstico..."
        items={lookupDiag}
        onSelect={handleAddDiagnosis}
      />

      {selectedDiag.length > 0 && (
        <div className="selected-badges-list">
          {selectedDiag.map(d => (
            <Badge key={d.id} variant="accent" className="selected-badge">
              {d.name}
              <button className="selected-badge-remove" onClick={() => handleRemoveDiagnosis(d.id)}>
                <X size={10} />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Recetar Tratamientos */}
      <span className="consultation-section-title">Tratamientos a Prescribir</span>
      
      <div className="consultation-subform">
        <Select
          label="Tipo"
          options={[
            { value: '', label: 'Seleccionar tipo...' },
            ...(tiposTratamiento || []).map((tt: any) => ({ value: String(tt.id), label: tt.tipo }))
          ]}
          value={tTipoId}
          onChange={(e) => setTTipoId(e.target.value)}
        />

        <Autocomplete
          label="Medicamento / Producto"
          placeholder="Escriba para buscar medicamento..."
          items={lookupProducts}
          onSelect={(item) => setTProducto(item)}
        />
        {tProducto && (
          <span style={{ fontSize: '0.8rem', color: 'var(--accent)', fontWeight: 600 }}>
            Seleccionado: {tProducto.name}
          </span>
        )}

        <div className="form-row">
          <Input
            label="Dosis"
            placeholder="Ej: 1 comp"
            value={tDosis}
            onChange={(e) => setTDosis(e.target.value)}
          />
          <Input
            label="Frecuencia"
            placeholder="Ej: Cada 12 hs"
            value={tFrecuencia}
            onChange={(e) => setTFrecuencia(e.target.value)}
          />
        </div>

        <div className="form-row">
          <Input
            label="Desde"
            type="date"
            value={tFechaInicio}
            onChange={(e) => setTFechaInicio(e.target.value)}
          />
          <Input
            label="Hasta (Opcional)"
            type="date"
            value={tFechaFin}
            onChange={(e) => setTFechaFin(e.target.value)}
          />
        </div>

        <Input
          label="Indicaciones adicionales"
          placeholder="Ej: Suministrar con alimentos"
          value={tIndicaciones}
          onChange={(e) => setTIndicaciones(e.target.value)}
        />

        <Button size="sm" type="button" onClick={handleAddTreatment}>
          Prescribir Tratamiento
        </Button>
      </div>

      {treatments.length > 0 && (
        <div className="prescribed-items-list">
          {treatments.map((t, index) => (
            <div key={index} className="prescribed-item-card">
              <div className="prescribed-item-info">
                <span className="prescribed-item-title">{t.tipoName} — {t.productoName}</span>
                <span className="prescribed-item-details">Dosis: {t.dosis} · Frecuencia: {t.frecuencia}</span>
                {t.fecha_fin && <span className="prescribed-item-details">Hasta: {t.fecha_fin}</span>}
              </div>
              <button className="prescribed-item-delete" type="button" onClick={() => handleRemoveTreatment(index)}>
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Aplicar Vacunas */}
      <span className="consultation-section-title">Vacunas Aplicadas</span>

      <div className="consultation-subform">
        <Autocomplete
          label="Vacuna"
          placeholder="Escriba para buscar vacuna..."
          items={lookupVacunas}
          onSelect={(item) => setVProducto(item)}
        />
        {vProducto && (
          <span style={{ fontSize: '0.8rem', color: 'var(--accent)', fontWeight: 600 }}>
            Seleccionado: {vProducto.name}
          </span>
        )}

        <Input
          label="Número de Lote"
          placeholder="Ej: LOTE-ABC-123"
          value={vLote}
          onChange={(e) => setVLote(e.target.value)}
        />

        <div className="form-row">
          <Input
            label="Aplicada hoy"
            type="date"
            value={vFechaAplicacion}
            onChange={(e) => setVFechaAplicacion(e.target.value)}
          />
          <Input
            label="Próxima dosis"
            type="date"
            value={vFechaProxima}
            onChange={(e) => setVFechaProxima(e.target.value)}
          />
        </div>

        <Button size="sm" type="button" onClick={handleAddVacuna}>
          Aplicar Vacuna
        </Button>
      </div>

      {vacunasApplied.length > 0 && (
        <div className="prescribed-items-list">
          {vacunasApplied.map((v, index) => (
            <div key={index} className="prescribed-item-card">
              <div className="prescribed-item-info">
                <span className="prescribed-item-title">Vacuna: {v.productoName}</span>
                <span className="prescribed-item-details">Lote: {v.numero_lote || '–'}</span>
                {v.fecha_proxima_dosis && <span className="prescribed-item-details">Próxima: {v.fecha_proxima_dosis}</span>}
              </div>
              <button className="prescribed-item-delete" type="button" onClick={() => handleRemoveVacuna(index)}>
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="consultation-actions-footer">
        <Button variant="secondary" onClick={onClose} disabled={isSaving}>Cancelar</Button>
        <Button type="button" onClick={handleFinalize} disabled={isSaving}>
          {isSaving ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Spinner size={16} />
              <span>Guardando...</span>
            </div>
          ) : (
            'Finalizar Consulta'
          )}
        </Button>
      </div>
    </div>
  );
}
