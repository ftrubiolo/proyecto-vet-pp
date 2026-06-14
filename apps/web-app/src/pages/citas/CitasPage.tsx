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
import { EmptyState } from '../../components/ui/EmptyState';
import { CreateCitaModal } from '../../components/appointments/CreateCitaModal';
import './CitasPage.css';

import { type CitaMapped, monthNames, getEstadoBadgeVariant, getUIEstado } from '@vetvault/shared';

type EstadoCita = 'Todas' | 'Pendiente' | 'Confirmada' | 'Completada' | 'Cancelada';

const filters: EstadoCita[] = ['Todas', 'Pendiente', 'Confirmada', 'Completada', 'Cancelada'];

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


