import {
  Building2,
  MapPin,
  Phone,
  MessageCircle,
  ShieldAlert,
  Clock,
} from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';

export interface ClinicReferenceBannerProps {
  clinic: {
    id?: string;
    nombre_comercial?: string;
    direccion?: string;
    telefono?: string;
  } | null;
}

export function ClinicReferenceBanner({ clinic }: ClinicReferenceBannerProps) {
  const clinicName = clinic?.nombre_comercial || 'Clínica Veterinaria de Referencia';
  const clinicAddress = clinic?.direccion || 'Consulte la sede asignada para atención clínica';
  const rawPhone = clinic?.telefono || '';
  const cleanDigits = rawPhone.replace(/\D/g, '');
  const whatsappUrl = cleanDigits
    ? `https://wa.me/${cleanDigits.startsWith('54') ? cleanDigits : `549${cleanDigits}`}`
    : null;

  return (
    <Card className="border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6 shadow-sm">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Left: Clinic details and emergency guidance */}
        <div className="space-y-3 min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold tracking-wider uppercase text-[var(--text-muted)]">
              Centro de Atención
            </span>
            <Badge variant="warning" className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-semibold">
              <ShieldAlert size={12} className="flex-shrink-0" />
              <span>Guardia Médica y Emergencias</span>
            </Badge>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[var(--accent-light)] text-[var(--accent)] border border-[var(--border)] flex items-center justify-center flex-shrink-0">
              <Building2 size={24} />
            </div>

            <div className="min-w-0 flex-1">
              <h4 className="text-base sm:text-lg font-bold text-[var(--text-h)] truncate">
                {clinicName}
              </h4>
              <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] mt-1">
                <MapPin size={13} className="text-[var(--accent)] flex-shrink-0" />
                <span className="truncate">{clinicAddress}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] pt-1">
            <Clock size={13} className="flex-shrink-0" />
            <span>
              En situaciones de urgencia veterinaria fuera de horario, comunicate telefónicamente de inmediato.
            </span>
          </div>
        </div>

        {/* Right: Direct contact channels */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 flex-shrink-0">
          {rawPhone ? (
            <a
              href={`tel:${rawPhone}`}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold bg-[var(--surface-solid)] text-[var(--text-h)] border border-[var(--border)] hover:border-[var(--accent)] hover:bg-[var(--surface-2)] transition-all shadow-2xs"
            >
              <Phone size={14} className="text-[var(--accent)]" />
              <span>Llamar ({rawPhone})</span>
            </a>
          ) : (
            <div className="text-xs text-[var(--text-muted)] italic">
              Teléfono no disponible
            </div>
          )}

          {whatsappUrl && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold bg-[var(--surface-solid)] text-[var(--text-h)] border border-[var(--border)] hover:border-[var(--success)] hover:bg-[var(--surface-2)] transition-all shadow-2xs"
            >
              <MessageCircle size={14} className="text-[var(--success)]" />
              <span>WhatsApp</span>
            </a>
          )}
        </div>
      </div>
    </Card>
  );
}
