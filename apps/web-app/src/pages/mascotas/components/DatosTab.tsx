import { TrendingUp } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { WeightChart } from './WeightChart';
import { formatDate, calcAge } from '../utils';
import type { MascotaDetail } from '../types';

interface DatosTabProps {
  mascota: MascotaDetail;
  isOwner: boolean;
  atenciones: any[];
}

export function DatosTab({ mascota, isOwner, atenciones }: DatosTabProps) {
  return (
    <div>
      <Card>
        <h3 style={{ marginBottom: 'var(--space-md)', fontSize: '1rem' }}>Información General</h3>
        <div className="mascota-datos-grid">
          <div className="mascota-dato-item">
            <span className="mascota-dato-label">Nombre</span>
            <span className="mascota-dato-value">{mascota.nombre}</span>
          </div>
          <div className="mascota-dato-item">
            <span className="mascota-dato-label">Especie</span>
            <span className="mascota-dato-value">{mascota.especie || '–'}</span>
          </div>
          <div className="mascota-dato-item">
            <span className="mascota-dato-label">Raza</span>
            <span className="mascota-dato-value">{mascota.raza || '–'}</span>
          </div>
          <div className="mascota-dato-item">
            <span className="mascota-dato-label">Fecha de Nacimiento</span>
            <span className="mascota-dato-value">{formatDate(mascota.fecha_nacimiento)}</span>
          </div>
          <div className="mascota-dato-item">
            <span className="mascota-dato-label">Edad</span>
            <span className="mascota-dato-value">{calcAge(mascota.fecha_nacimiento)}</span>
          </div>
          <div className="mascota-dato-item">
            <span className="mascota-dato-label">Sexo</span>
            <span className="mascota-dato-value">{mascota.sexo === 'M' ? 'Macho' : 'Hembra'}</span>
          </div>
          <div className="mascota-dato-item">
            <span className="mascota-dato-label">Castrado/a</span>
            <span className="mascota-dato-value">{mascota.es_castrado ? 'Sí' : 'No'}</span>
          </div>
          <div className="mascota-dato-item">
            <span className="mascota-dato-label">Microchip</span>
            <span className="mascota-dato-value font-mono">{mascota.numero_microchip || '–'}</span>
          </div>
        </div>
      </Card>

      {mascota.propietarios && mascota.propietarios.length > 0 && (
        <Card style={{ marginTop: 'var(--space-md)' }}>
          <h3 style={{ marginBottom: 'var(--space-md)', fontSize: '1rem' }}>Propietarios</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            {mascota.propietarios.map((p) => (
              <div key={p.id} className="propietario-item-detail">
                <div className="mascota-datos-grid">
                  <div className="mascota-dato-item">
                    <span className="mascota-dato-label">Nombre</span>
                    <span className="mascota-dato-value">
                      {p.nombre} {p.apellido} {p.razon_social ? `(${p.razon_social})` : ''}
                    </span>
                  </div>
                  <div className="mascota-dato-item">
                    <span className="mascota-dato-label">Relación</span>
                    <span className="mascota-dato-value">
                      <Badge variant={p.activo ? 'success' : 'neutral'}>
                        {p.relacion} {p.activo ? '(Activo)' : '(Inactivo)'}
                      </Badge>
                    </span>
                  </div>
                  {p.telefono && (
                    <div className="mascota-dato-item">
                      <span className="mascota-dato-label">Teléfono</span>
                      <span className="mascota-dato-value">{p.telefono}</span>
                    </div>
                  )}
                  {p.direccion && (
                    <div className="mascota-dato-item">
                      <span className="mascota-dato-label">Dirección</span>
                      <span className="mascota-dato-value">{p.direccion}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card className="weight-graph-card">
        <div className="weight-graph-header">
          <TrendingUp size={18} style={{ color: 'var(--accent)' }} />
          <h3>Evolución de Peso</h3>
        </div>
        <WeightChart atenciones={atenciones} />
      </Card>

      {isOwner && (
        <Card style={{ marginTop: 'var(--space-md)' }}>
          <h3 style={{ marginBottom: 'var(--space-md)', fontSize: '1rem' }}>Código de Admisión</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 'var(--space-md)' }}>
            Compartí este código o el código QR con tu veterinario para que pueda admitir a tu mascota como paciente.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <div style={{
              background: '#fff',
              padding: '12px',
              borderRadius: '16px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
              display: 'inline-block'
            }}>
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${mascota.id}`}
                alt="Código QR de Admisión"
                style={{ width: 150, height: 150, display: 'block' }}
              />
            </div>
            <div style={{ display: 'flex', gap: 8, width: '100%', maxWidth: 350 }}>
              <input
                type="text"
                readOnly
                value={mascota.id}
                style={{
                  flex: 1,
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  fontSize: '0.8rem',
                  fontFamily: 'monospace',
                  textAlign: 'center',
                  color: 'var(--text-color)'
                }}
              />
              <Button
                onClick={() => {
                  navigator.clipboard.writeText(mascota.id);
                  alert('Código copiado al portapapeles');
                }}
                size="sm"
              >
                Copiar
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
