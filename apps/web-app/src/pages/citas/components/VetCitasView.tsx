import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock,
  PawPrint,
  ChevronLeft,
  ChevronRight,
  Activity,
  CheckCircle2,
  Calendar,
  Smile,
  X,
  FileText
} from 'lucide-react';
import { useFetch } from '../../../hooks/useFetch';
import { api } from '../../../api/client';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { CreateCitaModal } from '../../../components/appointments/CreateCitaModal';

import { type CitaMapped, getEstadoBadgeVariant, getUIEstado } from '@vetvault/shared';

type EstadoCita = 'Todas' | 'Pendiente' | 'Confirmada' | 'Completada' | 'Cancelada';

export function VetCitasView() {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
  const [activeFilter, setActiveFilter] = useState<EstadoCita>('Todas');
  const [showCreate, setShowCreate] = useState(false);
  const [timeOffset, setTimeOffset] = useState(-1);
  const dateInputRef = useRef<HTMLInputElement>(null);

  // Calculate startDate and endDate for query
  const getQueryDates = () => {
    if (viewMode === 'day') {
      const start = new Date(currentDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(currentDate);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    } else {
      // Get start of week (Sunday)
      const start = new Date(currentDate);
      const day = start.getDay();
      start.setDate(start.getDate() - day);
      start.setHours(0, 0, 0, 0);

      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    }
  };

  const { start, end } = getQueryDates();
  const queryStr = `/citas?startDate=${start.toISOString()}&endDate=${end.toISOString()}`;
  const { data: rawCitas, isLoading, refetch } = useFetch<any[]>(queryStr);

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

  // Filter and sort appointments
  const filtered = activeFilter === 'Todas'
    ? citas.filter((c) => c.estado !== 'Cancelada')
    : citas.filter((c) => c.estado === activeFilter);

  const sorted = [...filtered].sort((a, b) => a.fecha.getTime() - b.fecha.getTime());

  // Track dynamic current timeline
  const isTodaySelected = () => {
    const today = new Date();
    return currentDate.getDate() === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear();
  };

  useEffect(() => {
    const calcOffset = () => {
      if (!isTodaySelected()) {
        setTimeOffset(-1);
        return;
      }
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      if (hours >= 8 && hours < 20) {
        const totalMinutes = (hours - 8) * 60 + minutes;
        setTimeOffset((totalMinutes / 720) * 100);
      } else {
        setTimeOffset(-1);
      }
    };

    calcOffset();
    const interval = setInterval(calcOffset, 60000);
    return () => clearInterval(interval);
  }, [currentDate, viewMode]);

  const changeDay = (amount: number) => {
    setCurrentDate((prev) => {
      const next = new Date(prev);
      next.setDate(next.getDate() + amount);
      return next;
    });
  };

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

  const formatHeaderDate = () => {
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long' };
    const formatted = currentDate.toLocaleDateString('es-AR', options);
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  };

  // Metrics helper
  const getMetricCount = (status: EstadoCita) => {
    if (status === 'Todas') return citas.filter(c => c.estado !== 'Cancelada').length;
    return citas.filter(c => c.estado === status).length;
  };

  // Find active consultation patient
  const getActiveConsultation = () => {
    if (!isTodaySelected()) return null;
    const now = new Date();
    return citas.find(c => {
      const diffMs = Math.abs(c.fecha.getTime() - now.getTime());
      return (c.estado === 'Confirmada' || c.estado === 'Completada') && diffMs < 30 * 60 * 1000;
    });
  };

  const activeCita = getActiveConsultation();

  // Upcoming appointments
  const upcomingCitas = citas.filter(c => {
    const now = new Date();
    return (c.estado === 'Confirmada' || c.estado === 'Pendiente') && c.fecha.getTime() > now.getTime();
  });

  const hourSlots = Array.from({ length: 13 }, (_, i) => 8 + i); // 8:00 to 20:00

  const getStatusBlockClass = (estado: string) => {
    switch (estado) {
      case 'Pendiente':
        return 'bg-amber-500/15 border-amber-500/40 text-amber-700 dark:text-amber-400';
      case 'Confirmada':
        return 'bg-sky-500/15 border-sky-500/40 text-sky-700 dark:text-sky-400';
      case 'Completada':
        return 'bg-emerald-500/15 border-emerald-500/40 text-emerald-700 dark:text-emerald-400';
      case 'Cancelada':
        return 'bg-rose-500/15 border-rose-500/40 text-rose-700 dark:text-rose-400';
      default:
        return 'bg-slate-500/15 border-slate-500/40 text-slate-700 dark:text-slate-300';
    }
  };

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6 animate-fade-in">
      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card
          className={`p-4 transition-all cursor-pointer border ${
            activeFilter === 'Todas'
              ? 'border-[var(--accent)] bg-[var(--accent-light)] ring-2 ring-[var(--accent-light)]'
              : 'border-[var(--border)] hover:border-[var(--accent)]/50'
          }`}
          clickable
          onClick={() => setActiveFilter('Todas')}
        >
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Turnos totales</span>
          </div>
          <div className="text-2xl font-extrabold text-[var(--text-h)] leading-tight">{getMetricCount('Todas')}</div>
          <span className="text-xs font-semibold text-[var(--accent)] mt-2 inline-block">Ver todos</span>
        </Card>
        <Card
          className={`p-4 transition-all cursor-pointer border ${
            activeFilter === 'Completada'
              ? 'border-[var(--accent)] bg-[var(--accent-light)] ring-2 ring-[var(--accent-light)]'
              : 'border-[var(--border)] hover:border-[var(--accent)]/50'
          }`}
          clickable
          onClick={() => setActiveFilter('Completada')}
        >
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Completados</span>
          </div>
          <div className="text-2xl font-extrabold text-[var(--text-h)] leading-tight">{getMetricCount('Completada')}</div>
          <span className="text-xs text-[var(--text-muted)] mt-2 inline-block">
            {getMetricCount('Todas') > 0 ? `${Math.round((getMetricCount('Completada') / getMetricCount('Todas')) * 100)}%` : '0%'} del total
          </span>
        </Card>
        <Card
          className={`p-4 transition-all cursor-pointer border ${
            activeFilter === 'Pendiente'
              ? 'border-[var(--accent)] bg-[var(--accent-light)] ring-2 ring-[var(--accent-light)]'
              : 'border-[var(--border)] hover:border-[var(--accent)]/50'
          }`}
          clickable
          onClick={() => setActiveFilter('Pendiente')}
        >
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Pendientes</span>
          </div>
          <div className="text-2xl font-extrabold text-[var(--text-h)] leading-tight">{getMetricCount('Pendiente')}</div>
          <span className="text-xs font-semibold text-[var(--accent)] mt-2 inline-block">Ver detalles</span>
        </Card>
        <Card
          className={`p-4 transition-all cursor-pointer border ${
            activeFilter === 'Cancelada'
              ? 'border-[var(--accent)] bg-[var(--accent-light)] ring-2 ring-[var(--accent-light)]'
              : 'border-[var(--border)] hover:border-[var(--accent)]/50'
          }`}
          clickable
          onClick={() => setActiveFilter('Cancelada')}
        >
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Cancelados</span>
          </div>
          <div className="text-2xl font-extrabold text-[var(--text-h)] leading-tight">{getMetricCount('Cancelada')}</div>
          <span className="text-xs font-semibold text-[var(--accent)] mt-2 inline-block">Ver detalles</span>
        </Card>
      </div>

      {/* Schedule & Controls */}
      <div className="flex flex-col gap-6">
        <div>
          {/* Navigation and View Controls */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-2">
              <button
                className="w-9 h-9 rounded-xl border border-[var(--border)] bg-[var(--surface-solid)] flex items-center justify-center text-[var(--text)] hover:bg-[var(--border)] hover:text-[var(--text-h)] transition-all cursor-pointer"
                onClick={() => changeDay(-1)}
              >
                <ChevronLeft size={18} />
              </button>
              <div
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface-solid)] text-sm font-semibold text-[var(--text-h)] cursor-pointer relative"
                onClick={() => dateInputRef.current?.showPicker()}
              >
                <Calendar size={16} />
                <span>{formatHeaderDate()}</span>
                <input
                  ref={dateInputRef}
                  type="date"
                  className="absolute opacity-0 pointer-events-none w-0 h-0"
                  value={currentDate.toISOString().split('T')[0]}
                  onChange={(e) => setCurrentDate(new Date(e.target.value + 'T12:00:00'))}
                />
              </div>
              <button
                className="w-9 h-9 rounded-xl border border-[var(--border)] bg-[var(--surface-solid)] flex items-center justify-center text-[var(--text)] hover:bg-[var(--border)] hover:text-[var(--text-h)] transition-all cursor-pointer"
                onClick={() => changeDay(1)}
              >
                <ChevronRight size={18} />
              </button>
              <Button variant="secondary" size="sm" onClick={() => setCurrentDate(new Date())}>
                Hoy
              </Button>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center bg-[var(--border)] p-1 rounded-xl gap-1">
                <button
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    viewMode === 'day'
                      ? 'bg-[var(--surface-solid)] text-[var(--text-h)] shadow-sm'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-h)]'
                  }`}
                  onClick={() => setViewMode('day')}
                >
                  Día
                </button>
                <button
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    viewMode === 'week'
                      ? 'bg-[var(--surface-solid)] text-[var(--text-h)] shadow-sm'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-h)]'
                  }`}
                  onClick={() => setViewMode('week')}
                >
                  Semana
                </button>
              </div>
            </div>
          </div>

          {isLoading ? (
            <Card className="flex justify-center p-16">
              <p className="text-[var(--text-muted)]">Cargando citas de la agenda...</p>
            </Card>
          ) : activeFilter !== 'Todas' ? (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-[var(--text-h)]">Turnos: {activeFilter} ({sorted.length})</h3>
                <Button variant="secondary" size="sm" onClick={() => setActiveFilter('Todas')}>
                  Volver a la Agenda
                </Button>
              </div>

              {sorted.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-[var(--text-muted)] gap-3 text-sm p-8 text-center bg-[var(--surface-2)] border border-[var(--border)] rounded-2xl">
                  <Smile size={48} className="text-[var(--text-muted)]" />
                  <p>No hay citas programadas con estado "{activeFilter}" en este período.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {sorted.map(cita => (
                    <Card key={cita.id} className="flex items-center justify-between p-4 gap-4 flex-wrap border border-[var(--border)]">
                      <div className="flex flex-col min-w-[90px]">
                        <div className="flex items-center gap-1 text-sm font-bold text-[var(--text-h)]">
                          <Clock size={14} />
                          <span>
                            {cita.fecha.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} hs
                          </span>
                        </div>
                        <span className="text-xs text-[var(--text-muted)]">
                          {cita.fecha.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' })}
                        </span>
                      </div>

                      <div className="flex-1 min-w-[180px]">
                        <div
                          className="flex items-center gap-1.5 text-sm font-bold text-[var(--accent)] cursor-pointer hover:underline"
                          onClick={() => navigate(`/mascotas/${cita.mascotaId}`)}
                        >
                          <PawPrint size={14} />
                          <span>{cita.mascota}</span>
                        </div>
                        <span className="text-xs text-[var(--text-muted)] block mt-0.5">
                          {cita.motivo} · {cita.clinica}
                        </span>
                        <span className="text-[11px] text-[var(--text-muted)] block">Médico: {cita.veterinario}</span>
                      </div>

                      <div className="flex items-center gap-3">
                        <Badge variant={getEstadoBadgeVariant(cita.estado)}>{cita.estado}</Badge>
                        <div className="flex items-center gap-1.5">
                          {cita.estado === 'Pendiente' && (
                            <button
                              className="px-2.5 py-1 rounded-md text-[11px] font-semibold text-white bg-sky-600 hover:bg-sky-700 transition cursor-pointer"
                              onClick={() => handleStatusChange(cita.id, 'Confirmada')}
                            >
                              Confirmar
                            </button>
                          )}
                          {cita.estado === 'Confirmada' && (
                            <button
                              className="px-2.5 py-1 rounded-md text-[11px] font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition cursor-pointer"
                              onClick={() => navigate(`/mascotas/${cita.mascotaId}?atenderCitaId=${cita.id}&clinicaId=${cita.clinicaId}`)}
                            >
                              Atender
                            </button>
                          )}
                          {(cita.estado === 'Confirmada' || cita.estado === 'Pendiente') && (
                            <button
                              className="px-2.5 py-1 rounded-md text-[11px] font-semibold text-white bg-rose-600 hover:bg-rose-700 transition cursor-pointer"
                              onClick={() => handleStatusChange(cita.id, 'Cancelada')}
                              title="Cancelar Turno"
                            >
                              Cancelar
                            </button>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          ) : viewMode === 'week' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-7 gap-3">
              {Array.from({ length: 7 }, (_, i) => {
                const dayDate = new Date(start);
                dayDate.setDate(dayDate.getDate() + i);
                const dayCitas = filtered.filter(c => c.fecha.getDate() === dayDate.getDate() && c.fecha.getMonth() === dayDate.getMonth());

                return (
                  <Card key={i} className="p-3 min-h-[140px] border border-[var(--border)]">
                    <h4 className="text-xs font-bold capitalize mb-2 text-[var(--text-h)]">
                      {dayDate.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'short' })}
                    </h4>
                    {dayCitas.length === 0 ? (
                      <p className="text-[11px] text-[var(--text-muted)] italic">Sin turnos</p>
                    ) : (
                      <div className="flex flex-col gap-1.5">
                        {dayCitas.map(cita => (
                          <div
                            key={cita.id}
                            className="p-1.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-[11px] flex items-center gap-1.5 cursor-pointer hover:border-[var(--accent)] transition"
                            onClick={() => navigate(`/mascotas/${cita.mascotaId}`)}
                          >
                            <strong className="text-[var(--text-h)]">{cita.fecha.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</strong>
                            <span className="flex-1 truncate">{cita.mascota} ({cita.motivo})</span>
                            <Badge variant={getEstadoBadgeVariant(cita.estado)}>{cita.estado}</Badge>
                            {(cita.estado === 'Confirmada' || cita.estado === 'Pendiente') && (
                              <button
                                className="p-1 rounded text-white bg-rose-600 hover:bg-rose-700 transition cursor-pointer"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStatusChange(cita.id, 'Cancelada');
                                }}
                                title="Cancelar Turno"
                              >
                                <X size={12} />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-[50px_1fr] h-[720px] border border-[var(--border)] rounded-2xl bg-[var(--surface-solid)] overflow-hidden relative">
              <div className="relative h-full border-r border-[var(--border)]">
                {hourSlots.map(h => {
                  const pct = ((h - 8) / 12) * 100;
                  let transform = 'translateY(-50%)';
                  if (h === 8) transform = 'translateY(0)';
                  if (h === 20) transform = 'translateY(-100%)';
                  return (
                    <div
                      key={h}
                      className="absolute right-2 text-[11px] font-semibold text-[var(--text-muted)]"
                      style={{
                        top: `${pct}%`,
                        transform
                      }}
                    >
                      {h.toString().padStart(2, '0')}:00
                    </div>
                  );
                })}
              </div>

              <div className="relative h-full">
                {/* Hourly horizontal lines */}
                {hourSlots.map(h => (
                  <div key={h} className="absolute left-0 right-0 h-[1px] bg-[var(--border)] opacity-60" style={{ top: `${((h - 8) / 12) * 100}%` }} />
                ))}

                {/* Current Time Red Line */}
                {timeOffset >= 0 && (
                  <div className="absolute left-0 right-0 z-10 flex items-center" style={{ top: `${timeOffset}%` }}>
                    <div className="w-2 h-2 rounded-full bg-rose-500 -ml-1" />
                    <div className="flex-1 h-[2px] bg-rose-500" />
                  </div>
                )}

                {/* Positioned Appointments */}
                {sorted
                  .filter(c => c.fecha.getHours() >= 8 && c.fecha.getHours() < 20)
                  .map(cita => {
                    const hours = cita.fecha.getHours();
                    const minutes = cita.fecha.getMinutes();
                    const startMin = (hours - 8) * 60 + minutes;
                    const top = (startMin / 720) * 100;
                    const height = (30 / 720) * 100; // Assume 30 minute duration for visual representations

                    return (
                      <div
                        key={cita.id}
                        className={`absolute left-3 right-3 rounded-xl px-3 py-1.5 flex items-center justify-between text-xs z-5 border transition-all ${getStatusBlockClass(cita.estado)}`}
                        style={{
                          top: `${top}%`,
                          height: `calc(${height}% - 4px)`,
                        }}
                      >
                        <div className="flex items-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap">
                          <span className="font-bold">
                            {cita.fecha.toLocaleTimeString('es-AR', { hour: 'numeric', minute: '2-digit' })}
                          </span>
                          <span
                            className="font-bold underline cursor-pointer hover:opacity-80"
                            onClick={() => navigate(`/mascotas/${cita.mascotaId}`)}
                          >
                            {cita.mascota}
                          </span>
                          <span className="opacity-80">· {cita.motivo}</span>
                        </div>

                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {cita.estado === 'Pendiente' && (
                            <button
                              className="px-2 py-0.5 rounded text-[11px] font-semibold text-white bg-sky-600 hover:bg-sky-700 transition cursor-pointer"
                              onClick={() => handleStatusChange(cita.id, 'Confirmada')}
                            >
                              Confirmar
                            </button>
                          )}
                          {cita.estado === 'Confirmada' && (
                            <button
                              className="px-2 py-0.5 rounded text-[11px] font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition cursor-pointer"
                              onClick={() => navigate(`/mascotas/${cita.mascotaId}?atenderCitaId=${cita.id}&clinicaId=${cita.clinicaId}`)}
                            >
                              Atender
                            </button>
                          )}
                          {(cita.estado === 'Confirmada' || cita.estado === 'Pendiente') && (
                            <button
                              className="px-1.5 py-0.5 rounded text-[11px] font-semibold text-white bg-rose-600 hover:bg-rose-700 transition cursor-pointer"
                              onClick={() => handleStatusChange(cita.id, 'Cancelada')}
                            >
                              <X size={12} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}

                {sorted.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-[var(--text-muted)] gap-3 text-sm p-8 text-center">
                    <Smile size={48} className="text-[var(--text-muted)]" />
                    <p>No hay citas programadas que coincidan con los filtros seleccionados.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Dynamic Side Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-2">
          {/* Active consultation panel */}
          <Card className="p-5 border border-[var(--border)]">
            <h3 className="text-sm font-bold text-[var(--text-h)] flex items-center gap-2 mb-3">
              <Activity size={16} className="text-[var(--accent)]" /> Paciente actual
            </h3>
            {activeCita ? (
              <div className="flex flex-col items-center text-center p-4 gap-3 bg-[var(--surface-2)] rounded-xl border border-[var(--border)]">
                <div className="w-14 h-14 rounded-full bg-[var(--accent-light)] text-[var(--accent)] flex items-center justify-center flex-shrink-0">
                  <PawPrint size={30} />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-base text-[var(--text-h)]">{activeCita.mascota}</h4>
                  <p className="text-xs text-[var(--text-muted)]">Motivo: {activeCita.motivo}</p>
                  <p className="text-xs text-[var(--text-muted)]">Hora: {activeCita.fecha.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</p>
                  <p className="text-xs text-[var(--text-muted)]">Médico: {activeCita.veterinario}</p>
                </div>
                <div className="w-full mt-2">
                  {activeCita.estado === 'Confirmada' ? (
                    <Button
                      fullWidth
                      onClick={() => navigate(`/mascotas/${activeCita.mascotaId}?atenderCitaId=${activeCita.id}&clinicaId=${activeCita.clinicaId}`)}
                    >
                      <FileText size={14} style={{ marginRight: 6 }} /> Iniciar Atención
                    </Button>
                  ) : (
                    <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 py-1">
                      <CheckCircle2 size={16} />
                      <span>Consulta completada</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-32 flex items-center justify-center text-xs text-[var(--text-muted)] text-center p-4 bg-[var(--surface-2)] rounded-xl border border-[var(--border)]">
                <p>No hay ningún paciente en consulta activa en este momento.</p>
              </div>
            )}
          </Card>

          {/* Upcoming appointments queue panel */}
          <Card className="p-5 border border-[var(--border)]">
            <h3 className="text-sm font-bold text-[var(--text-h)] flex items-center gap-2 mb-3">
              <Clock size={16} className="text-[var(--accent)]" /> Próximos turnos
            </h3>
            {upcomingCitas.length === 0 ? (
              <div className="h-32 flex items-center justify-center text-xs text-[var(--text-muted)] text-center p-4 bg-[var(--surface-2)] rounded-xl border border-[var(--border)]">
                <p>No quedan turnos programados para el resto del día.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {upcomingCitas.slice(0, 5).map(cita => (
                  <div key={cita.id} className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs">
                    <div className="font-bold text-[var(--text-h)] min-w-[55px]">
                      {cita.fecha.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div className="flex-1 min-w-0 px-2">
                      <strong className="text-[var(--text-h)] block truncate">{cita.mascota}</strong>
                      <span className="text-[11px] text-[var(--text-muted)] block truncate">{cita.motivo}</span>
                    </div>
                    <Badge variant={getEstadoBadgeVariant(cita.estado)}>{cita.estado}</Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {showCreate && (
        <CreateCitaModal
          onClose={() => setShowCreate(false)}
          onCreate={() => {
            refetch();
            setShowCreate(false);
          }}
        />
      )}
    </div>
  );
}
