import { useState } from 'react';
import { Calendar, ClipboardList, FileDown } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Spinner } from '../../../components/ui/Spinner';
import { EmptyState } from '../../../components/ui/EmptyState';
import { formatDate } from '@vetvault/shared';
import { Button } from '../../../components/ui/Button';
import { downloadPdf } from '../../../utils/download';

interface HistorialTabProps {
  atenciones: any[];
  isLoading: boolean;
}

export function HistorialTab({ atenciones, isLoading }: HistorialTabProps) {
  const [isDownloading, setIsDownloading] = useState<string | null>(null);

  const handleDownloadPdf = async (id: string, mascotaNombre?: string) => {
    setIsDownloading(id);
    try {
      const name = mascotaNombre ? mascotaNombre.toLowerCase() : 'mascota';
      await downloadPdf(`/atenciones/${id}/pdf`, `consulta-${name}-${id.substring(0, 8)}.pdf`);
    } catch (error) {
      console.error(error);
      alert('No se pudo descargar el PDF de la consulta.');
    } finally {
      setIsDownloading(null);
    }
  };

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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div className="timeline-date">
                    <Calendar size={12} style={{ display: 'inline', verticalAlign: '-2px', marginRight: 4 }} />
                    {formatDate(a.fecha_atencion)} - Dr. {vetName}
                  </div>
                  <div className="timeline-title">
                    {diagnostics.length > 0 ? diagnostics.join(', ') : 'Consulta médica'}
                  </div>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', height: '32px' }}
                  onClick={() => handleDownloadPdf(a.id, a.mascota?.nombre)}
                  disabled={isDownloading === a.id}
                >
                  <FileDown size={14} />
                  {isDownloading === a.id ? 'Descargando...' : 'PDF'}
                </Button>
              </div>
              <p className="timeline-text" style={{ marginTop: 8 }}>{a.notes_clinicas || a.notas_clinicas || 'Sin notas adicionales.'}</p>
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

