import type { MouseEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { PawPrint, Syringe, FileText, ChevronRight } from 'lucide-react';
import type { Mascota } from '@vetvault/shared';
import { calcAge } from '@vetvault/shared';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Spinner } from '../../../components/ui/Spinner';

export type VaccineMilestoneStatus = 'al_dia' | 'proxima' | 'vencida' | 'en_curso' | 'sin_registro';

export interface PetVaccineInfo {
  status: VaccineMilestoneStatus;
  label: string;
  variant: 'success' | 'warning' | 'danger' | 'accent' | 'neutral';
  vencidas: number;
  proximas: number;
  enCurso: number;
}

export function computePetVaccineStatus(series: any[] | undefined): PetVaccineInfo {
  if (!series || series.length === 0) {
    return {
      status: 'sin_registro',
      label: 'Sin vacunas registradas',
      variant: 'neutral',
      vencidas: 0,
      proximas: 0,
      enCurso: 0,
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

  let vencidas = 0;
  let proximas = 0;
  let enCurso = 0;

  for (const s of series) {
    if (s.estado_serie === 'abandonada') continue;

    const proto = s.protocolo;
    const reqDosis = proto?.total_dosis_serie_primaria || 1;

    // Si aún no completó la serie primaria de dosis
    if (s.dosis_aplicadas < reqDosis) {
      enCurso++;
      continue;
    }

    // Si no requiere refuerzo o no hay fecha de próximo refuerzo
    if (!proto?.tiene_refuerzo || !s.proximo_refuerzo) {
      continue;
    }

    let nextDoseDate: Date;
    if (s.proximo_refuerzo instanceof Date) {
      nextDoseDate = new Date(s.proximo_refuerzo.getTime());
    } else {
      const str = String(s.proximo_refuerzo);
      if (!str.includes('T')) {
        const parts = str.split('-');
        if (parts.length === 3) {
          nextDoseDate = new Date(
            parseInt(parts[0], 10),
            parseInt(parts[1], 10) - 1,
            parseInt(parts[2], 10)
          );
        } else {
          nextDoseDate = new Date(str);
        }
      } else {
        nextDoseDate = new Date(str);
      }
    }
    nextDoseDate.setHours(0, 0, 0, 0);

    const diffMs = nextDoseDate.getTime() - today.getTime();
    if (diffMs < 0) {
      vencidas++;
    } else if (diffMs <= thirtyDaysMs) {
      proximas++;
    }
  }

  if (vencidas > 0) {
    return {
      status: 'vencida',
      label: vencidas === 1 ? 'Vacuna vencida' : `Vacunas vencidas (${vencidas})`,
      variant: 'danger',
      vencidas,
      proximas,
      enCurso,
    };
  }

  if (proximas > 0) {
    return {
      status: 'proxima',
      label: proximas === 1 ? 'Vacuna próxima' : `Vacunas próximas (${proximas})`,
      variant: 'warning',
      vencidas,
      proximas,
      enCurso,
    };
  }

  if (enCurso > 0) {
    return {
      status: 'en_curso',
      label: 'En curso',
      variant: 'accent',
      vencidas,
      proximas,
      enCurso,
    };
  }

  return {
    status: 'al_dia',
    label: 'Al día',
    variant: 'success',
    vencidas: 0,
    proximas: 0,
    enCurso: 0,
  };
}

export interface PetHealthPassportCardProps {
  mascota: Mascota;
  series?: any[];
  isVaccinesLoading?: boolean;
}

export function PetHealthPassportCard({
  mascota,
  series,
  isVaccinesLoading = false,
}: PetHealthPassportCardProps) {
  const navigate = useNavigate();
  const vaccineInfo = computePetVaccineStatus(series);

  const handleCardClick = () => {
    navigate(`/mascotas/${mascota.id}`);
  };

  const handleShortcutClick = (e: MouseEvent, tab: string) => {
    e.stopPropagation();
    navigate(`/mascotas/${mascota.id}?tab=${tab}`);
  };

  const hasPhoto = Boolean(mascota.foto_url && mascota.foto_url.trim() !== '');

  return (
    <Card
      variant="inner"
      clickable
      onClick={handleCardClick}
      className="group flex flex-col justify-between h-full p-4.5 transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--accent)] hover:shadow-md"
    >
      <div className="space-y-3.5">
        {/* Top Header: Avatar & Main Identity */}
        <div className="flex items-start gap-3.5">
          <div className="w-14 h-14 rounded-2xl overflow-hidden border border-[var(--border)] bg-[var(--surface-solid)] flex items-center justify-center flex-shrink-0 text-[var(--accent)] shadow-xs">
            {hasPhoto ? (
              <img
                src={mascota.foto_url!}
                alt={mascota.nombre}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full bg-[var(--accent-light)] flex items-center justify-center font-bold text-lg text-[var(--accent)]">
                {mascota.nombre ? (
                  mascota.nombre.charAt(0).toUpperCase()
                ) : (
                  <PawPrint size={22} />
                )}
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-1">
              <h4 className="text-base font-bold text-[var(--text-h)] truncate group-hover:text-[var(--accent)] transition-colors">
                {mascota.nombre}
              </h4>
              <ChevronRight
                size={16}
                className="text-[var(--text-muted)] group-hover:text-[var(--accent)] group-hover:translate-x-0.5 transition-all flex-shrink-0"
              />
            </div>
            <p className="text-xs text-[var(--text-muted)] truncate mt-0.5">
              {mascota.raza || 'Sin raza'}
              {mascota.especie ? ` · ${mascota.especie}` : ''}
            </p>

            {/* Quick age */}
            <div className="text-[11px] font-medium text-[var(--text-muted)] mt-1">
              {calcAge(mascota.fecha_nacimiento)}
            </div>
          </div>
        </div>

        {/* Badges: Sex, Neutered, Dynamic Vaccine Milestone */}
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          <Badge variant={mascota.sexo === 'M' ? 'accent' : 'neutral'} className="text-[11px] py-0.5 px-2">
            {mascota.sexo === 'M' ? 'Macho' : 'Hembra'}
          </Badge>

          {mascota.es_castrado && (
            <Badge variant="neutral" className="text-[11px] py-0.5 px-2">
              Castrado/a
            </Badge>
          )}

          {isVaccinesLoading ? (
            <div className="inline-flex items-center gap-1 py-0.5 px-2 rounded-full border border-[var(--border)] bg-[var(--surface-solid)] text-[11px] text-[var(--text-muted)]">
              <Spinner size={10} />
              <span>Vacunas...</span>
            </div>
          ) : (
            <Badge variant={vaccineInfo.variant} className="inline-flex items-center gap-1.5 text-[11px] py-0.5 px-2">
              <Syringe size={11} className="flex-shrink-0" />
              <span>{vaccineInfo.label}</span>
            </Badge>
          )}
        </div>
      </div>

      {/* Preventative Health Shortcuts */}
      <div className="pt-3.5 mt-3.5 border-t border-[var(--border)] flex items-center gap-2">
        <button
          type="button"
          onClick={(e) => handleShortcutClick(e, 'vacunas')}
          className="flex-1 py-1.5 px-2.5 rounded-xl text-xs font-semibold bg-[var(--surface-solid)] hover:bg-[var(--surface)] text-[var(--text-h)] border border-[var(--border)] hover:border-[var(--accent)] transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
          title="Ver carnet digital de vacunas"
        >
          <Syringe size={13} className="text-[var(--accent)] flex-shrink-0" />
          <span className="truncate">Carnet de Vacunación</span>
        </button>

        <button
          type="button"
          onClick={(e) => handleShortcutClick(e, 'historial')}
          className="flex-1 py-1.5 px-2.5 rounded-xl text-xs font-semibold bg-[var(--surface-solid)] hover:bg-[var(--surface)] text-[var(--text-h)] border border-[var(--border)] hover:border-[var(--accent)] transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
          title="Ver historial clínico completo"
        >
          <FileText size={13} className="text-[var(--accent)] flex-shrink-0" />
          <span className="truncate">Historial Clínico</span>
        </button>
      </div>
    </Card>
  );
}
