import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarDays,
  Plus,
  Clock,
  PawPrint,
  User,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useFetch } from '../../hooks/useFetch';
import { api } from '../../api/client';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input, Select } from '../../components/ui/Input';
import { EmptyState } from '../../components/ui/EmptyState';
import './CitasPage.css';

type EstadoCita = 'Todas' | 'Pendiente' | 'Confirmada' | 'Completada' | 'Cancelada';

interface CitaMapped {
  id: string;
  mascota: string;
  mascotaId: string;
  veterinario: string;
  clinica: string;
  clinicaId: string;
  motivo: string;
  fecha: Date;
  estado: string;
}

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

function getUIEstado(c: any): string {
  if (c.atenciones && c.atenciones.length > 0) return 'Completada';
  const estado = c.estado_cita?.estado;
  if (estado === 'Agendada') return 'Pendiente';
  return estado || 'Pendiente';
}

export function CitasPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isVet = user?.rol === 'Veterinario';
  const [filter, setFilter] = useState<EstadoCita>('Todas');
  const [showCreate, setShowCreate] = useState(false);

  // Fetch real appointments
  const { data: rawCitas, isLoading, refetch } = useFetch<any[]>('/citas');

  // Map backend format to UI model
  const citas: CitaMapped[] = (rawCitas || []).map((c: any) => ({
    id: c.id,
    mascota: c.mascota?.nombre || 'Desconocida',
    mascotaId: c.mascota_id,
    veterinario: c.veterinario ? `${c.veterinario.nombre} ${c.veterinario.apellido}` : 'Sin asignar',
    clinica: c.clinica?.nombre_comercial || 'VetVault',
    clinicaId: c.clinica_id,
    motivo: c.motivo_cita?.motivo || 'Consulta',
    fecha: new Date(c.fecha_hora),
    estado: getUIEstado(c),
  }));

  const filtered = filter === 'Todas'
    ? citas
    : citas.filter((c) => c.estado === filter);

  // Sort by date descending (upcoming first)
  const sorted = [...filtered].sort((a, b) => a.fecha.getTime() - b.fecha.getTime());

  const handleStatusChange = async (citaId: string, newStatus: string) => {
    if (newStatus === 'Completada') {
      try {
        const originalCita = rawCitas?.find(c => c.id === citaId);
        if (originalCita) {
          await api.post('/atenciones', {
            cita_id: citaId,
            mascota_id: originalCita.mascota_id,
            clinica_id: originalCita.clinica_id,
            notas_clinicas: 'Cita completada desde el panel de gestión de turnos.',
            diagnosticos: [],
            tratamientos: [],
            vacunas: []
          });
          refetch();
        }
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Error al completar cita');
      }
      return;
    }

    let statusId = 1;
    if (newStatus === 'Confirmada') statusId = 2;
    if (newStatus === 'Cancelada') statusId = 3;
    if (newStatus === 'No-Show') statusId = 4;

    try {
      await api.patch(`/citas/${citaId}`, { estado_cita_id: statusId });
      refetch();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al cambiar estado');
    }
  };

  const handleCreate = () => {
    refetch();
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

      {isLoading ? (
        <Card style={{ display: 'flex', justifyContent: 'center', padding: '64px' }}>
          <p>Cargando citas...</p>
        </Card>
      ) : sorted.length === 0 ? (
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
                        onClick={() => navigate(`/mascotas/${cita.mascotaId}?atenderCitaId=${cita.id}&clinicaId=${cita.clinicaId}`)}
                      >
                        Atender
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
  onCreate: () => void;
}

function CreateCitaModal({ onClose, onCreate }: CreateCitaModalProps) {
  const [mascotaId, setMascotaId] = useState('');
  const [veterinarioId, setVeterinarioId] = useState('');
  const [clinicaId, setClinicaId] = useState('');
  const [motivoId, setMotivoId] = useState('1'); // Default: Consulta General
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');

  // Fetch dropdown lists
  const { data: mascotas } = useFetch<any[]>('/mascotas');
  
  // Only fetch clinics where the selected pet is a patient (Activo)
  const { data: clinicas } = useFetch<any[]>(
    mascotaId ? `/clinicas/mascota/${mascotaId}` : null
  );

  // Only fetch veterinarians associated with the selected clinic
  const { data: veterinarios } = useFetch<any[]>(
    clinicaId ? `/veterinarios/clinica/${clinicaId}` : null
  );

  // Pre-fill lists
  const mascotaList = Array.isArray(mascotas) ? mascotas : [];
  const vetList = Array.isArray(veterinarios) ? veterinarios : [];
  const clinicaList = Array.isArray(clinicas) ? clinicas : [];

  const handleMascotaChange = (id: string) => {
    setMascotaId(id);
    setClinicaId('');
    setVeterinarioId('');
  };

  const handleClinicaChange = (id: string) => {
    setClinicaId(id);
    setVeterinarioId('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fechaHora = new Date(`${fecha}T${hora}`);

    try {
      await api.post('/citas', {
        mascota_id: mascotaId,
        veterinario_id: veterinarioId || null,
        clinica_id: clinicaId,
        fecha_hora: fechaHora.toISOString(),
        motivo_id: Number(motivoId),
        estado_cita_id: 1, // Agendada (Pendiente)
      });
      onCreate();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al agendar cita');
    }
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
        <Select
          label="Mascota"
          options={[
            { value: '', label: 'Seleccionar mascota...' },
            ...mascotaList.map((m: any) => ({ value: m.id, label: m.nombre }))
          ]}
          value={mascotaId}
          onChange={(e) => handleMascotaChange(e.target.value)}
          required
        />
        
        <Select
          label="Clínica"
          options={[
            { value: '', label: mascotaId ? 'Seleccionar clínica...' : 'Seleccione una mascota primero...' },
            ...clinicaList.map((c: any) => ({ value: c.id, label: c.nombre_comercial }))
          ]}
          value={clinicaId}
          onChange={(e) => handleClinicaChange(e.target.value)}
          disabled={!mascotaId}
          required
        />

        <Select
          label="Veterinario"
          options={[
            { value: '', label: clinicaId ? 'Cualquiera / Sin asignar' : 'Seleccione una clínica primero...' },
            ...vetList.map((v: any) => ({ value: v.id, label: `${v.nombre} ${v.apellido}` }))
          ]}
          value={veterinarioId}
          onChange={(e) => setVeterinarioId(e.target.value)}
          disabled={!clinicaId}
        />

        <Select
          label="Motivo"
          options={[
            { value: '1', label: 'Consulta General' },
            { value: '2', label: 'Vacunación' },
            { value: '3', label: 'Cirugía' },
            { value: '4', label: 'Urgencia' },
          ]}
          value={motivoId}
          onChange={(e) => setMotivoId(e.target.value)}
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
