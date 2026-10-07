import { useNavigate } from 'react-router-dom';
import {
  PawPrint,
  CalendarDays,
  Syringe,
  Users,
  Clock,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useFetch } from '../../hooks/useFetch';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { AppointmentsActivityChart } from './components/AppointmentsActivityChart';
import { type Mascota, type MascotasResponse, monthNames, getEstadoBadgeVariant, getUIEstado } from '@vetvault/shared';

export function VetDashboard() {
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
      mascotaId: c.mascota_id,
      clinicaId: c.clinica_id,
      motivo: c.motivo_cita?.motivo || 'Consulta',
      fecha: new Date(c.fecha_hora),
      estado: getUIEstado(c),
    }))
    .filter((c: any) => c.estado === 'Pendiente' || c.estado === 'Confirmada')
    .slice(0, 4);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  const displayName = user?.nombre || user?.email?.split('@')[0] || 'Veterinario';

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* Welcome header */}
      <div className="space-y-1">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          {greeting()}, {displayName} 👋
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Aquí tenés un resumen de tu actividad clínica y pacientes.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="flex flex-col gap-2">
            <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              <PawPrint size={20} />
            </div>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              {isLoading ? '–' : mascotas.length}
            </div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Pacientes registrados
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex flex-col gap-2">
            <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              <CalendarDays size={20} />
            </div>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              {isCitasLoading ? '–' : upcomingCitas.length}
            </div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Próximas citas
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex flex-col gap-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Syringe size={20} />
            </div>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              0
            </div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Vacunas pendientes
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex flex-col gap-2">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Users size={20} />
            </div>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              –
            </div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Propietarios
            </div>
          </div>
        </Card>
      </div>

      {/* Activity Chart Section (External library: Recharts) */}
      <Card>
        <AppointmentsActivityChart citas={rawCitasList} />
      </Card>

      {/* Main 2-column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Pets */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Pacientes recientes
            </h3>
            <Button variant="ghost" size="sm" onClick={() => navigate('/mascotas')}>
              Ver todas
            </Button>
          </div>

          {isLoading ? (
            <div className="flex justify-center p-8">
              <Spinner />
            </div>
          ) : mascotas.length === 0 ? (
            <Card>
              <EmptyState
                icon={<PawPrint size={40} />}
                title="Sin mascotas"
                message="No hay pacientes registrados aún."
                action={
                  <Button size="sm" onClick={() => navigate('/mascotas')}>
                    Registrar paciente
                  </Button>
                }
              />
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {mascotas.slice(0, 4).map((m) => (
                <Card
                  key={m.id}
                  variant="inner"
                  clickable
                  onClick={() => navigate(`/mascotas/${m.id}`)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 flex items-center justify-center flex-shrink-0">
                      <PawPrint size={20} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                        {m.nombre}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
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
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Próximas citas
            </h3>
            <Button variant="ghost" size="sm" onClick={() => navigate('/citas')}>
              Ver todas
            </Button>
          </div>

          {isCitasLoading ? (
            <div className="flex justify-center p-8">
              <Spinner />
            </div>
          ) : upcomingCitas.length === 0 ? (
            <Card>
              <EmptyState
                icon={<CalendarDays size={40} />}
                title="Sin citas pendientes"
                message="No tenés citas programadas."
              />
            </Card>
          ) : (
            <div className="space-y-3">
              {upcomingCitas.map((cita) => (
                <Card key={cita.id} variant="inner">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-xl bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 flex flex-col items-center justify-center flex-shrink-0">
                      <span className="text-base font-bold leading-none">
                        {cita.fecha.getDate()}
                      </span>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mt-0.5">
                        {monthNames[cita.fecha.getMonth()]}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                        {cita.motivo}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5 truncate">
                        <Clock size={12} className="flex-shrink-0" />
                        <span>{cita.mascota}</span>
                        <span>·</span>
                        <span>
                          {cita.fecha.toLocaleTimeString('es-AR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge variant={getEstadoBadgeVariant(cita.estado)}>
                        {cita.estado}
                      </Badge>
                      {cita.estado === 'Confirmada' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            navigate(
                              `/mascotas/${cita.mascotaId}?atenderCitaId=${cita.id}&clinicaId=${cita.clinicaId}`
                            )
                          }
                          className="px-2 py-1 text-xs"
                        >
                          Atender
                        </Button>
                      )}
                    </div>
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
