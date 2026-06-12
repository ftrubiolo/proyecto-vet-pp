import { useState } from 'react';
import {
  CalendarDays,
  Plus,
  Clock,
  PawPrint,
  User,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input, Select } from '../../components/ui/Input';
import { EmptyState } from '../../components/ui/EmptyState';
import './CitasPage.css';

type EstadoCita = 'Todas' | 'Pendiente' | 'Confirmada' | 'Completada' | 'Cancelada';

interface Cita {
  id: string;
  mascota: string;
  veterinario: string;
  clinica: string;
  motivo: string;
  fecha: Date;
  estado: string;
}

// ── Mock data ──
const initialMockCitas: Cita[] = [
  {
    id: '1',
    mascota: 'Luna',
    veterinario: 'Dr. García',
    clinica: 'Clínica VetVault',
    motivo: 'Vacunación antirrábica',
    fecha: new Date(Date.now() + 86400000 * 2),
    estado: 'Pendiente',
  },
  {
    id: '2',
    mascota: 'Rocky',
    veterinario: 'Dra. López',
    clinica: 'Clínica VetVault',
    motivo: 'Control general',
    fecha: new Date(Date.now() + 86400000 * 5),
    estado: 'Confirmada',
  },
  {
    id: '3',
    mascota: 'Milo',
    veterinario: 'Dr. García',
    clinica: 'Clínica VetVault',
    motivo: 'Desparasitación',
    fecha: new Date(Date.now() + 86400000 * 8),
    estado: 'Pendiente',
  },
  {
    id: '4',
    mascota: 'Canela',
    veterinario: 'Dra. Martínez',
    clinica: 'Clínica VetVault',
    motivo: 'Castración',
    fecha: new Date(Date.now() - 86400000 * 3),
    estado: 'Completada',
  },
  {
    id: '5',
    mascota: 'Max',
    veterinario: 'Dr. García',
    clinica: 'Clínica VetVault',
    motivo: 'Consulta dermatológica',
    fecha: new Date(Date.now() - 86400000 * 10),
    estado: 'Cancelada',
  },
];

const filters: EstadoCita[] = ['Todas', 'Pendiente', 'Confirmada', 'Completada', 'Cancelada'];
const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

function getEstadoBadgeVariant(estado: string) {
  switch (estado) {
    case 'Confirmada': return 'success' as const;
    case 'Pendiente': return 'warning' as const;
    case 'Cancelada': return 'danger' as const;
    case 'Completada': return 'neutral' as const;
    default: return 'neutral' as const;
  }
}

export function CitasPage() {
  const { user } = useAuth();
  const isVet = user?.rol === 'Veterinario';
  const [filter, setFilter] = useState<EstadoCita>('Todas');
  const [citas, setCitas] = useState<Cita[]>(initialMockCitas);
  const [showCreate, setShowCreate] = useState(false);

  const filtered = filter === 'Todas'
    ? citas
    : citas.filter((c) => c.estado === filter);

  // Sort by date descending (upcoming first)
  const sorted = [...filtered].sort((a, b) => a.fecha.getTime() - b.fecha.getTime());

  const handleStatusChange = (citaId: string, newStatus: string) => {
    setCitas((prev) =>
      prev.map((c) => (c.id === citaId ? { ...c, estado: newStatus } : c))
    );
  };

  const handleCreate = (newCita: Omit<Cita, 'id'>) => {
    setCitas((prev) => [
      ...prev,
      { ...newCita, id: String(Date.now()) },
    ]);
    setShowCreate(false);
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2 className="page-title">Citas</h2>
          <p className="page-subtitle">
            {isVet ? 'Gestión de turnos de la clínica' : 'Tus citas programadas'}
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus size={16} />
          Nueva Cita
        </Button>
      </div>

      <div className="citas-filters">
        {filters.map((f) => (
          <button
            key={f}
            className={`citas-filter-btn ${filter === f ? 'active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f} {f !== 'Todas' && `(${citas.filter((c) => c.estado === f).length})`}
          </button>
        ))}
      </div>

      {sorted.length === 0 ? (
        <Card>
          <EmptyState
            icon={<CalendarDays size={56} />}
            title="Sin citas"
            message={
              filter === 'Todas'
                ? 'No hay citas registradas.'
                : `No hay citas con estado "${filter}".`
            }
            action={
              <Button onClick={() => setShowCreate(true)}>
                <Plus size={16} />
                Agendar cita
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="citas-list">
          {sorted.map((cita, i) => (
            <Card
              key={cita.id}
              variant="inner"
              className="animate-fade-in-up"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <div className="cita-card">
                <div className="cita-date-block">
                  <span className="cita-date-day">{cita.fecha.getDate()}</span>
                  <span className="cita-date-month">{monthNames[cita.fecha.getMonth()]}</span>
                </div>

                <div className="cita-info">
                  <div className="cita-title">{cita.motivo}</div>
                  <div className="cita-subtitle">
                    <PawPrint size={12} /> {cita.mascota}
                    <span>·</span>
                    <User size={12} /> {cita.veterinario}
                    <span>·</span>
                    <Clock size={12} />
                    {cita.fecha.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                <Badge variant={getEstadoBadgeVariant(cita.estado)}>
                  {cita.estado}
                </Badge>

                {isVet && (cita.estado === 'Pendiente' || cita.estado === 'Confirmada') && (
                  <div className="cita-actions">
                    {cita.estado === 'Pendiente' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleStatusChange(cita.id, 'Confirmada')}
                      >
                        Confirmar
                      </Button>
                    )}
                    {cita.estado === 'Confirmada' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleStatusChange(cita.id, 'Completada')}
                      >
                        Completar
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleStatusChange(cita.id, 'Cancelada')}
                      style={{ color: 'var(--danger)' }}
                    >
                      Cancelar
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {showCreate && (
        <CreateCitaModal
          onClose={() => setShowCreate(false)}
          onCreate={handleCreate}
        />
      )}
    </div>
  );
}

// ── Create Cita Modal ──
interface CreateCitaModalProps {
  onClose: () => void;
  onCreate: (cita: Omit<Cita, 'id'>) => void;
}

function CreateCitaModal({ onClose, onCreate }: CreateCitaModalProps) {
  const [mascota, setMascota] = useState('');
  const [veterinario, setVeterinario] = useState('');
  const [motivo, setMotivo] = useState('');
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fechaHora = new Date(`${fecha}T${hora}`);
    onCreate({
      mascota,
      veterinario,
      clinica: 'Clínica VetVault',
      motivo,
      fecha: fechaHora,
      estado: 'Pendiente',
    });
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Agendar Nueva Cita"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit" form="create-cita-form">Agendar</Button>
        </>
      }
    >
      <form id="create-cita-form" className="create-cita-form" onSubmit={handleSubmit}>
        <Input
          label="Mascota"
          placeholder="Nombre de la mascota"
          value={mascota}
          onChange={(e) => setMascota(e.target.value)}
          required
        />
        <Input
          label="Veterinario"
          placeholder="Nombre del veterinario"
          value={veterinario}
          onChange={(e) => setVeterinario(e.target.value)}
          required
        />
        <Select
          label="Motivo"
          options={[
            { value: 'Vacunación', label: 'Vacunación' },
            { value: 'Control general', label: 'Control general' },
            { value: 'Desparasitación', label: 'Desparasitación' },
            { value: 'Castración', label: 'Castración' },
            { value: 'Consulta', label: 'Consulta' },
            { value: 'Emergencia', label: 'Emergencia' },
            { value: 'Otro', label: 'Otro' },
          ]}
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          required
        />
        <div className="form-row">
          <Input
            label="Fecha"
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            required
          />
          <Input
            label="Hora"
            type="time"
            value={hora}
            onChange={(e) => setHora(e.target.value)}
            required
          />
        </div>
      </form>
    </Modal>
  );
}
