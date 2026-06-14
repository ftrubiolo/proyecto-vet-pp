import { useState } from 'react';
import { ShieldAlert, BookOpen } from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Spinner } from '../../../components/ui/Spinner';
import { api } from '../../../api/client';

interface ProtocolCurationModalProps {
  isOpen: boolean;
  protocoloTemplate: any;
  onClose: () => void;
  onSave: (savedProtocolo: any) => void;
}

export function ProtocolCurationModal({ isOpen, protocoloTemplate, onClose, onSave }: ProtocolCurationModalProps) {
  const [nombreComercial, setNombreComercial] = useState(protocoloTemplate.nombre_comercial || '');
  const [totalDosis, setTotalDosis] = useState<number>(1);
  const [intervaloDiasStr, setIntervaloDiasStr] = useState<string>('');
  const [tieneRefuerzo, setTieneRefuerzo] = useState<boolean>(false);
  const [refuerzoCadaDias, setRefuerzoCadaDias] = useState<number>(365);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombreComercial.trim()) {
      setErrorMsg('Por favor ingrese el nombre comercial del producto.');
      return;
    }

    // Validar intervalos si hay más de 1 dosis
    let intervalo_dias: number[] = [];
    if (totalDosis > 1) {
      const parts = intervaloDiasStr.split(',').map(p => p.trim()).filter(Boolean);
      const expectedIntervalsCount = totalDosis - 1;
      
      if (parts.length !== expectedIntervalsCount) {
        setErrorMsg(`Para ${totalDosis} dosis, debe especificar exactamente ${expectedIntervalsCount} intervalo(s) de días (ej. separados por comas).`);
        return;
      }

      intervalo_dias = parts.map(p => parseInt(p, 10));
      if (intervalo_dias.some(isNaN) || intervalo_dias.some(i => i <= 0)) {
        setErrorMsg('Los intervalos deben ser números enteros mayores a 0.');
        return;
      }
    }

    setIsSaving(true);
    setErrorMsg('');

    try {
      const payload = {
        senasa_id: protocoloTemplate.senasa_id,
        numero_inscripcion: protocoloTemplate.numero_inscripcion,
        nombre_comercial: nombreComercial,
        observaciones: protocoloTemplate.observaciones,
        indicaciones_y_vias: protocoloTemplate.indicaciones_y_vias,
        especies_target: protocoloTemplate.especies_target,
        dosificacion_por_esp: protocoloTemplate.dosificacion_por_esp,
        vias_administracion: protocoloTemplate.vias_administracion,
        fecha_validez: protocoloTemplate.fecha_validez,
        producto_registrado: protocoloTemplate.producto_registrado,
        total_dosis_serie_primaria: totalDosis,
        intervalo_dias: intervalo_dias,
        tiene_refuerzo: tieneRefuerzo,
        refuerzo_cada_dias: tieneRefuerzo ? refuerzoCadaDias : null
      };

      const result = await api.post<any>('/vacunas/protocolo', payload);
      alert('Protocolo de vacuna guardado y verificado con éxito.');
      onSave(result);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error al guardar el protocolo.');
    } finally {
      setIsSaving(false);
    }
  };

  const hasEspecies = protocoloTemplate.especies_target && protocoloTemplate.especies_target.length > 0;
  const hasVias = protocoloTemplate.vias_administracion && protocoloTemplate.vias_administracion.length > 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Curar Protocolo de Vacuna (SENASA)"
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-sm)', width: '100%' }}>
          <Button variant="secondary" onClick={onClose} disabled={isSaving}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Spinner size={14} />
                <span>Guardando...</span>
              </div>
            ) : (
              'Guardar y Verificar'
            )}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSave} className="consultation-subform" style={{ padding: '0 var(--space-md) var(--space-md) var(--space-md)', overflowY: 'auto', maxHeight: '70vh' }}>
        {errorMsg && (
          <div className="error-alert" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 12, backgroundColor: 'rgba(239, 68, 68, 0.08)', border: '1px solid var(--danger)', borderRadius: 8, color: 'var(--danger)', marginBottom: 'var(--space-md)' }}>
            <ShieldAlert size={16} />
            <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>{errorMsg}</span>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)', marginBottom: 'var(--space-md)' }}>
          <div style={{ padding: 12, backgroundColor: 'var(--surface-2)', borderRadius: 8, fontSize: '0.8rem', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <strong>Inscripción SENASA:</strong>
              <span className="font-mono">{protocoloTemplate.numero_inscripcion || 'N/A'}</span>
            </div>
            {protocoloTemplate.observaciones && (
              <div style={{ marginTop: 8 }}>
                <strong>Descripción SENASA:</strong>
                <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)' }}>{protocoloTemplate.observaciones}</p>
              </div>
            )}
          </div>

          {protocoloTemplate.indicaciones_y_vias && (
            <div style={{ border: '1px solid var(--border-color)', borderRadius: 8, padding: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, fontSize: '0.85rem', marginBottom: 6, color: 'var(--accent)' }}>
                <BookOpen size={14} />
                <span>Prospecto / Indicaciones del Fabricante (SENASA)</span>
              </div>
              <div style={{
                maxHeight: '120px',
                overflowY: 'auto',
                fontSize: '0.8rem',
                color: 'var(--text-color)',
                backgroundColor: 'var(--surface-solid)',
                padding: 10,
                borderRadius: 6,
                whiteSpace: 'pre-line',
                border: '1px solid var(--border-color)'
              }}>
                {protocoloTemplate.indicaciones_y_vias}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap' }}>
            {hasEspecies && (
              <div style={{ flex: '1 1 200px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                  Especies Target (SENASA)
                </span>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {protocoloTemplate.especies_target.map((esp: string, i: number) => (
                    <Badge key={i} variant="neutral">{esp}</Badge>
                  ))}
                </div>
              </div>
            )}
            {hasVias && (
              <div style={{ flex: '1 1 200px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                  Vías Autorizadas (SENASA)
                </span>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {protocoloTemplate.vias_administracion.map((via: string, i: number) => (
                    <Badge key={i} variant="success">{via}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <hr style={{ border: '0', borderTop: '1px dashed var(--border-color)', margin: 'var(--space-md) 0' }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent)' }}>Reglas de Dosificación Clínica</span>
          
          <Input
            label="Nombre Comercial display *"
            placeholder="Ej: CDVAC FEEDLOT, Livacox Q..."
            value={nombreComercial}
            onChange={(e) => setNombreComercial(e.target.value)}
            required
          />

          <div className="form-row">
            <Input
              label="Total dosis en serie primaria *"
              type="number"
              min="1"
              max="10"
              value={totalDosis}
              onChange={(e) => setTotalDosis(parseInt(e.target.value) || 1)}
              required
            />
            {totalDosis > 1 && (
              <Input
                label="Intervalo(s) entre dosis (en días) *"
                placeholder={totalDosis === 2 ? "Ej: 21" : "Ej: 21, 21"}
                value={intervaloDiasStr}
                onChange={(e) => setIntervaloDiasStr(e.target.value)}
                required
              />
            )}
          </div>
          {totalDosis > 1 && (
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: -8 }}>
              Ingrese los días entre dosis consecutivas. Si son 3 dosis, ingrese 2 números separados por comas.
            </span>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: 'var(--space-sm) 0' }}>
            <input
              type="checkbox"
              id="tieneRefuerzo"
              checked={tieneRefuerzo}
              onChange={(e) => setTieneRefuerzo(e.target.checked)}
              style={{ width: 16, height: 16, cursor: 'pointer' }}
            />
            <label htmlFor="tieneRefuerzo" style={{ fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>
              ¿Requiere refuerzo / booster recurrente?
            </label>
          </div>

          {tieneRefuerzo && (
            <Input
              label="Frecuencia del refuerzo (en días) *"
              type="number"
              min="1"
              value={refuerzoCadaDias}
              onChange={(e) => setRefuerzoCadaDias(parseInt(e.target.value) || 365)}
              required
            />
          )}
        </div>
      </form>
    </Modal>
  );
}
