import { useNavigate } from 'react-router-dom';
import {
  PawPrint,
  CalendarDays,
  Syringe,
  Clock,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useFetch } from '../../hooks/useFetch';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import './DashboardPage.css';

interface Mascota {
  id: string;
  nombre: string;
  raza: string;
  especie: string;
}

interface MascotasResponse {
  mascotas: Mascota[];
}

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

export function OwnerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Fetch mascotas
  const { data: mascotasData, isLoading } = useFetch<MascotasResponse | Mascota[]>('/mascotas');

  // Fetch appointments
  const { data: rawCitas, isLoading: isCitasLoading } = useFetch<any[]>('/citas');

  // Normalize to array
  const mascotas: Mascota[] = Array.isArray(mascotasData)
    ? mascotasData
    : (mascotasData as MascotasResponse)?.mascotas || [];

  const rawCitasList = Array.isArray(rawCitas) ? rawCitas : [];
  
  const upcomingCitas = rawCitasList
    .map((c: any) => ({
      id: c.id,
      mascota: c.mascota?.nombre || 'Desconocida',
      motivo: c.motivo_cita?.motivo || 'Consulta',
      fecha: new Date(c.fecha_hora),
      estado: getUIEstado(c),
    }))
    .filter((c: any) => c.estado === 'Pendiente' || c.estado === 'Confirmada')
    .slice(0, 3);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  const displayName = user?.nombre || user?.email?.split('@')[0] || 'Propietario';

  return (
    <div className="page">
      <div className="dashboard-welcome">
        <h2>
          {greeting()}, {displayName} 👋
        </h2>
        <p>Aquí podés ver el estado de tus mascotas y próximas citas.</p>
      </div>

      {/* Stats */}
      <div className="grid-stats">
        <Card>
          <div className="stat-card">
            <div className="stat-card-icon">
              <PawPrint size={20} />
            </div>
            <div className="stat-card-value">{isLoading ? '–' : mascotas.length}</div>
            <div className="stat-card-label">Mis mascotas</div>
          </div>
        </Card>

        <Card>
          <div className="stat-card">
            <div className="stat-card-icon">
              <CalendarDays size={20} />
            </div>
            <div className="stat-card-value">{isCitasLoading ? '–' : upcomingCitas.length}</div>
            <div className="stat-card-label">Próximas citas</div>
          </div>
        </Card>

        <Card>
          <div className="stat-card">
            <div className="stat-card-icon">
              <Syringe size={20} />
            </div>
            <div className="stat-card-value">0</div>
            <div className="stat-card-label">Vacunas pendientes</div>
          </div>
        </Card>
      </div>

      <div className="dashboard-grid-2">
        {/* Quick Pets */}
        <div className="dashboard-section">
          <div className="dashboard-section-header">
            <h3 className="dashboard-section-title">Mis mascotas</h3>
            <Button variant="ghost" size="sm" onClick={() => navigate('/mascotas')}>
              Ver todas
            </Button>
          </div>

          {isLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '32px' }}>
              <Spinner />
            </div>
          ) : mascotas.length === 0 ? (
            <Card>
              <EmptyState
                icon={<PawPrint size={48} />}
                title="Sin mascotas"
                message="Todavía no registraste ninguna mascota."
                action={
                  <Button size="sm" onClick={() => navigate('/mascotas')}>
                    Agregar mascota
                  </Button>
                }
              />
            </Card>
          ) : (
            <div className="dashboard-quick-pets">
              {mascotas.slice(0, 4).map((m) => (
                <Card
                  key={m.id}
                  variant="inner"
                  clickable
                  onClick={() => navigate(`/mascotas/${m.id}`)}
                >
                  <div className="dashboard-pet-card">
                    <div className="dashboard-pet-avatar">
                      <PawPrint size={20} />
                    </div>
                    <div className="dashboard-pet-info">
                      <div className="dashboard-pet-name">{m.nombre}</div>
                      <div className="dashboard-pet-breed">
                        {m.raza || 'Sin raza'}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Appointments */}
        <div className="dashboard-section">
          <div className="dashboard-section-header">
            <h3 className="dashboard-section-title">Próximas citas</h3>
            <Button variant="ghost" size="sm" onClick={() => navigate('/citas')}>
              Ver todas
            </Button>
          </div>

          {isCitasLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '32px' }}>
              <Spinner />
            </div>
          ) : upcomingCitas.length === 0 ? (
            <Card>
              <EmptyState
                icon={<CalendarDays size={48} />}
                title="Sin citas pendientes"
                message="No tenés citas programadas."
              />
            </Card>
          ) : (
            <div className="dashboard-appointment-list">
              {upcomingCitas.map((cita) => (
                <Card key={cita.id} variant="inner">
                  <div className="dashboard-appointment-item">
                    <div className="dashboard-appointment-date">
                      <span className="dashboard-appointment-day">
                        {cita.fecha.getDate()}
                      </span>
                      <span className="dashboard-appointment-month">
                        {monthNames[cita.fecha.getMonth()]}
                      </span>
                    </div>
                    <div className="dashboard-appointment-details">
                      <div className="dashboard-appointment-title">
                        {cita.motivo}
                      </div>
                      <div className="dashboard-appointment-sub">
                        <Clock size={12} style={{ display: 'inline', verticalAlign: '-2px', marginRight: 4 }} />
                        {cita.mascota} · {cita.fecha.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <Badge variant={getEstadoBadgeVariant(cita.estado)}>
                      {cita.estado}
                    </Badge>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
