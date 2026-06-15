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
import { api } from '../../../api/client';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Spinner } from '../../../components/ui/Spinner';

import { monthNames, getEstadoBadgeVariant, getUIEstado } from '@vetvault/shared';

export function OwnerCitasView() {
  const navigate = useNavigate();

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
      refetchCitas();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al cancelar la cita');
    }
  };

  const handleConfirmBooking = async () => {
    if (!mascotaId || !clinicaId || !veterinarioId || !fecha || !hora) {
      alert('Por favor completa todos los pasos del turno.');
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
      alert('¡Turno solicitado exitosamente!');
      refetchCitas();
      // Reset wizard
      setMascotaId('');
      setClinicaId('');
      setVeterinarioId('');
      setFecha('');
      setHora('');
      setStep(1);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al agendar cita');
    } finally {
      setBooking(false);
    }
  };

  return (
    <div className="page owner-citas-page">
      <div className="page-header">
        <div>
          <h2 className="page-title">Centro de Citas</h2>
          <p className="page-subtitle">Solicitá turnos y gestioná las consultas programadas de tus mascotas</p>
        </div>
      </div>

      <div className="owner-citas-layout">
        {/* Left Column: Interactive Booking Wizard */}
        <div className="booking-wizard-section">
          <Card className="booking-wizard-card">
            <h3 className="wizard-card-title">
              <Calendar size={18} /> Solicitar Nuevo Turno
            </h3>

            <div className="wizard-stepper-progress">
              <div className={`stepper-node ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>1</div>
              <div className="stepper-line" />
              <div className={`stepper-node ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>2</div>
              <div className="stepper-line" />
              <div className={`stepper-node ${step >= 3 ? 'active' : ''} ${step > 3 ? 'completed' : ''}`}>3</div>
              <div className="stepper-line" />
              <div className={`stepper-node ${step >= 4 ? 'active' : ''} ${step > 4 ? 'completed' : ''}`}>4</div>
              <div className="stepper-line" />
              <div className={`stepper-node ${step >= 5 ? 'active' : ''} ${step > 5 ? 'completed' : ''}`}>5</div>
            </div>

            <div className="wizard-step-content" style={{ marginTop: 'var(--space-md)' }}>
              {/* STEP 1: Select Pet */}
              {step === 1 && (
                <div className="wizard-step-form">
                  <label className="wizard-input-label">Paso 1: Seleccioná la mascota</label>
                  {mascotaList.length === 0 ? (
                    <div className="wizard-empty-help">
                      <p>Primero tenés que registrar una mascota en tu perfil.</p>
                      <Button size="sm" onClick={() => navigate('/mascotas')}>Mis Mascotas</Button>
                    </div>
                  ) : (
                    <div className="wizard-selection-grid">
                      {mascotaList.map(m => (
                        <div
                          key={m.id}
                          className={`wizard-selection-card ${mascotaId === m.id ? 'selected' : ''}`}
                          onClick={() => handleMascotaChange(m.id)}
                        >
                          <PawPrint size={20} />
                          <strong>{m.nombre}</strong>
                          <span>{m.raza || 'Sin raza'}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* STEP 2: Select Clinic */}
              {step === 2 && (
                <div className="wizard-step-form">
                  <label className="wizard-input-label">Paso 2: Elegí la clínica</label>
                  <div className="wizard-back-btn-row">
                    <Button variant="ghost" size="sm" onClick={() => setStep(1)}>&larr; Volver</Button>
                  </div>
                  {clinicaList.length === 0 ? (
                    <div className="wizard-empty-help">
                      <p>Esta mascota no pertenece activamente a ninguna clínica.</p>
                    </div>
                  ) : (
                    <div className="wizard-selection-grid">
                      {clinicaList.map(c => (
                        <div
                          key={c.id}
                          className={`wizard-selection-card ${clinicaId === c.id ? 'selected' : ''}`}
                          onClick={() => handleClinicaChange(c.id)}
                        >
                          <Building size={20} />
                          <strong>{c.nombre_comercial}</strong>
                          <span>{c.direccion || 'Sin dirección'}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* STEP 3: Select Vet */}
              {step === 3 && (
                <div className="wizard-step-form">
                  <label className="wizard-input-label">Paso 3: Elegí el médico veterinario</label>
                  <div className="wizard-back-btn-row">
                    <Button variant="ghost" size="sm" onClick={() => setStep(2)}>&larr; Volver</Button>
                  </div>
                  {vetList.length === 0 ? (
                    <div className="wizard-empty-help">
                      <p>No hay veterinarios activos disponibles en esta clínica.</p>
                    </div>
                  ) : (
                    <div className="wizard-selection-grid">
                      {vetList.map(v => (
                        <div
                          key={v.id}
                          className={`wizard-selection-card ${veterinarioId === v.id ? 'selected' : ''}`}
                          onClick={() => handleVetChange(v.id)}
                        >
                          <User size={20} />
                          <strong>{v.nombre} {v.apellido}</strong>
                          <span>Matrícula: {v.numero_matricula}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* STEP 4: Choose Date */}
              {step === 4 && (
                <div className="wizard-step-form">
                  <label className="wizard-input-label">Paso 4: Selecciona el día de la cita</label>
                  <div className="wizard-back-btn-row">
                    <Button variant="ghost" size="sm" onClick={() => setStep(3)}>&larr; Volver</Button>
                  </div>
                  <div className="wizard-date-picker-row" style={{ marginTop: 'var(--space-sm)' }}>
                    <input
                      type="date"
                      className="wizard-date-input"
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
                <div className="wizard-step-form">
                  <label className="wizard-input-label">Paso 5: Horario y motivo de la consulta</label>
                  <div className="wizard-back-btn-row" style={{ marginBottom: 'var(--space-sm)' }}>
                    <Button variant="ghost" size="sm" onClick={() => setStep(4)}>&larr; Volver</Button>
                  </div>

                  <div className="wizard-motive-select-row" style={{ marginBottom: 'var(--space-md)' }}>
                    <label style={{ fontSize: '0.8125rem', fontWeight: 600, display: 'block', marginBottom: 4 }}>Motivo de la Cita</label>
                    <select
                      value={motivoId}
                      onChange={(e) => setMotivoId(e.target.value)}
                      className="wizard-native-select"
                    >
                      <option value="1">Consulta General</option>
                      <option value="2">Vacunación</option>
                      <option value="3">Cirugía</option>
                      <option value="4">Urgencia</option>
                    </select>
                  </div>

                  <label style={{ fontSize: '0.8125rem', fontWeight: 600, display: 'block', marginBottom: 8 }}>Horarios Disponibles para el {fecha}</label>
                  {loadingSlots ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '16px' }}>
                      <Spinner size={20} />
                    </div>
                  ) : availableSlots.length === 0 ? (
                    <p className="no-horarios-text">No hay turnos disponibles para este profesional en el día seleccionado.</p>
                  ) : (
                    <div className="wizard-slots-grid">
                      {availableSlots.map(slot => (
                        <button
                          key={slot}
                          type="button"
                          className={`wizard-slot-btn ${hora === slot ? 'active' : ''}`}
                          onClick={() => setHora(slot)}
                        >
                          {slot} hs
                        </button>
                      ))}
                    </div>
                  )}

                  {hora && (
                    <div className="wizard-submit-box" style={{ marginTop: 'var(--space-md)' }}>
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
        <div className="owner-bookings-section">
          {/* Active Appointments */}
          <Card className="bookings-panel-card">
            <h3 className="panel-title">
              <Clock size={16} /> Próximas Citas
            </h3>
            {activeCitas.length === 0 ? (
              <div className="empty-panel-state">
                <p>No tenés citas programadas próximamente.</p>
              </div>
            ) : (
              <div className="bookings-list">
                {activeCitas.map(cita => (
                  <div key={cita.id} className="booking-card-item">
                    <div className="booking-card-date">
                      <span className="b-day">{cita.fecha.getDate()}</span>
                      <span className="b-month">{monthNames[cita.fecha.getMonth()]}</span>
                    </div>
                    <div className="booking-card-info">
                      <strong>{cita.mascota}</strong>
                      <span className="b-reason">{cita.motivo}</span>
                      <span className="b-details">
                        {cita.fecha.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} hs · con {cita.veterinario}
                      </span>
                    </div>
                    <div className="booking-card-actions">
                      <Badge variant={getEstadoBadgeVariant(cita.estado)}>{cita.estado}</Badge>
                      {cita.estado === 'Pendiente' && (
                        <button
                          className="btn-booking-cancel"
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
          <Card className="bookings-panel-card past-bookings-card" style={{ marginTop: 'var(--space-md)' }}>
            <h3 className="panel-title">
              <CheckCircle2 size={16} /> Historial de Citas
            </h3>
            {pastCitas.length === 0 ? (
              <div className="empty-panel-state">
                <p>No tenés registros de citas pasadas.</p>
              </div>
            ) : (
              <div className="bookings-list compact">
                {pastCitas.slice(0, 5).map(cita => (
                  <div key={cita.id} className="booking-card-item">
                    <div className="booking-card-date">
                      <span className="b-day">{cita.fecha.getDate()}</span>
                      <span className="b-month">{monthNames[cita.fecha.getMonth()]}</span>
                    </div>
                    <div className="booking-card-info">
                      <strong>{cita.mascota}</strong>
                      <span className="b-reason">{cita.motivo}</span>
                      <span className="b-details">
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
