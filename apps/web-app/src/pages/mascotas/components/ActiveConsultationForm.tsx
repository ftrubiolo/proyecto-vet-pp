import { useState } from 'react';
import { X } from 'lucide-react';
import { useFetch } from '../../../hooks/useFetch';
import { api } from '../../../api/client';
import { Button } from '../../../components/ui/Button';
import { Input, Select } from '../../../components/ui/Input';
import { Badge } from '../../../components/ui/Badge';
import { Spinner } from '../../../components/ui/Spinner';
import { Autocomplete } from './Autocomplete';

interface ActiveConsultationFormProps {
  citaId?: string | null;
  clinicaId?: string | null;
  mascotaId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function ActiveConsultationForm({ citaId, clinicaId, mascotaId, onClose, onSuccess }: ActiveConsultationFormProps) {
  const [selectedClinicaId, setSelectedClinicaId] = useState(clinicaId || '');
  const [pesoActual, setPesoActual] = useState('');
  const [notasClinicas, setNotasClinicas] = useState('');
  const [selectedDiag, setSelectedDiag] = useState<{ id: number; name: string }[]>([]);
  const [treatments, setTreatments] = useState<any[]>([]);
  const [vacunasApplied, setVacunasApplied] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // States for treatments form
  const [tTipoId, setTTipoId] = useState('');
  const [tProducto, setTProducto] = useState<any>(null);
  const [tDosis, setTDosis] = useState('');
  const [tFrecuencia, setTFrecuencia] = useState('');
  const [tFechaInicio, setTFechaInicio] = useState(new Date().toISOString().split('T')[0]);
  const [tFechaFin, setTFechaFin] = useState('');
  const [tIndicaciones, setTIndicaciones] = useState('');

  // States for vaccines form
  const [vProducto, setVProducto] = useState<any>(null);
  const [vLote, setVLote] = useState('');
  const [vFechaAplicacion, setVFechaAplicacion] = useState(new Date().toISOString().split('T')[0]);
  const [vFechaProxima, setVFechaProxima] = useState('');

  // Fetch lookup lists
  const { data: diagnosticosRaw } = useFetch<any[]>('/catalogo/diagnosticos');
  const { data: tiposTratamiento } = useFetch<any[]>('/catalogo/tipos-tratamiento');
  const { data: productosRaw } = useFetch<any[]>('/catalogo/productos');
  const { data: vacunasRaw } = useFetch<any[]>('/catalogo/productos/vacunas');
  const { data: petClinics } = useFetch<any[]>(!clinicaId && mascotaId ? `/clinicas/mascota/${mascotaId}` : null);

  const lookupDiag = (diagnosticosRaw || []).map((d: any) => ({ id: d.id, name: d.diagnostico }));
  const lookupProducts = (productosRaw || []).map((p: any) => ({ id: p.id, name: p.nombre_comercial }));
  const lookupVacunas = (vacunasRaw || []).map((v: any) => ({ id: v.id, name: v.nombre_comercial }));

  const handleAddDiagnosis = (item: { id: number; name: string }) => {
    if (!selectedDiag.find(d => d.id === item.id)) {
      setSelectedDiag([...selectedDiag, item]);
    }
  };

  const handleRemoveDiagnosis = (id: number) => {
    setSelectedDiag(selectedDiag.filter(d => d.id !== id));
  };

  const handleAddTreatment = () => {
    if (!tTipoId || !tProducto || !tDosis || !tFrecuencia) {
      alert('Por favor complete todos los datos requeridos del tratamiento.');
      return;
    }
    const selectedTipo = (tiposTratamiento || []).find((tt: any) => String(tt.id) === tTipoId);

    setTreatments([...treatments, {
      tipo_tratamiento_id: Number(tTipoId),
      tipoName: selectedTipo?.tipo || 'Tratamiento',
      producto_id: tProducto.id,
      productoName: tProducto.name,
      dosis: tDosis,
      frecuencia: tFrecuencia,
      fecha_inicio: tFechaInicio,
      fecha_fin: tFechaFin || null,
      indicaciones_adicionales: tIndicaciones || null,
    }]);

    // Reset sub-form
    setTTipoId('');
    setTProducto(null);
    setTDosis('');
    setTFrecuencia('');
    setTIndicaciones('');
  };

  const handleRemoveTreatment = (index: number) => {
    setTreatments(treatments.filter((_, i) => i !== index));
  };

  const handleAddVacuna = () => {
    if (!vProducto) {
      alert('Por favor seleccione una vacuna.');
      return;
    }
    setVacunasApplied([...vacunasApplied, {
      producto_id: vProducto.id,
      productoName: vProducto.name,
      numero_lote: vLote || null,
      fecha_aplicacion: vFechaAplicacion,
      fecha_proxima_dosis: vFechaProxima || null,
    }]);

    setVProducto(null);
    setVLote('');
  };

  const handleRemoveVacuna = (index: number) => {
    setVacunasApplied(vacunasApplied.filter((_, i) => i !== index));
  };

  const handleFinalize = async () => {
    if (!selectedClinicaId) {
      alert('Por favor seleccione la clínica de atención.');
      return;
    }
    if (!notasClinicas.trim()) {
      alert('Por favor ingrese las notas clínicas de la consulta.');
      return;
    }

    setIsSaving(true);
    try {
      // Auto-append currently entered vaccine if not empty
      const finalVacunas = [...vacunasApplied];
      if (vProducto) {
        finalVacunas.push({
          producto_id: vProducto.id,
          numero_lote: vLote || null,
          fecha_aplicacion: vFechaAplicacion,
          fecha_proxima_dosis: vFechaProxima || null,
        });
      }

      // Auto-append currently entered treatment if not empty
      const finalTreatments = [...treatments];
      if (tTipoId && tProducto && tDosis && tFrecuencia) {
        const selectedTipo = (tiposTratamiento || []).find((tt: any) => String(tt.id) === tTipoId);
        finalTreatments.push({
          tipo_tratamiento_id: Number(tTipoId),
          tipoName: selectedTipo?.tipo || 'Tratamiento',
          producto_id: tProducto.id,
          dosis: tDosis,
          frecuencia: tFrecuencia,
          fecha_inicio: tFechaInicio,
          fecha_fin: tFechaFin || null,
          indicaciones_adicionales: tIndicaciones || null,
        });
      }

      await api.post('/atenciones', {
        cita_id: citaId || null,
        mascota_id: mascotaId,
        clinica_id: selectedClinicaId,
        notas_clinicas: notasClinicas,
        peso_actual: pesoActual || null,
        diagnosticos: selectedDiag.map(d => d.id),
        tratamientos: finalTreatments.map(t => ({
          tipo_tratamiento_id: t.tipo_tratamiento_id,
          producto_id: t.producto_id,
          dosis: t.dosis,
          frecuencia: t.frecuencia,
          fecha_inicio: t.fecha_inicio,
          fecha_fin: t.fecha_fin,
          indicaciones_adicionales: t.indicaciones_adicionales,
        })),
        vacunas: finalVacunas.map(v => ({
          producto_id: v.producto_id,
          numero_lote: v.numero_lote,
          fecha_aplicacion: v.fecha_aplicacion,
          fecha_proxima_dosis: v.fecha_proxima_dosis,
        })),
      });

      alert('Consulta finalizada y registrada con éxito.');
      onSuccess();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al guardar la consulta');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="consultation-form-section">
      <div className="consultation-form-title-bar">
        <h3>Atención Médica Activa</h3>
        <button className="consultation-close-btn" onClick={onClose} title="Cerrar Consulta">
          <X size={16} />
        </button>
      </div>

      {!clinicaId && (
        <Select
          label="Clínica de Atención *"
          options={[
            { value: '', label: 'Seleccionar clínica...' },
            ...(petClinics || []).map((c: any) => ({ value: c.id, label: c.nombre_comercial }))
          ]}
          value={selectedClinicaId}
          onChange={(e) => setSelectedClinicaId(e.target.value)}
          required
        />
      )}

      <Input
        label="Peso del Paciente (kg)"
        type="number"
        step="0.01"
        placeholder="Ej: 12.5"
        value={pesoActual}
        onChange={(e) => setPesoActual(e.target.value)}
      />

      <div className="form-group">
        <label className="form-label">Notas Clínicas / Anamnesis *</label>
        <textarea
          className="form-input form-textarea"
          placeholder="Describa los síntomas, exploración física y estado general..."
          value={notasClinicas}
          onChange={(e) => setNotasClinicas(e.target.value)}
          required
        />
      </div>

      {/* Diagnosticos autocomplete */}
      <Autocomplete
        label="Diagnosticar (Buscador)"
        placeholder="Escriba para buscar diagnóstico..."
        items={lookupDiag}
        onSelect={handleAddDiagnosis}
      />

      {selectedDiag.length > 0 && (
        <div className="selected-badges-list">
          {selectedDiag.map(d => (
            <Badge key={d.id} variant="accent" className="selected-badge">
              {d.name}
              <button className="selected-badge-remove" onClick={() => handleRemoveDiagnosis(d.id)}>
                <X size={10} />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Recetar Tratamientos */}
      <span className="consultation-section-title">Tratamientos a Prescribir</span>

      <div className="consultation-subform">
        <Select
          label="Tipo"
          options={[
            { value: '', label: 'Seleccionar tipo...' },
            ...(tiposTratamiento || []).map((tt: any) => ({ value: String(tt.id), label: tt.tipo }))
          ]}
          value={tTipoId}
          onChange={(e) => setTTipoId(e.target.value)}
        />

        <Autocomplete
          label="Medicamento / Producto"
          placeholder="Escriba para buscar medicamento..."
          items={lookupProducts}
          onSelect={(item) => setTProducto(item)}
        />
        {tProducto && (
          <span style={{ fontSize: '0.8rem', color: 'var(--accent)', fontWeight: 600 }}>
            Seleccionado: {tProducto.name}
          </span>
        )}

        <div className="form-row">
          <Input
            label="Dosis"
            placeholder="Ej: 1 comp"
            value={tDosis}
            onChange={(e) => setTDosis(e.target.value)}
          />
          <Input
            label="Frecuencia"
            placeholder="Ej: Cada 12 hs"
            value={tFrecuencia}
            onChange={(e) => setTFrecuencia(e.target.value)}
          />
        </div>

        <div className="form-row">
          <Input
            label="Desde"
            type="date"
            value={tFechaInicio}
            onChange={(e) => setTFechaInicio(e.target.value)}
          />
          <Input
            label="Hasta (Opcional)"
            type="date"
            value={tFechaFin}
            onChange={(e) => setTFechaFin(e.target.value)}
          />
        </div>

        <Input
          label="Indicaciones adicionales"
          placeholder="Ej: Suministrar con alimentos"
          value={tIndicaciones}
          onChange={(e) => setTIndicaciones(e.target.value)}
        />

        <Button size="sm" type="button" onClick={handleAddTreatment}>
          Prescribir Tratamiento
        </Button>
      </div>

      {treatments.length > 0 && (
        <div className="prescribed-items-list">
          {treatments.map((t, index) => (
            <div key={index} className="prescribed-item-card">
              <div className="prescribed-item-info">
                <span className="prescribed-item-title">{t.tipoName} — {t.productoName}</span>
                <span className="prescribed-item-details">Dosis: {t.dosis} · Frecuencia: {t.frecuencia}</span>
                {t.fecha_fin && <span className="prescribed-item-details">Hasta: {t.fecha_fin}</span>}
              </div>
              <button className="prescribed-item-delete" type="button" onClick={() => handleRemoveTreatment(index)}>
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Aplicar Vacunas */}
      <span className="consultation-section-title">Vacunas Aplicadas</span>

      <div className="consultation-subform">
        <Autocomplete
          label="Vacuna"
          placeholder="Escriba para buscar vacuna..."
          items={lookupVacunas}
          onSelect={(item) => setVProducto(item)}
        />
        {vProducto && (
          <span style={{ fontSize: '0.8rem', color: 'var(--accent)', fontWeight: 600 }}>
            Seleccionado: {vProducto.name}
          </span>
        )}

        <Input
          label="Número de Lote"
          placeholder="Ej: LOTE-ABC-123"
          value={vLote}
          onChange={(e) => setVLote(e.target.value)}
        />

        <div className="form-row">
          <Input
            label="Aplicada hoy"
            type="date"
            value={vFechaAplicacion}
            onChange={(e) => setVFechaAplicacion(e.target.value)}
          />
          <Input
            label="Próxima dosis"
            type="date"
            value={vFechaProxima}
            onChange={(e) => setVFechaProxima(e.target.value)}
          />
        </div>

        <Button size="sm" type="button" onClick={handleAddVacuna}>
          Aplicar Vacuna
        </Button>
      </div>

      {vacunasApplied.length > 0 && (
        <div className="prescribed-items-list">
          {vacunasApplied.map((v, index) => (
            <div key={index} className="prescribed-item-card">
              <div className="prescribed-item-info">
                <span className="prescribed-item-title">Vacuna: {v.productoName}</span>
                <span className="prescribed-item-details">Lote: {v.numero_lote || '–'}</span>
                {v.fecha_proxima_dosis && <span className="prescribed-item-details">Próxima: {v.fecha_proxima_dosis}</span>}
              </div>
              <button className="prescribed-item-delete" type="button" onClick={() => handleRemoveVacuna(index)}>
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="consultation-actions-footer">
        <Button variant="secondary" onClick={onClose} disabled={isSaving}>Cancelar</Button>
        <Button type="button" onClick={handleFinalize} disabled={isSaving}>
          {isSaving ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Spinner size={16} />
              <span>Guardando...</span>
            </div>
          ) : (
            'Finalizar Consulta'
          )}
        </Button>
      </div>
    </div>
  );
}
