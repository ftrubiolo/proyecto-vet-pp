import { Syringe, Hash } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Spinner } from '../../../components/ui/Spinner';
import { EmptyState } from '../../../components/ui/EmptyState';
import { formatDate } from '../utils';

interface VacunasTabProps {
  vacunas: any[];
  isLoading: boolean;
}

const statusMeta = {
  danger: {
    color: '#dc2626',
    bgColor: 'rgba(239, 68, 68, 0.08)',
    label: 'Vencida',
    variant: 'danger' as const,
  },
  warning: {
    color: '#d97706',
    bgColor: 'rgba(245, 158, 11, 0.08)',
    label: 'Próxima',
    variant: 'warning' as const,
  },
  success: {
    color: '#16a34a',
    bgColor: 'rgba(34, 197, 94, 0.08)',
    label: 'Al día',
    variant: 'success' as const,
  },
  neutral: {
    color: '#64748b',
    bgColor: 'rgba(100, 116, 139, 0.08)',
    label: 'Sin refuerzo',
    variant: 'neutral' as const,
  },
};

const getStatusKey = (fechaProximaDosis: any): 'danger' | 'warning' | 'success' | 'neutral' => {
  if (!fechaProximaDosis) {
    return 'neutral';
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let nextDoseDate: Date;
  if (fechaProximaDosis instanceof Date) {
    nextDoseDate = new Date(fechaProximaDosis.getTime());
    nextDoseDate.setHours(0, 0, 0, 0);
  } else {
    const str = String(fechaProximaDosis);
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
        nextDoseDate.setHours(0, 0, 0, 0);
      }
    } else {
      nextDoseDate = new Date(str);
      nextDoseDate.setHours(0, 0, 0, 0);
    }
  }

  const todayMs = today.getTime();
  const nextDoseMs = nextDoseDate.getTime();
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

  if (nextDoseMs < todayMs) {
    return 'danger';
  } else if (nextDoseMs <= todayMs + thirtyDaysMs) {
    return 'warning';
  } else {
    return 'success';
  }
};

const getRelativeDateLabel = (dateStr: any): string => {
  if (!dateStr) return '';

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let targetDate: Date;
  if (dateStr instanceof Date) {
    targetDate = new Date(dateStr.getTime());
    targetDate.setHours(0, 0, 0, 0);
  } else {
    const str = String(dateStr);
    if (!str.includes('T')) {
      const parts = str.split('-');
      if (parts.length === 3) {
        targetDate = new Date(
          parseInt(parts[0], 10),
          parseInt(parts[1], 10) - 1,
          parseInt(parts[2], 10)
        );
      } else {
        targetDate = new Date(str);
        targetDate.setHours(0, 0, 0, 0);
      }
    } else {
      targetDate = new Date(str);
      targetDate.setHours(0, 0, 0, 0);
    }
  }

  const diffTime = targetDate.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return ' (hoy)';
  } else if (diffDays === 1) {
    return ' (mañana)';
  } else if (diffDays === -1) {
    return ' (ayer)';
  } else if (diffDays > 1 && diffDays <= 7) {
    return ` (en ${diffDays} días)`;
  } else if (diffDays < -1 && diffDays >= -7) {
    return ` (hace ${Math.abs(diffDays)} días)`;
  }

  return '';
};

export function VacunasTab({ vacunas, isLoading }: VacunasTabProps) {
  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '32px' }}>
        <Spinner />
      </div>
    );
  }

  if (vacunas.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={<Syringe size={48} />}
          title="Sin vacunas registradas"
          message="Esta mascota no tiene vacunas aplicadas."
        />
      </Card>
    );
  }

  // Categorize vaccines into groups
  const groups: Record<'danger' | 'warning' | 'success' | 'neutral', any[]> = {
    danger: [],
    warning: [],
    success: [],
    neutral: [],
  };

  vacunas.forEach((v) => {
    const statusKey = getStatusKey(v.fecha_proxima_dosis);
    groups[statusKey].push(v);
  });

  const counts = {
    danger: groups.danger.length,
    warning: groups.warning.length,
    success: groups.success.length,
    neutral: groups.neutral.length,
  };

  const groupOrder = ['danger', 'warning', 'success', 'neutral'] as const;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
      {/* Summary Row */}
      <div className="vaccine-summary-grid">
        {(['success', 'warning', 'danger', 'neutral'] as const).map((key) => {
          const meta = statusMeta[key];
          const count = counts[key];
          return (
            <Card key={key} variant="inner" className="vaccine-summary-card">
              <div className="vaccine-summary-info">
                <div className="vaccine-summary-count" style={{ color: meta.color }}>
                  {count}
                </div>
                <div className="vaccine-summary-label">{meta.label}</div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Grouped Lists */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
        {groupOrder.map((key) => {
          const items = groups[key];
          if (items.length === 0) return null;
          const meta = statusMeta[key];

          return (
            <div key={key} className="vaccine-group-section">
              <h4 className="vaccine-group-title" style={{ color: meta.color }}>
                {meta.label} ({items.length})
              </h4>
              <div className="vaccine-list">
                {items.map((v) => {
                  const prodName = v.producto?.nombre_comercial || 'Vacuna';
                  const relativeLabel = getRelativeDateLabel(v.fecha_proxima_dosis);
                  return (
                    <Card key={v.id} variant="inner">
                      <div className="vaccine-card">
                        <div className="vaccine-icon" style={{ backgroundColor: meta.bgColor, color: meta.color }}>
                          <Syringe size={18} />
                        </div>
                        <div className="vaccine-info">
                          <div className="vaccine-name">{prodName}</div>
                          <div className="vaccine-detail">
                            Aplicada: {formatDate(v.fecha_aplicacion)}
                            {v.fecha_proxima_dosis && ` · Próxima: ${formatDate(v.fecha_proxima_dosis)}${relativeLabel}`}
                          </div>
                          {v.numero_lote && (
                            <div className="vaccine-detail">
                              <Hash size={10} style={{ display: 'inline', verticalAlign: '-1px', marginRight: 2 }} />
                              Lote: {v.numero_lote}
                            </div>
                          )}
                        </div>
                        <Badge variant={meta.variant}>{meta.label}</Badge>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
