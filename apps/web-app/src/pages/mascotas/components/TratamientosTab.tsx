import { useState } from 'react';
import { Pill, FileDown } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Spinner } from '../../../components/ui/Spinner';
import { EmptyState } from '../../../components/ui/EmptyState';
import { formatDate } from '@vetvault/shared';
import { Button } from '../../../components/ui/Button';
import { downloadPdf } from '../../../utils/download';

interface TratamientosTabProps {
  tratamientos: any[];
  isLoading: boolean;
  mascotaNombre?: string;
}

export function TratamientosTab({ tratamientos, isLoading, mascotaNombre }: TratamientosTabProps) {
  const [isDownloading, setIsDownloading] = useState<string | null>(null);

  const handleDownloadPdf = async (id: string) => {
    setIsDownloading(id);
    try {
      const name = mascotaNombre ? mascotaNombre.toLowerCase() : 'mascota';
      await downloadPdf(`/tratamientos/${id}/pdf`, `tratamiento-${name}-${id.substring(0, 8)}.pdf`);
    } catch (error) {
      console.error(error);
      alert('No se pudo descargar el PDF del tratamiento.');
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

  if (tratamientos.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={<Pill size={48} />}
          title="Sin tratamientos"
          message="Esta mascota no tiene tratamientos registrados."
        />
      </Card>
    );
  }

  return (
    <div className="treatment-list">
      {tratamientos.map((t) => {
        const typeName = t.tipo_tratamiento?.tipo || 'Tratamiento';
        const prodName = t.producto?.nombre_comercial || 'Medicamento';
        return (
          <Card key={t.id} variant="inner">
            <div className="treatment-card">
              <div className="treatment-icon">
                <Pill size={18} />
              </div>
              <div className="treatment-info">
                <div className="treatment-name">
                  {typeName} — {prodName}
                </div>
                <div className="treatment-detail">
                  Dosis: {t.dosis} · Frecuencia: {t.frecuencia}
                </div>
                <div className="treatment-detail">
                  Desde: {formatDate(t.fecha_inicio)}
                  {t.fecha_fin ? ` hasta ${formatDate(t.fecha_fin)}` : ' (en curso)'}
                </div>
                {t.indicaciones_adicionales && (
                  <div className="treatment-detail" style={{ marginTop: 4, fontStyle: 'italic' }}>
                    "{t.indicaciones_adicionales}"
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                <Badge variant={t.fecha_fin ? 'neutral' : 'accent'}>
                  {t.fecha_fin ? 'Finalizado' : 'Activo'}
                </Badge>
                <Button
                  variant="secondary"
                  size="sm"
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 8px', height: '28px', fontSize: '11px' }}
                  onClick={() => handleDownloadPdf(t.id)}
                  disabled={isDownloading === t.id}
                >
                  <FileDown size={12} />
                  {isDownloading === t.id ? '...' : 'PDF'}
                </Button>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

