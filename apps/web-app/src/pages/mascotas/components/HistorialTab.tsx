import { Calendar, ClipboardList } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Spinner } from '../../../components/ui/Spinner';
import { EmptyState } from '../../../components/ui/EmptyState';
import { formatDate } from '../utils';

interface HistorialTabProps {
  atenciones: any[];
  isLoading: boolean;
}

export function HistorialTab({ atenciones, isLoading }: HistorialTabProps) {
  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '32px' }}>
        <Spinner />
      </div>
    );
  }

  if (atenciones.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={<ClipboardList size={48} />}
          title="Sin historial clínico"
          message="Esta mascota no tiene atenciones registradas."
        />
      </Card>
    );
  }

  return (
    <div className="timeline">
      {atenciones.map((a) => {
        const diagnostics: string[] = a.atenciones_diagnosticos?.map((ad: any) => ad.diagnostico?.diagnostico) || [];
        const vetName = a.veterinario ? `${a.veterinario.nombre} ${a.veterinario.apellido || ''}`.trim() : 'Veterinario';
        return (
          <div key={a.id} className="timeline-item">
            <div className="timeline-dot" />
            <Card variant="inner" className="timeline-content">
              <div className="timeline-date">
                <Calendar size={12} style={{ display: 'inline', verticalAlign: '-2px', marginRight: 4 }} />
                {formatDate(a.fecha_atencion)} - Dr. {vetName}
              </div>
              <div className="timeline-title">
                {diagnostics.length > 0 ? diagnostics.join(', ') : 'Consulta médica'}
              </div>
              <p className="timeline-text">{a.notes_clinicas || a.notas_clinicas || 'Sin notas adicionales.'}</p>
              {a.peso_actual && (
                <span style={{ marginTop: 8, display: 'inline-block' }}>
                  <Badge variant="neutral" className="text-sm">
                    Peso: {a.peso_actual} kg
                  </Badge>
                </span>
              )}
            </Card>
          </div>
        );
      })}
    </div>
  );
}
