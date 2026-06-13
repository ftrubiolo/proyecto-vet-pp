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

  return (
    <div className="vaccine-list">
      {vacunas.map((v) => {
        const prodName = v.producto?.nombre_comercial || 'Vacuna';
        return (
          <Card key={v.id} variant="inner">
            <div className="vaccine-card">
              <div className="vaccine-icon">
                <Syringe size={18} />
              </div>
              <div className="vaccine-info">
                <div className="vaccine-name">{prodName}</div>
                <div className="vaccine-detail">
                  Aplicada: {formatDate(v.fecha_aplicacion)}
                  {v.fecha_proxima_dosis && ` · Próxima: ${formatDate(v.fecha_proxima_dosis)}`}
                </div>
                {v.numero_lote && (
                  <div className="vaccine-detail">
                    <Hash size={10} style={{ display: 'inline', verticalAlign: '-1px', marginRight: 2 }} />
                    Lote: {v.numero_lote}
                  </div>
                )}
              </div>
              {v.fecha_proxima_dosis && new Date(v.fecha_proxima_dosis) > new Date() ? (
                <Badge variant="success">Al día</Badge>
              ) : (
                <Badge variant="warning">Vencida</Badge>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
