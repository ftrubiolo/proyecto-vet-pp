import { useState, useEffect } from 'react';
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
    ? citas
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
    if (status === 'Todas') return citas.length;
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

  return (
    <div className="page planner-page">
      {/* Metrics Row */}
      <div className="planner-metrics-grid">
        <Card className={`metric-card ${activeFilter === 'Todas' ? 'selected' : ''}`} clickable onClick={() => setActiveFilter('Todas')}>
          <div className="metric-header">
            <span className="metric-title">Turnos totales</span>
          </div>
          <div className="metric-value">{getMetricCount('Todas')}</div>
          <span className="metric-link">Ver todos</span>
        </Card>
        <Card className={`metric-card ${activeFilter === 'Completada' ? 'selected' : ''}`} clickable onClick={() => setActiveFilter('Completada')}>
          <div className="metric-header">
            <span className="metric-title">Completados</span>
          </div>
          <div className="metric-value">{getMetricCount('Completada')}</div>
          <span className="metric-subtext">
            {citas.length > 0 ? `${Math.round((getMetricCount('Completada') / citas.length) * 100)}%` : '0%'} del total
          </span>
        </Card>
        <Card className={`metric-card ${activeFilter === 'Pendiente' ? 'selected' : ''}`} clickable onClick={() => setActiveFilter('Pendiente')}>
          <div className="metric-header">
            <span className="metric-title">Pendientes</span>
          </div>
          <div className="metric-value">{getMetricCount('Pendiente')}</div>
          <span className="metric-link">Ver detalles</span>
        </Card>
        <Card className={`metric-card ${activeFilter === 'Cancelada' ? 'selected' : ''}`} clickable onClick={() => setActiveFilter('Cancelada')}>
          <div className="metric-header">
            <span className="metric-title">Cancelados</span>
          </div>
          <div className="metric-value">{getMetricCount('Cancelada')}</div>
          <span className="metric-link">Ver detalles</span>
        </Card>
      </div>

      {/* Two-Column Grid */}
      <div className="planner-body-layout">
        {/* Left Column: Grid schedule */}
        <div className="planner-schedule-section">
          {/* Navigation and View Controls */}
          <div className="planner-controls">
            <div className="planner-date-nav">
              <button className="btn-nav-arrow" onClick={() => changeDay(-1)}>
                <ChevronLeft size={18} />
              </button>
              <div className="planner-current-date">
                <Calendar size={16} />
                <span>{formatHeaderDate()}</span>
                <input
                  type="date"
                  className="planner-hidden-datepicker"
                  value={currentDate.toISOString().split('T')[0]}
                  onChange={(e) => setCurrentDate(new Date(e.target.value + 'T12:00:00'))}
                />
              </div>
              <button className="btn-nav-arrow" onClick={() => changeDay(1)}>
                <ChevronRight size={18} />
              </button>
              <Button variant="secondary" size="sm" onClick={() => setCurrentDate(new Date())}>
                Hoy
              </Button>
            </div>

            <div className="planner-controls-right" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
              <div className="planner-view-toggle">
                <button
                  className={`toggle-btn ${viewMode === 'day' ? 'active' : ''}`}
                  onClick={() => setViewMode('day')}
                >
                  Día
                </button>
                <button
                  className={`toggle-btn ${viewMode === 'week' ? 'active' : ''}`}
                  onClick={() => setViewMode('week')}
                >
                  Semana
                </button>
              </div>
            </div>
          </div>
          {isLoading ? (
            <Card style={{ display: 'flex', justifyContent: 'center', padding: '64px' }}>
              <p>Cargando citas de la agenda...</p>
            </Card>
          ) : activeFilter !== 'Todas' ? (
            <div className="planner-filtered-list">
              <div className="filtered-list-header">
                <h3>Turnos: {activeFilter} ({sorted.length})</h3>
                <Button variant="secondary" size="sm" onClick={() => setActiveFilter('Todas')}>
                  Volver a la Agenda
                </Button>
              </div>

              {sorted.length === 0 ? (
                <div className="planner-empty-day-state">
                  <Smile size={48} style={{ color: 'var(--text-muted)' }} />
                  <p>No hay citas programadas con estado "{activeFilter}" en este período.</p>
                </div>
              ) : (
                <div className="filtered-appointments-stack">
                  {sorted.map(cita => (
                    <Card key={cita.id} className="filtered-appointment-card">
                      <div className="filtered-card-left">
                        <div className="filtered-card-time">
                          <Clock size={14} />
                          <strong>
                            {cita.fecha.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} hs
                          </strong>
                        </div>
                        <span className="filtered-card-date">
                          {cita.fecha.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' })}
                        </span>
                      </div>

                      <div className="filtered-card-info">
                        <div className="filtered-card-pet" onClick={() => navigate(`/mascotas/${cita.mascotaId}`)}>
                          <PawPrint size={14} />
                          <strong>{cita.mascota}</strong>
                        </div>
                        <span className="filtered-card-meta">
                          {cita.motivo} · {cita.clinica}
                        </span>
                        <span className="filtered-card-vet">Médico: {cita.veterinario}</span>
                      </div>

                      <div className="filtered-card-actions">
                        <Badge variant={getEstadoBadgeVariant(cita.estado)}>{cita.estado}</Badge>
                        <div className="filtered-actions-buttons">
                          {cita.estado === 'Pendiente' && (
                            <button className="btn-action-confirm" onClick={() => handleStatusChange(cita.id, 'Confirmada')}>
                              Confirmar
                            </button>
                          )}
                          {cita.estado === 'Confirmada' && (
                            <button className="btn-action-attend" onClick={() => navigate(`/mascotas/${cita.mascotaId}?atenderCitaId=${cita.id}&clinicaId=${cita.clinicaId}`)}>
                              Atender
                            </button>
                          )}
                          {(cita.estado === 'Confirmada' || cita.estado === 'Pendiente') && (
                            <button className="btn-action-cancel" onClick={() => handleStatusChange(cita.id, 'Cancelada')} title="Cancelar Turno">
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
            <div className="weekly-agenda-list">
              {Array.from({ length: 7 }, (_, i) => {
                const dayDate = new Date(start);
                dayDate.setDate(dayDate.getDate() + i);
                const dayCitas = citas.filter(c => c.fecha.getDate() === dayDate.getDate() && c.fecha.getMonth() === dayDate.getMonth());

                return (
                  <Card key={i} className="weekly-day-card">
                    <h4 className="weekly-day-title">
                      {dayDate.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'short' })}
                    </h4>
                    {dayCitas.length === 0 ? (
                      <p className="no-citas-sub">Sin turnos</p>
                    ) : (
                      <div className="weekly-day-citas-list">
                        {dayCitas.map(cita => (
                          <div key={cita.id} className="weekly-cita-item" onClick={() => navigate(`/mascotas/${cita.mascotaId}`)}>
                            <Clock size={12} />
                            <strong>{cita.fecha.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</strong>
                            <span>{cita.mascota} ({cita.motivo})</span>
                            <Badge variant={getEstadoBadgeVariant(cita.estado)}>{cita.estado}</Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="planner-time-grid">
              <div className="planner-grid-hours-axis">
                {hourSlots.map(h => {
                  const pct = ((h - 8) / 12) * 100;
                  let transform = 'translateY(-50%)';
                  if (h === 8) transform = 'translateY(0)';
                  if (h === 20) transform = 'translateY(-100%)';
                  return (
                    <div
                      key={h}
                      className="hour-axis-label"
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

              <div className="planner-grid-timeline-content">
                {/* Hourly horizontal lines */}
                {hourSlots.map(h => (
                  <div key={h} className="hour-grid-row-line" style={{ top: `${((h - 8) / 12) * 100}%` }} />
                ))}

                {/* Current Time Red Line */}
                {timeOffset >= 0 && (
                  <div className="current-time-indicator" style={{ top: `${timeOffset}%` }}>
                    <div className="indicator-dot" />
                    <div className="indicator-line" />
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
                        className={`planner-appointment-block status-${cita.estado.toLowerCase()}`}
                        style={{
                          top: `${top}%`,
                          height: `calc(${height}% - 4px)`,
                        }}
                      >
                        <div className="appointment-block-info">
                          <span className="app-time">
                            {cita.fecha.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span className="app-pet" onClick={() => navigate(`/mascotas/${cita.mascotaId}`)}>
                            {cita.mascota}
                          </span>
                          <span className="app-motivo">· {cita.motivo}</span>
                        </div>

                        <div className="appointment-block-actions">
                          {cita.estado === 'Pendiente' && (
                            <button className="btn-action-confirm" onClick={() => handleStatusChange(cita.id, 'Confirmada')}>
                              Confirmar
                            </button>
                          )}
                          {cita.estado === 'Confirmada' && (
                            <button className="btn-action-attend" onClick={() => navigate(`/mascotas/${cita.mascotaId}?atenderCitaId=${cita.id}&clinicaId=${cita.clinicaId}`)}>
                              Atender
                            </button>
                          )}
                          {(cita.estado === 'Confirmada' || cita.estado === 'Pendiente') && (
                            <button className="btn-action-cancel" onClick={() => handleStatusChange(cita.id, 'Cancelada')}>
                              <X size={12} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}

                {sorted.length === 0 && (
                  <div className="planner-empty-day-state">
                    <Smile size={48} style={{ color: 'var(--text-muted)' }} />
                    <p>No hay citas programadas que coincidan con los filtros seleccionados.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Dynamic Side Panels */}
        <div className="planner-side-panels">
          {/* Active consultation panel */}
          <Card className="side-panel-card active-consultation-panel">
            <h3 className="panel-title">
              <Activity size={16} /> Paciente actual
            </h3>
            {activeCita ? (
              <div className="active-patient-box">
                <div className="active-patient-avatar">
                  <PawPrint size={32} />
                </div>
                <div className="active-patient-details">
                  <h4>{activeCita.mascota}</h4>
                  <p className="patient-reason">Motivo: {activeCita.motivo}</p>
                  <p className="patient-time">Hora: {activeCita.fecha.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</p>
                  <p className="patient-vet">Médico: {activeCita.veterinario}</p>
                </div>
                <div className="active-patient-actions" style={{ marginTop: 'var(--space-md)', width: '100%' }}>
                  {activeCita.estado === 'Confirmada' ? (
                    <Button
                      fullWidth
                      onClick={() => navigate(`/mascotas/${activeCita.mascotaId}?atenderCitaId=${activeCita.id}&clinicaId=${activeCita.clinicaId}`)}
                    >
                      <FileText size={14} style={{ marginRight: 6 }} /> Iniciar Atención
                    </Button>
                  ) : (
                    <div className="consultation-completed-badge">
                      <CheckCircle2 size={16} style={{ color: 'var(--success)' }} />
                      <span>Consulta completada</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="empty-panel-state">
                <p>No hay ningún paciente en consulta activa en este momento.</p>
              </div>
            )}
          </Card>

          {/* Upcoming appointments queue panel */}
          <Card className="side-panel-card upcoming-queue-card">
            <h3 className="panel-title">
              <Clock size={16} /> Próximos turnos
            </h3>
            {upcomingCitas.length === 0 ? (
              <div className="empty-panel-state">
                <p>No quedan turnos programados para el resto del día.</p>
              </div>
            ) : (
              <div className="upcoming-queue-list">
                {upcomingCitas.slice(0, 5).map(cita => (
                  <div key={cita.id} className="queue-item">
                    <div className="queue-item-time">
                      {cita.fecha.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div className="queue-item-info">
                      <strong>{cita.mascota}</strong>
                      <span>{cita.motivo}</span>
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
