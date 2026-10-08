import {
  CalendarDays,
  MapPin,
  Phone,
  AlertCircle,
  CalendarClock,
  XCircle,
  Plus,
  PawPrint,
  User,
} from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Spinner } from '../../../components/ui/Spinner';
import { EmptyState } from '../../../components/ui/EmptyState';
import { getEstadoBadgeVariant, getUIEstado } from '@vetvault/shared';

export interface UpcomingAppointmentBannerProps {
  upcomingCita: any | null;
  isLoading: boolean;
  onReschedule: (cita: any) => void;
  onCancel: (citaId: string) => void;
  onBookAppointment: () => void;
}

export function UpcomingAppointmentBanner({
  upcomingCita,
  isLoading,
  onReschedule,
  onCancel,
  onBookAppointment,
}: UpcomingAppointmentBannerProps) {
  if (isLoading) {
    return (
      <Card className="border border-[var(--border)] bg-[var(--surface)] p-8 flex justify-center items-center min-h-[160px]">
        <Spinner />
      </Card>
    );
  }

  if (!upcomingCita) {
    return (
      <Card className="border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
        <EmptyState
          icon={<CalendarDays size={36} className="text-[var(--accent)]" />}
          title="Sin citas pendientes"
          message="No tenés turnos programados para tus mascotas. Podés solicitar un nuevo turno cuando lo necesites."
          action={
            <Button
              variant="primary"
              size="sm"
              onClick={onBookAppointment}
              className="flex items-center gap-2 mt-1"
            >
              <Plus size={15} />
              <span>Sacar Turno</span>
            </Button>
          }
        />
      </Card>
    );
  }

  const citaDate = new Date(upcomingCita.fecha_hora);
  const estado = getUIEstado(upcomingCita);

  const getRelativeDay = (date: Date) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return { text: 'Hoy', variant: 'accent' as const };
    if (diffDays === 1) return { text: 'Mañana', variant: 'accent' as const };
    if (diffDays === 2) return { text: 'En 2 días', variant: 'neutral' as const };
    if (diffDays > 0) return { text: `En ${diffDays} días`, variant: 'neutral' as const };
    return { text: 'Próxima cita', variant: 'neutral' as const };
  };

  const relative = getRelativeDay(citaDate);

  const formattedDate = citaDate.toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  const formattedTime = citaDate.toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const pet = upcomingCita.mascota;
  const vet = upcomingCita.veterinario;
  const clinic = upcomingCita.clinica;
  const motive = upcomingCita.motivo_cita?.motivo || 'Consulta';

  const petPhoto = pet?.foto_url;

  return (
    <Card className="border border-[var(--border)] bg-[var(--surface)] overflow-hidden shadow-sm p-5 sm:p-6 relative">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Left Side: Appointment Details */}
        <div className="space-y-4 min-w-0 flex-1">
          {/* Header Tag / Status */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold tracking-wider uppercase text-[var(--text-muted)]">
              Próxima Atención
            </span>
            <Badge variant={relative.variant} className="font-semibold px-2.5 py-0.5">
              {relative.text}
            </Badge>
            <Badge variant={getEstadoBadgeVariant(estado)}>
              {estado}
            </Badge>
            {motive && (
              <Badge variant="neutral" className="capitalize">
                {motive}
              </Badge>
            )}
          </div>

          {/* Date, Time & Pet */}
          <div className="flex items-start sm:items-center gap-4">
            {/* Pet Avatar */}
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden border border-[var(--border)] bg-[var(--surface-2)] flex items-center justify-center flex-shrink-0 text-[var(--accent)] shadow-xs">
              {petPhoto ? (
                <img
                  src={petPhoto}
                  alt={pet?.nombre || 'Mascota'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-[var(--accent-light)] flex items-center justify-center font-bold text-lg text-[var(--accent)]">
                  {pet?.nombre ? pet.nombre.charAt(0).toUpperCase() : <PawPrint size={24} />}
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-2 flex-wrap">
                <h3 className="text-lg sm:text-xl font-extrabold text-[var(--text-h)] capitalize">
                  {formattedDate}
                </h3>
                <span className="text-base sm:text-lg font-bold text-[var(--accent)]">
                  {formattedTime} hs
                </span>
              </div>

              <div className="flex items-center gap-2 text-sm text-[var(--text)] mt-1">
                <span className="font-semibold text-[var(--text-h)]">{pet?.nombre || 'Mascota'}</span>
                {vet && (
                  <>
                    <span className="text-[var(--text-muted)]">·</span>
                    <span className="text-xs text-[var(--text-muted)] flex items-center gap-1">
                      <User size={12} />
                      Dr/a. {vet.nombre} {vet.apellido}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Clinic Information & Emergency contact */}
          <div className="flex flex-wrap items-center gap-y-2 gap-x-4 pt-1 text-xs text-[var(--text)]">
            {clinic?.nombre_comercial && (
              <div className="flex items-center gap-1.5 font-medium">
                <MapPin size={14} className="text-[var(--accent)] flex-shrink-0" />
                <span className="truncate">
                  {clinic.nombre_comercial}
                  {clinic.direccion ? ` — ${clinic.direccion}` : ''}
                </span>
              </div>
            )}

            {clinic?.telefono && (
              <a
                href={`tel:${clinic.telefono}`}
                className="inline-flex items-center gap-1 font-semibold text-[var(--accent)] hover:underline"
              >
                <Phone size={13} className="flex-shrink-0" />
                <span>Llamar ({clinic.telefono})</span>
              </a>
            )}

            <div className="inline-flex items-center gap-1 text-[var(--warning)] font-medium">
              <AlertCircle size={13} className="flex-shrink-0" />
              <span>Guardia activa</span>
            </div>
          </div>
        </div>

        {/* Right Side: Quick Action Triggers */}
        <div className="flex flex-wrap sm:flex-nowrap lg:flex-col items-stretch sm:items-center lg:items-end gap-2.5 pt-3 lg:pt-0 border-t lg:border-t-0 border-[var(--border)] flex-shrink-0">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onReschedule(upcomingCita)}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5"
          >
            <CalendarClock size={15} />
            <span>Reprogramar</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onCancel(upcomingCita.id)}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 text-[var(--danger)] hover:bg-[var(--danger)]/10"
          >
            <XCircle size={15} />
            <span>Cancelar</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={onBookAppointment}
            className="w-full sm:w-auto flex items-center justify-center gap-1.5 shadow-xs"
          >
            <Plus size={15} />
            <span>Sacar Turno</span>
          </Button>
        </div>
      </div>
    </Card>
  );
}
