import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  PawPrint,
  Building,
  User,
  Clock,
  CheckCircle2,
  Trash2
} from 'lucide-react';
import { useFetch } from '../../../hooks/useFetch';
import { useToast } from '../../../hooks/useToast';
import { api } from '../../../api/client';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Spinner } from '../../../components/ui/Spinner';

import { monthNames, getEstadoBadgeVariant, getUIEstado } from '@vetvault/shared';

export function OwnerCitasView() {
  const navigate = useNavigate();
  const { toast } = useToast();

  // Booking Wizard States
  const [step, setStep] = useState(1);
  const [mascotaId, setMascotaId] = useState('');
  const [clinicaId, setClinicaId] = useState('');
  const [veterinarioId, setVeterinarioId] = useState('');
  const [motivoId, setMotivoId] = useState('1');
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [booking, setBooking] = useState(false);

  // Load static data
  const { data: mascotas } = useFetch<any[]>('/mascotas');
  
  // Only load clinics linked to pet
  const { data: clinicas } = useFetch<any[]>(
    mascotaId ? `/clinicas/mascota/${mascotaId}` : null
  );

  // Vets at clinic
  const { data: veterinarios } = useFetch<any[]>(
    clinicaId ? `/veterinarios/clinica/${clinicaId}` : null
  );

  // Load existing user appointments
  const { data: rawCitas, refetch: refetchCitas } = useFetch<any[]>('/citas');

  const citas = (rawCitas || []).map((c: any) => ({
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

  const activeCitas = citas.filter(c => c.estado === 'Confirmada' || c.estado === 'Pendiente');
  const pastCitas = citas.filter(c => c.estado === 'Completada' || c.estado === 'Cancelada');

  const mascotaList = Array.isArray(mascotas) ? mascotas : [];
  const clinicaList = Array.isArray(clinicas) ? clinicas : [];
  const vetList = Array.isArray(veterinarios) ? veterinarios : [];

  // Fetch available slots when parameters change
  useEffect(() => {
    const fetchSlots = async () => {
      if (!clinicaId || !veterinarioId || !fecha) {
        setAvailableSlots([]);
        return;
      }

      setLoadingSlots(true);
      try {
        const slots = await api.get<string[]>(
          `/citas/disponibilidad?clinicaId=${clinicaId}&veterinarioId=${veterinarioId}&fecha=${fecha}`
        );
        setAvailableSlots(slots || []);
      } catch (err) {
        console.error(err);
        setAvailableSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    };

    fetchSlots();
  }, [clinicaId, veterinarioId, fecha]);

  const handleMascotaChange = (id: string) => {
    setMascotaId(id);
    setClinicaId('');
    setVeterinarioId('');
    setFecha('');
    setHora('');
    setStep(2);
  };

  const handleClinicaChange = (id: string) => {
    setClinicaId(id);
    setVeterinarioId('');
    setFecha('');
    setHora('');
    setStep(3);
  };

  const handleVetChange = (id: string) => {
    setVeterinarioId(id);
    setFecha('');
    setHora('');
    setStep(4);
  };

  const handleCancelCita = async (citaId: string) => {
    if (!confirm('¿Seguro que querés cancelar este turno?')) return;
    try {
      await api.patch(`/citas/${citaId}`, { estado_cita_id: 3 }); // 3 = Cancelada
      toast.success('Turno cancelado exitosamente');
      refetchCitas();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al cancelar la cita');
    }
  };

  const handleConfirmBooking = async () => {
    if (!mascotaId || !clinicaId || !veterinarioId || !fecha || !hora) {
      toast.warning('Por favor completa todos los pasos del turno.');
      return;
    }

    setBooking(true);
    const fechaHora = new Date(`${fecha}T${hora}`);

    try {
      await api.post('/citas', {
        mascota_id: mascotaId,
        veterinario_id: veterinarioId,
        clinica_id: clinicaId,
        fecha_hora: fechaHora.toISOString(),
        motivo_id: Number(motivoId),
        estado_cita_id: 1, // Agendada (Pendiente)
      });
      toast.success('¡Turno solicitado exitosamente!');
      refetchCitas();
      // Reset wizard
      setMascotaId('');
      setClinicaId('');
      setVeterinarioId('');
      setFecha('');
      setHora('');
      setStep(1);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al agendar cita');
    } finally {
      setBooking(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[var(--text-h)] font-[var(--heading)]">Centro de Citas</h2>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">Solicitá turnos y gestioná las consultas programadas de tus mascotas</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Interactive Booking Wizard */}
        <div className="lg:col-span-7">
          <Card className="p-6 border border-[var(--border)]">
            <h3 className="text-base font-bold text-[var(--text-h)] flex items-center gap-2 mb-4">
              <Calendar size={18} className="text-[var(--accent)]" /> Solicitar Nuevo Turno
            </h3>

            {/* Stepper */}
            <div className="flex items-center justify-between px-2 py-3 mb-4">
              {[1, 2, 3, 4, 5].map((s, idx) => (
                <div key={s} className="flex items-center flex-1 last:flex-none">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all border ${
                      step >= s
                        ? 'bg-[var(--accent)] text-white border-[var(--accent)] shadow-sm'
                        : 'bg-[var(--surface-2)] text-[var(--text-muted)] border-[var(--border)]'
                    }`}
                  >
                    {s}
                  </div>
                  {idx < 4 && (
                    <div
                      className={`flex-1 h-[2px] mx-2 transition-all ${
                        step > s ? 'bg-[var(--accent)]' : 'bg-[var(--border)]'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>

            <div className="mt-4">
              {/* STEP 1: Select Pet */}
              {step === 1 && (
                <div className="space-y-3">
                  <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] block">
                    Paso 1: Seleccioná la mascota
                  </label>
                  {mascotaList.length === 0 ? (
                    <div className="text-center p-8 bg-[var(--surface-2)] rounded-xl border border-[var(--border)] space-y-3">
                      <p className="text-sm text-[var(--text-muted)]">Primero tenés que registrar una mascota en tu perfil.</p>
                      <Button size="sm" onClick={() => navigate('/mascotas')}>Mis Mascotas</Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {mascotaList.map(m => (
                        <div
                          key={m.id}
                          className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col gap-1 items-start ${
                            mascotaId === m.id
                              ? 'border-[var(--accent)] bg-[var(--accent-light)] ring-2 ring-[var(--accent-light)] text-[var(--text-h)]'
                              : 'border-[var(--border)] bg-[var(--surface-solid)] hover:border-[var(--accent)]/50 text-[var(--text)]'
                          }`}
                          onClick={() => handleMascotaChange(m.id)}
                        >
                          <PawPrint size={20} className="text-[var(--accent)]" />
                          <strong className="text-sm font-bold text-[var(--text-h)]">{m.nombre}</strong>
                          <span className="text-xs text-[var(--text-muted)]">{m.raza || 'Sin raza'}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* STEP 2: Select Clinic */}
              {step === 2 && (
                <div className="space-y-3">
                  <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] block">
                    Paso 2: Elegí la clínica
                  </label>
                  <div className="flex justify-start">
                    <Button variant="ghost" size="sm" onClick={() => setStep(1)}>&larr; Volver</Button>
                  </div>
                  {clinicaList.length === 0 ? (
                    <div className="text-center p-8 bg-[var(--surface-2)] rounded-xl border border-[var(--border)]">
                      <p className="text-sm text-[var(--text-muted)]">Esta mascota no pertenece activamente a ninguna clínica.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {clinicaList.map(c => (
                        <div
                          key={c.id}
                          className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col gap-1 items-start ${
                            clinicaId === c.id
                              ? 'border-[var(--accent)] bg-[var(--accent-light)] ring-2 ring-[var(--accent-light)] text-[var(--text-h)]'
                              : 'border-[var(--border)] bg-[var(--surface-solid)] hover:border-[var(--accent)]/50 text-[var(--text)]'
                          }`}
                          onClick={() => handleClinicaChange(c.id)}
                        >
                          <Building size={20} className="text-[var(--accent)]" />
                          <strong className="text-sm font-bold text-[var(--text-h)]">{c.nombre_comercial}</strong>
                          <span className="text-xs text-[var(--text-muted)]">{c.direccion || 'Sin dirección'}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* STEP 3: Select Vet */}
              {step === 3 && (
                <div className="space-y-3">
                  <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] block">
                    Paso 3: Elegí el médico veterinario
                  </label>
                  <div className="flex justify-start">
                    <Button variant="ghost" size="sm" onClick={() => setStep(2)}>&larr; Volver</Button>
                  </div>
                  {vetList.length === 0 ? (
                    <div className="text-center p-8 bg-[var(--surface-2)] rounded-xl border border-[var(--border)]">
                      <p className="text-sm text-[var(--text-muted)]">No hay veterinarios activos disponibles en esta clínica.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {vetList.map(v => (
                        <div
                          key={v.id}
                          className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col gap-1 items-start ${
                            veterinarioId === v.id
                              ? 'border-[var(--accent)] bg-[var(--accent-light)] ring-2 ring-[var(--accent-light)] text-[var(--text-h)]'
                              : 'border-[var(--border)] bg-[var(--surface-solid)] hover:border-[var(--accent)]/50 text-[var(--text)]'
                          }`}
                          onClick={() => handleVetChange(v.id)}
                        >
                          <User size={20} className="text-[var(--accent)]" />
                          <strong className="text-sm font-bold text-[var(--text-h)]">{v.nombre} {v.apellido}</strong>
                          <span className="text-xs text-[var(--text-muted)]">Matrícula: {v.numero_matricula}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* STEP 4: Choose Date */}
              {step === 4 && (
                <div className="space-y-3">
                  <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] block">
                    Paso 4: Selecciona el día de la cita
                  </label>
                  <div className="flex justify-start">
                    <Button variant="ghost" size="sm" onClick={() => setStep(3)}>&larr; Volver</Button>
                  </div>
                  <div className="mt-2">
                    <input
                      type="date"
                      className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface-solid)] text-[var(--text-h)] text-sm focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-light)] outline-none"
                      value={fecha}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(e) => {
                        setFecha(e.target.value);
                        setStep(5);
                      }}
                    />
                  </div>
                </div>
              )}

              {/* STEP 5: Choose Slot and Motive */}
              {step === 5 && (
                <div className="space-y-4">
                  <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] block">
                    Paso 5: Horario y motivo de la consulta
                  </label>
                  <div className="flex justify-start mb-2">
                    <Button variant="ghost" size="sm" onClick={() => setStep(4)}>&larr; Volver</Button>
                  </div>

                  <div className="space-y-1.5 mb-4">
                    <label className="text-xs font-semibold text-[var(--text-h)]">Motivo de la Cita</label>
                    <select
                      value={motivoId}
                      onChange={(e) => setMotivoId(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface-solid)] text-[var(--text-h)] text-sm focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-light)] outline-none"
                    >
                      <option value="1">Consulta General</option>
                      <option value="2">Vacunación</option>
                      <option value="3">Cirugía</option>
                      <option value="4">Urgencia</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[var(--text-h)] block mb-2">
                      Horarios Disponibles para el {fecha}
                    </label>
                    {loadingSlots ? (
                      <div className="flex justify-center p-6">
                        <Spinner size={20} />
                      </div>
                    ) : availableSlots.length === 0 ? (
                      <p className="text-xs text-[var(--text-muted)] italic py-2">
                        No hay turnos disponibles para este profesional en el día seleccionado.
                      </p>
                    ) : (
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {availableSlots.map(slot => (
                          <button
                            key={slot}
                            type="button"
                            className={`py-2 px-3 rounded-lg text-xs font-semibold border transition cursor-pointer text-center ${
                              hora === slot
                                ? 'bg-[var(--accent)] text-white border-[var(--accent)] shadow-sm'
                                : 'border-[var(--border)] bg-[var(--surface-solid)] hover:border-[var(--accent)] text-[var(--text)]'
                            }`}
                            onClick={() => setHora(slot)}
                          >
                            {slot} hs
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {hora && (
                    <div className="mt-4 pt-2">
                      <Button fullWidth onClick={handleConfirmBooking} disabled={booking}>
                        {booking ? 'Solicitando...' : 'Confirmar Turno'}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right Column: Active and Past Bookings */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Active Appointments */}
          <Card className="p-5 border border-[var(--border)]">
            <h3 className="text-sm font-bold text-[var(--text-h)] flex items-center gap-2 mb-3">
              <Clock size={16} className="text-[var(--accent)]" /> Próximas Citas
            </h3>
            {activeCitas.length === 0 ? (
              <div className="h-28 flex items-center justify-center text-xs text-[var(--text-muted)] text-center p-4 bg-[var(--surface-2)] rounded-xl border border-[var(--border)]">
                <p>No tenés citas programadas próximamente.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {activeCitas.map(cita => (
                  <div key={cita.id} className="flex items-center gap-3 p-3 rounded-xl border border-[var(--border)] bg-[var(--surface-solid)]">
                    <div className="w-12 h-12 rounded-xl bg-[var(--accent-light)] text-[var(--accent)] flex flex-col items-center justify-center flex-shrink-0 font-bold leading-none">
                      <span className="text-base">{cita.fecha.getDate()}</span>
                      <span className="text-[10px] uppercase font-semibold mt-0.5">{monthNames[cita.fecha.getMonth()]}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <strong className="text-sm font-bold text-[var(--text-h)] block truncate">{cita.mascota}</strong>
                      <span className="text-xs text-[var(--text-muted)] block truncate">{cita.motivo}</span>
                      <span className="text-[11px] text-[var(--text-muted)] block truncate">
                        {cita.fecha.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} hs · con {cita.veterinario}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge variant={getEstadoBadgeVariant(cita.estado)}>{cita.estado}</Badge>
                      {cita.estado === 'Pendiente' && (
                        <button
                          className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition cursor-pointer"
                          onClick={() => handleCancelCita(cita.id)}
                          title="Cancelar turno"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Past Appointments */}
          <Card className="p-5 border border-[var(--border)]">
            <h3 className="text-sm font-bold text-[var(--text-h)] flex items-center gap-2 mb-3">
              <CheckCircle2 size={16} className="text-[var(--accent)]" /> Historial de Citas
            </h3>
            {pastCitas.length === 0 ? (
              <div className="h-28 flex items-center justify-center text-xs text-[var(--text-muted)] text-center p-4 bg-[var(--surface-2)] rounded-xl border border-[var(--border)]">
                <p>No tenés registros de citas pasadas.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {pastCitas.slice(0, 5).map(cita => (
                  <div key={cita.id} className="flex items-center gap-3 p-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface-2)]">
                    <div className="w-10 h-10 rounded-xl bg-[var(--surface-solid)] text-[var(--text-muted)] flex flex-col items-center justify-center flex-shrink-0 font-bold leading-none border border-[var(--border)]">
                      <span className="text-sm">{cita.fecha.getDate()}</span>
                      <span className="text-[9px] uppercase font-semibold">{monthNames[cita.fecha.getMonth()]}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <strong className="text-xs font-semibold text-[var(--text-h)] block truncate">{cita.mascota}</strong>
                      <span className="text-[11px] text-[var(--text-muted)] block truncate">{cita.motivo}</span>
                      <span className="text-[10px] text-[var(--text-muted)] block truncate">
                        con {cita.veterinario}
                      </span>
                    </div>
                    <Badge variant={getEstadoBadgeVariant(cita.estado)}>{cita.estado}</Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
