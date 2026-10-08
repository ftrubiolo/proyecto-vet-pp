import { useState, useEffect, type FormEvent } from 'react';
import { Calendar, Clock, MapPin, PawPrint } from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { useToast } from '../../../hooks/useToast';
import { api } from '../../../api/client';

export interface RescheduleCitaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  cita: {
    id: string;
    fecha_hora: string | Date;
    mascota?: { nombre?: string };
    clinica?: { nombre_comercial?: string; direccion?: string };
    motivo_cita?: { motivo?: string };
  } | null;
}

export function RescheduleCitaModal({
  isOpen,
  onClose,
  onSuccess,
  cita,
}: RescheduleCitaModalProps) {
  const { toast } = useToast();
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (cita && cita.fecha_hora) {
      const dateObj = new Date(cita.fecha_hora);
      if (!isNaN(dateObj.getTime())) {
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        const hours = String(dateObj.getHours()).padStart(2, '0');
        const minutes = String(dateObj.getMinutes()).padStart(2, '0');
        setFecha(`${year}-${month}-${day}`);
        setHora(`${hours}:${minutes}`);
      }
    }
  }, [cita]);

  if (!isOpen || !cita) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!fecha || !hora) {
      toast.warning('Por favor seleccioná una fecha y hora válidas.');
      return;
    }

    const newFechaHora = new Date(`${fecha}T${hora}`);
    if (isNaN(newFechaHora.getTime())) {
      toast.error('Formato de fecha u hora inválido.');
      return;
    }

    if (newFechaHora.getTime() < Date.now() - 60000) {
      toast.warning('La nueva fecha y hora debe ser posterior al momento actual.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.patch(`/citas/${cita.id}`, {
        fecha_hora: newFechaHora.toISOString(),
      });
      toast.success('Turno reprogramado exitosamente');
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al reprogramar la cita');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentDateObj = new Date(cita.fecha_hora);
  const formattedCurrentDate = !isNaN(currentDateObj.getTime())
    ? currentDateObj.toLocaleDateString('es-AR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  // Min date is today
  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Reprogramar Turno"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form="reschedule-cita-form"
            variant="primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Guardando...' : 'Confirmar Reprogramación'}
          </Button>
        </>
      }
    >
      <form
        id="reschedule-cita-form"
        className="space-y-4 py-1"
        onSubmit={handleSubmit}
      >
        {/* Current appointment info summary card */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-4 space-y-2.5">
          <div className="flex items-center justify-between text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
            <span>Cita actual</span>
            {cita.motivo_cita?.motivo && (
              <span className="text-[var(--accent)] font-medium capitalize">
                {cita.motivo_cita.motivo}
              </span>
            )}
          </div>

          <div className="flex flex-col gap-1.5 text-sm">
            {cita.mascota?.nombre && (
              <div className="flex items-center gap-2 font-medium text-[var(--text-h)]">
                <PawPrint size={15} className="text-[var(--accent)] flex-shrink-0" />
                <span>Paciente: {cita.mascota.nombre}</span>
              </div>
            )}

            {cita.clinica?.nombre_comercial && (
              <div className="flex items-center gap-2 text-[var(--text)]">
                <MapPin size={15} className="text-[var(--text-muted)] flex-shrink-0" />
                <span className="truncate">
                  {cita.clinica.nombre_comercial}
                  {cita.clinica.direccion ? ` (${cita.clinica.direccion})` : ''}
                </span>
              </div>
            )}

            {formattedCurrentDate && (
              <div className="flex items-center gap-2 text-[var(--text-muted)]">
                <Calendar size={15} className="text-[var(--text-muted)] flex-shrink-0" />
                <span className="capitalize">{formattedCurrentDate} hs</span>
              </div>
            )}
          </div>
        </div>

        {/* New date and time selection */}
        <div className="space-y-3 pt-1">
          <div className="text-sm font-semibold text-[var(--text-h)] flex items-center gap-2">
            <Clock size={16} className="text-[var(--accent)]" />
            <span>Seleccionar nueva fecha y horario</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Nueva Fecha"
              type="date"
              min={todayStr}
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              required
            />
            <Input
              label="Nuevo Horario"
              type="time"
              value={hora}
              onChange={(e) => setHora(e.target.value)}
              required
            />
          </div>
        </div>
      </form>
    </Modal>
  );
}
