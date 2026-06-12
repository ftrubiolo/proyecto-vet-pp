import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  PawPrint,
  Syringe,
  Pill,
  ClipboardList,
  Calendar,
  Hash,
} from 'lucide-react';
import { useFetch } from '../../hooks/useFetch';
import { useAuth } from '../../hooks/useAuth';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Tabs } from '../../components/ui/Tabs';
import { Spinner } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import './MascotaDetailPage.css';

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

// Mock clinical history
const mockAtenciones = [
  {
    id: '1',
    fecha_atencion: '2026-05-15T10:00:00',
    notas_clinicas: 'Control general. Peso: 12.5 kg. Buen estado de salud general. Se recomienda desparasitación.',
    peso_actual: '12.50',
    veterinario: { nombre: 'Dr. García', apellido: '' },
    diagnosticos: ['Control preventivo'],
  },
  {
    id: '2',
    fecha_atencion: '2026-03-20T14:30:00',
    notas_clinicas: 'Vacunación antirrábica. Se aplicó dosis de refuerzo. Sin reacciones adversas.',
    peso_actual: '11.80',
    veterinario: { nombre: 'Dra. López', apellido: '' },
    diagnosticos: ['Vacunación de rutina'],
  },
];

const mockVacunas = [
  {
    id: '1',
    producto: { nombre_comercial: 'Nobivac Rabia' },
    fecha_aplicacion: '2026-03-20T14:30:00',
    fecha_proxima_dosis: '2027-03-20T00:00:00',
    numero_lote: 'LOT-2024-001',
  },
  {
    id: '2',
    producto: { nombre_comercial: 'Nobivac DHPPi+L' },
    fecha_aplicacion: '2025-12-10T09:00:00',
    fecha_proxima_dosis: '2026-12-10T00:00:00',
    numero_lote: 'LOT-2024-055',
  },
];

const mockTratamientos = [
  {
    id: '1',
    tipo_tratamiento: { tipo: 'Desparasitación' },
    producto: { nombre_comercial: 'Drontal Plus' },
    dosis: '1 comprimido',
    frecuencia: 'Cada 3 meses',
    fecha_inicio: '2026-05-15',
    fecha_fin: null,
    indicaciones_adicionales: 'Administrar con comida.',
  },
];

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
  const [activeTab, setActiveTab] = useState('datos');
  const { user } = useAuth();
  const isOwner = user?.rol === 'Propietario';

  const { data: mascota, isLoading, error } = useFetch<MascotaDetail>(
    id ? `/mascotas/${id}` : null
  );

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

  return (
    <div className="page">
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
          {activeTab === 'historial' && <HistorialTab />}
          {activeTab === 'vacunas' && <VacunasTab />}
          {activeTab === 'tratamientos' && <TratamientosTab />}
        </div>
      </div>
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
function HistorialTab() {
  if (mockAtenciones.length === 0) {
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
      {mockAtenciones.map((a) => (
        <div key={a.id} className="timeline-item">
          <div className="timeline-dot" />
          <Card variant="inner" className="timeline-content">
            <div className="timeline-date">
              <Calendar size={12} style={{ display: 'inline', verticalAlign: '-2px', marginRight: 4 }} />
              {formatDate(a.fecha_atencion)} · {a.veterinario.nombre}
            </div>
            <div className="timeline-title">
              {a.diagnosticos.join(', ')}
            </div>
            <p className="timeline-text">{a.notas_clinicas}</p>
            {a.peso_actual && (
              <span style={{ marginTop: 8, display: 'inline-block' }}><Badge variant="neutral" className="text-sm">
                Peso: {a.peso_actual} kg
              </Badge></span>
            )}
          </Card>
        </div>
      ))}
    </div>
  );
}

// ── Vacunas Tab ──
function VacunasTab() {
  if (mockVacunas.length === 0) {
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
      {mockVacunas.map((v) => (
        <Card key={v.id} variant="inner">
          <div className="vaccine-card">
            <div className="vaccine-icon">
              <Syringe size={18} />
            </div>
            <div className="vaccine-info">
              <div className="vaccine-name">{v.producto.nombre_comercial}</div>
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
      ))}
    </div>
  );
}

// ── Tratamientos Tab ──
function TratamientosTab() {
  if (mockTratamientos.length === 0) {
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
      {mockTratamientos.map((t) => (
        <Card key={t.id} variant="inner">
          <div className="treatment-card">
            <div className="treatment-icon">
              <Pill size={18} />
            </div>
            <div className="treatment-info">
              <div className="treatment-name">
                {t.tipo_tratamiento.tipo} — {t.producto.nombre_comercial}
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
      ))}
    </div>
  );
}
