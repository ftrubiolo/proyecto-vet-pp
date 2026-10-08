import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PawPrint,
  CalendarDays,
  ClipboardCheck,
  Users,
  Clock,
  Zap,
  CalendarPlus,
  UserPlus,
  Search,
  Building2,
  Stethoscope,
  Calendar,
  Tag,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useFetch } from '../../hooks/useFetch';
import { Card } from '../../components/ui/Card';
import { StatCard } from '../../components/ui/StatCard';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { AppointmentsActivityChart } from './components/AppointmentsActivityChart';
import { QuickPatientSearchModal } from './components/QuickPatientSearchModal';
import { WalkInConsultationModal } from './components/WalkInConsultationModal';
import { CreatePacienteModal } from '../../components/mascotas/CreatePacienteModal';
import { CreateCitaModal } from '../../components/appointments/CreateCitaModal';
import {
  type Mascota,
  type MascotasResponse,
  calcAge,
  getEstadoBadgeVariant,
  getUIEstado,
} from '@vetvault/shared';
import { formatTime } from '../../utils/formatters';

export function VetDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Modals state
  const [showWalkInModal, setShowWalkInModal] = useState(false);
  const [showCreateCitaModal, setShowCreateCitaModal] = useState(false);
  const [showCreatePacienteModal, setShowCreatePacienteModal] = useState(false);
  const [showQuickSearchModal, setShowQuickSearchModal] = useState(false);

  // Clinic awareness
  const clinicas = user?.clinicas || [];
  const [selectedClinicaId, setSelectedClinicaId] = useState<string>(() => {
    return clinicas[0]?.id || '';
  });

  const activeClinicaId = selectedClinicaId || clinicas[0]?.id || '';
  const activeClinica = clinicas.find((c) => c.id === activeClinicaId) || clinicas[0];

  // Fetch mascotas
  const {
    data: mascotasData,
    isLoading,
    refetch: refetchMascotas,
  } = useFetch<MascotasResponse | Mascota[]>('/mascotas');

  // Fetch appointments
  const {
    data: rawCitas,
    isLoading: isCitasLoading,
    refetch: refetchCitas,
  } = useFetch<any[]>('/citas');

  // Normalize data
  const mascotas: Mascota[] = useMemo(() => {
    if (Array.isArray(mascotasData)) return mascotasData;
    return (mascotasData as MascotasResponse)?.mascotas || [];
  }, [mascotasData]);

  const rawCitasList = useMemo(() => {
    return Array.isArray(rawCitas) ? rawCitas : [];
  }, [rawCitas]);

  const mappedCitas = useMemo(() => {
    return rawCitasList.map((c: any) => ({
      id: c.id,
      mascota: c.mascota?.nombre || 'Desconocida',
      mascotaId: c.mascota_id || c.mascota?.id,
      clinicaId: c.clinica_id || c.clinica?.id,
      clinicaNombre: c.clinica?.nombre_comercial,
      motivo: c.motivo_cita?.motivo || 'Consulta General',
      fecha: new Date(c.fecha_hora),
      estado: getUIEstado(c),
    }));
  }, [rawCitasList]);

  // Today's schedule & triage: undones first (Pendiente/Confirmada), then dones (Completada/Cancelada)
  const citasHoy = useMemo(() => {
    const today = new Date();
    const isDone = (estado: string) =>
      estado === 'Completada' || estado === 'Cancelada';

    return mappedCitas
      .filter((c) => {
        const d = c.fecha;
        return (
          d.getFullYear() === today.getFullYear() &&
          d.getMonth() === today.getMonth() &&
          d.getDate() === today.getDate()
        );
      })
      .sort((a, b) => {
        const aDone = isDone(a.estado);
        const bDone = isDone(b.estado);

        // Undones first, dones second
        if (aDone !== bDone) {
          return aDone ? 1 : -1;
        }

        // Chronological order within each group
        return a.fecha.getTime() - b.fecha.getTime();
      });
  }, [mappedCitas]);

  const todayPending = useMemo(() => {
    return citasHoy.filter(
      (c) => c.estado === 'Pendiente' || c.estado === 'Confirmada'
    );
  }, [citasHoy]);

  // Unique owners count
  const uniqueOwnersCount = useMemo(() => {
    const owners = new Set<string>();
    mascotas.forEach((m: any) => {
      if (Array.isArray(m.propietarios)) {
        m.propietarios.forEach((p: any) => {
          if (p.id) owners.add(p.id);
          else if (p.nombre) owners.add(`${p.nombre}-${p.apellido || ''}`);
        });
      } else if (m.propietario_id) {
        owners.add(m.propietario_id);
      }
    });
    rawCitasList.forEach((c: any) => {
      if (c.propietario_id) owners.add(c.propietario_id);
      if (c.mascota?.propietario_id) owners.add(c.mascota.propietario_id);
    });
    return owners.size > 0 ? owners.size : mascotas.length;
  }, [mascotas, rawCitasList]);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  const displayName = user?.nombre || user?.email?.split('@')[0] || 'Veterinario';

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* Header with Active Clinic Awareness */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-[var(--text-h)]">
            {greeting()}, {displayName} 👋
          </h2>
        </div>

        {/* Clinic badge / switcher */}
        {clinicas.length > 1 ? (
          <div className="flex items-center gap-2 bg-[var(--surface-2)] border border-[var(--border)] rounded-2xl px-3.5 py-2">
            <Building2 size={16} className="text-[var(--accent)] flex-shrink-0" />
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-[var(--text-muted)]">
                Clínica activa
              </span>
              <select
                value={selectedClinicaId}
                onChange={(e) => setSelectedClinicaId(e.target.value)}
                aria-label="Seleccionar clínica activa"
                className="bg-transparent text-xs font-bold text-[var(--text-h)] outline-none cursor-pointer border-0 p-0"
              >
                {clinicas.map((cl) => (
                  <option
                    key={cl.id}
                    value={cl.id}
                    className="bg-[var(--surface-solid)] text-[var(--text-h)]"
                  >
                    {cl.nombre_comercial}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ) : clinicas.length === 1 ? (
          <div className="inline-flex items-center gap-2.5 bg-[var(--surface-2)] border border-[var(--border)] rounded-2xl px-4 py-2 self-start sm:self-auto">
            <Building2 size={16} className="text-[var(--accent)] flex-shrink-0" />
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-[var(--text-muted)]">
                Clínica
              </span>
              <span className="text-xs font-bold text-[var(--text-h)] truncate">
                {clinicas[0].nombre_comercial}
              </span>
            </div>
          </div>
        ) : null}
      </div>

      {/* Quick Action Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card
          clickable
          onClick={() => setShowWalkInModal(true)}
          className="flex items-center gap-3.5 p-4 border border-[var(--border)] hover:border-[var(--accent)] transition-all group"
        >
          <div className="w-11 h-11 rounded-2xl bg-[var(--accent-light)] text-[var(--accent)] flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
            <Zap size={22} />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-bold text-[var(--text-h)] truncate">
              Consulta Inmediata
            </div>
            <div className="text-xs text-[var(--text-muted)] truncate">
              Atención Walk-in
            </div>
          </div>
        </Card>

        <Card
          clickable
          onClick={() => setShowCreateCitaModal(true)}
          className="flex items-center gap-3.5 p-4 border border-[var(--border)] hover:border-[var(--accent)] transition-all group"
        >
          <div className="w-11 h-11 rounded-2xl bg-[var(--accent-light)] text-[var(--accent)] flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
            <CalendarPlus size={22} />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-bold text-[var(--text-h)] truncate">
              Nuevo Turno
            </div>
            <div className="text-xs text-[var(--text-muted)] truncate">
              Agendar cita
            </div>
          </div>
        </Card>

        <Card
          clickable
          onClick={() => setShowCreatePacienteModal(true)}
          className="flex items-center gap-3.5 p-4 border border-[var(--border)] hover:border-[var(--accent)] transition-all group"
        >
          <div className="w-11 h-11 rounded-2xl bg-[var(--accent-light)] text-[var(--accent)] flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
            <UserPlus size={22} />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-bold text-[var(--text-h)] truncate">
              Registrar Paciente
            </div>
            <div className="text-xs text-[var(--text-muted)] truncate">
              Nueva admisión
            </div>
          </div>
        </Card>

        <Card
          clickable
          onClick={() => setShowQuickSearchModal(true)}
          className="flex items-center gap-3.5 p-4 border border-[var(--border)] hover:border-[var(--accent)] transition-all group"
        >
          <div className="w-11 h-11 rounded-2xl bg-[var(--accent-light)] text-[var(--accent)] flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
            <Search size={22} />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-bold text-[var(--text-h)] truncate">
              Buscar Paciente
            </div>
            <div className="text-xs text-[var(--text-muted)] truncate">
              Búsqueda rápida
            </div>
          </div>
        </Card>
      </div>

      {/* Dynamic Clinical Metrics (Zero hardcoded numbers) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<PawPrint size={20} />}
          value={mascotas.length}
          label="Pacientes registrados"
          loading={isLoading}
        />
        <StatCard
          icon={<CalendarDays size={20} />}
          value={citasHoy.length}
          label="Turnos de hoy"
          loading={isCitasLoading}
        />
        <StatCard
          icon={<ClipboardCheck size={20} />}
          value={todayPending.length}
          label="Consultas por atender"
          loading={isCitasLoading}
        />
        <StatCard
          icon={<Users size={20} />}
          value={uniqueOwnersCount}
          label="Tutores registrados"
          loading={isLoading}
        />
      </div>

      {/* Today's Clinical Schedule & Triage */}
      <Card className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[var(--accent-light)] text-[var(--accent)] flex items-center justify-center">
              <CalendarDays size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-[var(--text-h)]">
                  Agenda de Hoy
                </h3>
              </div>
            </div>
          </div>

          <Button variant="ghost" size="sm" onClick={() => navigate('/citas')}>
            Ver agenda completa
            <ArrowRight size={14} />
          </Button>
        </div>

        {isCitasLoading ? (
          <div className="flex justify-center p-8">
            <Spinner />
          </div>
        ) : citasHoy.length === 0 ? (
          <EmptyState
            icon={<CalendarDays size={40} />}
            title="Sin citas programadas para hoy"
            message="No tenés citas agendadas para el día de hoy. Podés iniciar una consulta espontánea o agendar un nuevo turno."
            action={
              <div className="flex items-center gap-2 mt-2">
                <Button size="sm" onClick={() => setShowWalkInModal(true)}>
                  <Zap size={14} />
                  Iniciar Walk-in
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setShowCreateCitaModal(true)}
                >
                  <CalendarPlus size={14} />
                  Agendar Turno
                </Button>
              </div>
            }
          />
        ) : (
          <div className="space-y-3">
            {citasHoy.map((cita) => {
              const isActive =
                cita.estado === 'Pendiente' || cita.estado === 'Confirmada';
              return (
                <div
                  key={cita.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] hover:border-[var(--accent)]/40 transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Time pill */}
                    <div className="w-16 h-12 rounded-xl bg-[var(--surface-solid)] border border-[var(--border)] flex flex-col items-center justify-center flex-shrink-0 shadow-2xs">
                      <Clock size={12} className="text-[var(--accent)] mb-0.5" />
                      <span className="text-xs font-bold text-[var(--text-h)] tabular-nums whitespace-nowrap">
                        {formatTime(cita.fecha)}
                      </span>
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          onClick={() => navigate(`/mascotas/${cita.mascotaId}`)}
                          className="font-bold text-sm text-[var(--text-h)] hover:text-[var(--accent)] cursor-pointer truncate"
                        >
                          {cita.mascota}
                        </span>
                        <Badge variant={getEstadoBadgeVariant(cita.estado)}>
                          {cita.estado}
                        </Badge>
                      </div>
                      <div className="text-xs text-[var(--text-muted)] truncate mt-0.5">
                        {cita.motivo}
                        {cita.clinicaNombre && ` · ${cita.clinicaNombre}`}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto flex-shrink-0">
                    {isActive ? (
                      <Button
                        size="sm"
                        onClick={() =>
                          navigate(
                            `/mascotas/${cita.mascotaId}?atenderCitaId=${cita.id}&clinicaId=${cita.clinicaId || activeClinicaId}`
                          )
                        }
                        className="text-xs py-1.5 px-3"
                      >
                        <Stethoscope size={14} />
                        Atender
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() =>
                          navigate(`/mascotas/${cita.mascotaId}?tab=historial`)
                        }
                        className="text-xs py-1.5 px-3"
                      >
                        Ver Registro
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Activity Chart Section (External library: Recharts) */}
      <Card>
        <AppointmentsActivityChart citas={rawCitasList} />
      </Card>

      {/* Clinical Follow-up: Recent Patients Strip */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-[var(--text-h)]">
              Pacientes Recientes
            </h3>
            <p className="text-xs text-[var(--text-muted)]">
              Acceso rápido a fichas e historias clínicas
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate('/mascotas')}>
            Ver todas
            <ArrowRight size={14} />
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
              title="Sin pacientes registrados"
              message="No hay pacientes en la base clínica aún. Registrá al primer paciente para comenzar."
              action={
                <Button
                  size="sm"
                  onClick={() => setShowCreatePacienteModal(true)}
                >
                  <UserPlus size={14} />
                  Registrar paciente
                </Button>
              }
            />
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {mascotas.slice(0, 4).map((m) => (
              <Card
                key={m.id}
                variant="inner"
                clickable
                onClick={() => navigate(`/mascotas/${m.id}`)}
                className="hover:border-[var(--accent)]/50 transition-all p-3.5"
              >
                <div className="flex items-center gap-3">
                  {m.foto_url ? (
                    <img
                      src={m.foto_url}
                      alt={m.nombre}
                      className="w-11 h-11 rounded-xl object-cover border border-[var(--border)] flex-shrink-0"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-xl bg-[var(--accent-light)] text-[var(--accent)] flex items-center justify-center flex-shrink-0">
                      <PawPrint size={20} />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-[var(--text-h)] truncate">
                      {m.nombre}
                    </div>
                    <div className="text-xs text-[var(--text-muted)] truncate">
                      {m.especie || 'Mascota'} · {m.raza || 'Sin raza'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 mt-3 pt-2.5 border-t border-[var(--border)] text-xs text-[var(--text-muted)]">
                  <span className="flex items-center gap-1 truncate">
                    <Calendar size={12} className="flex-shrink-0" />
                    {m.fecha_nacimiento ? calcAge(m.fecha_nacimiento) : '–'}
                  </span>
                  <span className="flex items-center gap-1 flex-shrink-0">
                    <Tag size={12} />
                    {m.sexo === 'M' ? 'Macho' : 'Hembra'}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {showWalkInModal && (
        <WalkInConsultationModal
          isOpen={showWalkInModal}
          onClose={() => setShowWalkInModal(false)}
          mascotas={mascotas}
          clinicaId={activeClinicaId}
          clinicaNombre={activeClinica?.nombre_comercial}
          onNewPatientClick={() => setShowCreatePacienteModal(true)}
        />
      )}

      {showCreateCitaModal && (
        <CreateCitaModal
          onClose={() => setShowCreateCitaModal(false)}
          onCreate={() => {
            setShowCreateCitaModal(false);
            refetchCitas();
          }}
        />
      )}

      {showCreatePacienteModal && (
        <CreatePacienteModal
          isOpen={showCreatePacienteModal}
          onClose={() => setShowCreatePacienteModal(false)}
          onCreated={() => {
            setShowCreatePacienteModal(false);
            refetchMascotas();
          }}
          defaultClinicaId={activeClinicaId}
        />
      )}

      {showQuickSearchModal && (
        <QuickPatientSearchModal
          isOpen={showQuickSearchModal}
          onClose={() => setShowQuickSearchModal(false)}
          mascotas={mascotas}
          clinicaId={activeClinicaId}
          onNewPatientClick={() => setShowCreatePacienteModal(true)}
        />
      )}
    </div>
  );
}
