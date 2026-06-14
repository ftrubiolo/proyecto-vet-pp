import { useState } from 'react';
import { Syringe, Calendar, ChevronDown, ChevronUp, BookOpen } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Spinner } from '../../../components/ui/Spinner';
import { EmptyState } from '../../../components/ui/EmptyState';
import { formatDate } from '@vetvault/shared';

interface VacunasTabProps {
  vacunas: any[]; // Representa el array de VacunaSerie devuelto por el backend
  isLoading: boolean;
}

const statusMeta = {
  danger: {
    color: '#dc2626',
    bgColor: 'rgba(239, 68, 68, 0.08)',
    label: 'Vencidas',
    singleLabel: 'Vencida',
    variant: 'danger' as const,
  },
  info: {
    color: '#2563eb',
    bgColor: 'rgba(37, 99, 235, 0.08)',
    label: 'En curso',
    singleLabel: 'En curso',
    variant: 'accent' as const,
  },
  warning: {
    color: '#d97706',
    bgColor: 'rgba(245, 158, 11, 0.08)',
    label: 'Próximas',
    singleLabel: 'Próxima',
    variant: 'warning' as const,
  },
  success: {
    color: '#16a34a',
    bgColor: 'rgba(34, 197, 94, 0.08)',
    label: 'Al día',
    singleLabel: 'Al día',
    variant: 'success' as const,
  },
  neutral: {
    color: '#64748b',
    bgColor: 'rgba(100, 116, 139, 0.08)',
    label: 'Sin refuerzo',
    singleLabel: 'Sin refuerzo',
    variant: 'neutral' as const,
  },
  abandoned: {
    color: '#94a3b8',
    bgColor: 'rgba(148, 163, 184, 0.08)',
    label: 'Abandonadas',
    singleLabel: 'Abandonada',
    variant: 'neutral' as const,
  },
};

const getSerieStatus = (serie: any): 'danger' | 'info' | 'warning' | 'success' | 'neutral' | 'abandoned' => {
  if (serie.estado_serie === 'abandonada') return 'abandoned';

  const protocolo = serie.protocolo;
  if (!protocolo) return 'neutral';

  // Si no se han completado las dosis primarias
  if (serie.dosis_aplicadas < (protocolo.total_dosis_serie_primaria || 1)) {
    return 'info';
  }

  // Si no requiere refuerzo
  if (!protocolo.tiene_refuerzo) {
    return 'neutral';
  }

  if (!serie.proximo_refuerzo) return 'neutral';

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const proximo = new Date(serie.proximo_refuerzo);
  proximo.setHours(0, 0, 0, 0);

  const diffTime = proximo.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return 'danger';
  }
  if (diffDays <= 30) {
    return 'warning';
  }
  return 'success';
};

export function VacunasTab({ vacunas: seriesList, isLoading }: VacunasTabProps) {
  const [expandedSeries, setExpandedSeries] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => {
    setExpandedSeries((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '32px' }}>
        <Spinner />
      </div>
    );
  }

  if (!seriesList || seriesList.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={<Syringe size={48} />}
          title="Sin vacunas registradas"
          message="Esta mascota no tiene series de vacunación registradas."
        />
      </Card>
    );
  }

  // Agrupar las series por estado
  const groups: Record<'danger' | 'info' | 'warning' | 'success' | 'neutral' | 'abandoned', any[]> = {
    danger: [],
    info: [],
    warning: [],
    success: [],
    neutral: [],
    abandoned: [],
  };

  seriesList.forEach((s) => {
    const statusKey = getSerieStatus(s);
    groups[statusKey].push(s);
  });

  const counts = {
    danger: groups.danger.length,
    info: groups.info.length,
    warning: groups.warning.length,
    success: groups.success.length,
    neutral: groups.neutral.length,
    abandoned: groups.abandoned.length,
  };

  const groupOrder = ['danger', 'info', 'warning', 'success', 'neutral', 'abandoned'] as const;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
      {/* Summary chips bar */}
      <div className="vaccine-summary-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 'var(--space-sm)' }}>
        {(['success', 'warning', 'danger', 'info'] as const).map((key) => {
          const meta = statusMeta[key];
          const count = counts[key];
          return (
            <Card key={key} variant="inner" className="vaccine-summary-card" style={{ padding: '12px 16px', display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}>
              <div className="vaccine-summary-info" style={{ display: 'flex', flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
                <span className="vaccine-summary-count" style={{ color: meta.color, fontSize: '1.6rem', fontWeight: 700, lineHeight: 1 }}>
                  {count}
                </span>
                <span className="vaccine-summary-label" style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                  {meta.label}
                </span>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Lists grouped by status */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)', marginTop: 'var(--space-sm)' }}>
        {groupOrder.map((key) => {
          const items = groups[key];
          if (items.length === 0) return null;
          const meta = statusMeta[key];

          return (
            <div key={key} className="vaccine-group-section" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
              <h4 className="vaccine-group-title" style={{ color: meta.color, fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0, borderBottom: '1px solid var(--border-color)', paddingBottom: 6 }}>
                {meta.label} ({items.length})
              </h4>
              <div className="vaccine-list" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                {items.map((s) => {
                  const prodName = s.protocolo?.nombre_comercial || 'Vacuna';
                  const totalDosis = s.protocolo?.total_dosis_serie_primaria || 1;
                  const isExpanded = !!expandedSeries[s.id];

                  // Determinar texto de progreso de dosis
                  const isComplete = s.dosis_aplicadas >= totalDosis;
                  const progressText = isComplete
                    ? `Serie primaria completa (${s.dosis_aplicadas} dosis)`
                    : `Dosis ${s.dosis_aplicadas}/${totalDosis}`;

                  return (
                    <Card
                      key={s.id}
                      variant="inner"
                      style={{
                        padding: 0,
                        overflow: 'hidden'
                      }}
                    >
                      {/* Header click to expand */}
                      <div
                        onClick={() => toggleExpand(s.id)}
                        style={{
                          padding: '16px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          cursor: 'pointer',
                          userSelect: 'none'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{
                            width: 36,
                            height: 36,
                            borderRadius: '50%',
                            backgroundColor: meta.bgColor,
                            color: meta.color,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <Syringe size={18} />
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--text-color)', fontSize: '0.92rem' }}>
                              {prodName}
                            </div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>
                              {progressText}
                              {s.proximo_refuerzo && isComplete && (
                                <>
                                  {' · '}
                                  <Calendar size={10} style={{ display: 'inline', verticalAlign: '-1px', marginRight: 2 }} />
                                  Booster: {formatDate(s.proximo_refuerzo)}
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <Badge variant={meta.variant}>{meta.singleLabel}</Badge>
                          <div style={{ color: 'var(--text-muted)' }}>
                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </div>
                        </div>
                      </div>

                      {/* Nested details table */}
                      {isExpanded && (
                        <div style={{
                          backgroundColor: 'var(--surface-solid)',
                          borderTop: '1px solid var(--border-color)',
                          padding: '12px 16px'
                        }}>
                          {s.protocolo?.observaciones && (
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 12, paddingBottom: 8, borderBottom: '1px dashed var(--border-color)' }}>
                              <BookOpen size={12} style={{ marginTop: 2, flexShrink: 0 }} />
                              <span>{s.protocolo.observaciones}</span>
                            </div>
                          )}

                          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
                            Historial de Aplicaciones
                          </span>

                          <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
                              <thead>
                                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                                  <th style={{ padding: '6px 4px', fontWeight: 500 }}>Dosis</th>
                                  <th style={{ padding: '6px 4px', fontWeight: 500 }}>Fecha</th>
                                  <th style={{ padding: '6px 4px', fontWeight: 500 }}>Lote</th>
                                  <th style={{ padding: '6px 4px', fontWeight: 500 }}>Vía</th>
                                  <th style={{ padding: '6px 4px', fontWeight: 500 }}>Observaciones</th>
                                </tr>
                              </thead>
                              <tbody>
                                {(s.dosis || []).map((d: any) => (
                                  <tr key={d.id} style={{ borderBottom: '1px dashed rgba(0,0,0,0.04)' }}>
                                    <td style={{ padding: '8px 4px', fontWeight: 600 }}>Dosis {d.numero_dosis}</td>
                                    <td style={{ padding: '8px 4px' }}>{formatDate(d.fecha_aplicacion)}</td>
                                    <td style={{ padding: '8px 4px', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                                      {d.lote || '–'}
                                    </td>
                                    <td style={{ padding: '8px 4px' }}>{d.via_administracion || 'Subcutánea'}</td>
                                    <td style={{ padding: '8px 4px', color: 'var(--text-muted)', fontStyle: d.observaciones ? 'normal' : 'italic' }}>
                                      {d.observaciones || 'Sin observaciones'}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
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
