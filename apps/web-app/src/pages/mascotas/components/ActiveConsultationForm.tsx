import { useState } from 'react';
import { X } from 'lucide-react';
import { useFetch } from '../../../hooks/useFetch';
import { api } from '../../../api/client';
import { Button } from '../../../components/ui/Button';
import { Input, Select } from '../../../components/ui/Input';
import { Badge } from '../../../components/ui/Badge';
import { Spinner } from '../../../components/ui/Spinner';
import { Autocomplete } from './Autocomplete';
import { ProtocolCurationModal } from './ProtocolCurationModal';

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

  // Curation and active series states
  const [showCurationModal, setShowCurationModal] = useState(false);
  const [curationTemplate, setCurationTemplate] = useState<any>(null);
  const [activeSerie, setActiveSerie] = useState<any>(null);
  const [continuarSerie, setContinuarSerie] = useState(true);
  const [isValidatingProtocol, setIsValidatingProtocol] = useState(false);
  const [vProtocolo, setVProtocolo] = useState<any>(null);
  const [vViaAdministracion, setVViaAdministracion] = useState('');
  const [vValidationWarning, setVValidationWarning] = useState<string | null>(null);

  // Fetch pet details to get species
  const { data: mascota } = useFetch<any>(
    mascotaId ? `/mascotas/${mascotaId}` : null
  );

  // Fetch pet's active series lists
  const { data: petSeries } = useFetch<any[]>(
    mascotaId ? `/vacunas/mascota/${mascotaId}` : null
  );

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

  const calculateNextDoseDate = (shouldContinue: boolean, applyDateStr: string, proto: any, activeS: any) => {
    if (!applyDateStr || !proto) {
      setVFechaProxima('');
      return;
    }

    const applyDate = new Date(applyDateStr);
    if (isNaN(applyDate.getTime())) {
      setVFechaProxima('');
      return;
    }

    if (shouldContinue && activeS) {
      if (activeS.estado_serie === 'en_curso') {
        const currentDoseIndex = activeS.dosis_aplicadas - 1;
        const intervals = proto.intervalo_dias || [];
        if (currentDoseIndex >= 0 && currentDoseIndex < intervals.length) {
          const days = intervals[currentDoseIndex];
          const nextDate = new Date(applyDate.getTime());
          nextDate.setDate(nextDate.getDate() + days);
          setVFechaProxima(nextDate.toISOString().split('T')[0]);
          return;
        }
      } else if (activeS.estado_serie === 'completa' && proto.tiene_refuerzo && proto.refuerzo_cada_dias) {
        const nextDate = new Date(applyDate.getTime());
        nextDate.setDate(nextDate.getDate() + proto.refuerzo_cada_dias);
        setVFechaProxima(nextDate.toISOString().split('T')[0]);
        return;
      }
    } else {
      const totalDosis = proto.total_dosis_serie_primaria || 1;
      const intervals = proto.intervalo_dias || [];
      if (totalDosis > 1 && intervals.length > 0) {
        const days = intervals[0];
        const nextDate = new Date(applyDate.getTime());
        nextDate.setDate(nextDate.getDate() + days);
        setVFechaProxima(nextDate.toISOString().split('T')[0]);
        return;
      } else if (totalDosis === 1 && proto.tiene_refuerzo && proto.refuerzo_cada_dias) {
        const nextDate = new Date(applyDate.getTime());
        nextDate.setDate(nextDate.getDate() + proto.refuerzo_cada_dias);
        setVFechaProxima(nextDate.toISOString().split('T')[0]);
        return;
      }
    }

    setVFechaProxima('');
  };

  const handleSelectVacuna = async (item: { id: number; name: string }) => {
    setIsValidatingProtocol(true);
    setVProducto(item);
    setActiveSerie(null);
    setContinuarSerie(true);
    setVProtocolo(null);
    setVViaAdministracion('');
    setVValidationWarning(null);

    try {
      const response = await api.get<{ isCurated: boolean; protocolo: any }>(`/vacunas/protocolo/producto/${item.id}`);
      
      if (!response.isCurated) {
        setCurationTemplate(response.protocolo);
        setShowCurationModal(true);
      } else {
        const proto = response.protocolo;
        setVProtocolo(proto);

        // Auto-select route
        if (proto.vias_administracion && proto.vias_administracion.length > 0) {
          setVViaAdministracion(proto.vias_administracion[0]);
        }

        // Warning on target species
        let warning = null;
        const petSpeciesStr = (mascota?.especie || '').toLowerCase();
        const targets = (proto.especies_target || []).map((s: string) => s.toLowerCase());
        
        if (targets.length > 0 && petSpeciesStr) {
          const matches = targets.some((t: string) => {
            if (t.includes('canin') && (petSpeciesStr.includes('canin') || petSpeciesStr.includes('perr'))) return true;
            if (t.includes('felin') && (petSpeciesStr.includes('felin') || petSpeciesStr.includes('gat'))) return true;
            if (t.includes(petSpeciesStr) || petSpeciesStr.includes(t)) return true;
            return false;
          });
          
          if (!matches) {
            warning = `La vacuna está registrada para ${proto.especies_target.join(', ')}, pero el paciente es ${mascota?.especie || 'otra especie'}.`;
          }
        }
        setVValidationWarning(warning);

        // Check active 'en_curso' or 'completa' (with booster) series
        const openSerie = (petSeries || []).find(
          (s: any) => s.protocolo_id === item.id && s.estado_serie === 'en_curso'
        );
        
        let foundSerie = openSerie || null;
        if (!foundSerie && proto.tiene_refuerzo) {
          const completedSerie = (petSeries || [])
            .filter((s: any) => s.protocolo_id === item.id && s.estado_serie === 'completa')
            .sort((a: any, b: any) => new Date(b.fecha_inicio).getTime() - new Date(a.fecha_inicio).getTime())[0];
          if (completedSerie) {
            foundSerie = completedSerie;
          }
        }

        if (foundSerie) {
          setActiveSerie(foundSerie);
        }

        // Calculate default date suggestions
        calculateNextDoseDate(true, vFechaAplicacion, proto, foundSerie);
      }
    } catch (err) {
      console.error('Error al verificar protocolo:', err);
    } finally {
      setIsValidatingProtocol(false);
    }
  };

  const handleCloseCuration = () => {
    setShowCurationModal(false);
    setVProducto(null);
    setCurationTemplate(null);
    setVProtocolo(null);
    setVViaAdministracion('');
    setVValidationWarning(null);
  };

  const handleSaveCuration = (savedProtocol: any) => {
    setShowCurationModal(false);
    setCurationTemplate(null);
    setVProtocolo(savedProtocol);

    if (savedProtocol.vias_administracion && savedProtocol.vias_administracion.length > 0) {
      setVViaAdministracion(savedProtocol.vias_administracion[0]);
    }

    setActiveSerie(null);
    calculateNextDoseDate(false, vFechaAplicacion, savedProtocol, null);
  };

  const handleAddVacuna = () => {
    if (!vProducto) {
      alert('Por favor seleccione una vacuna.');
      return;
    }
    if (!vLote || !vLote.trim()) {
      alert('El número de lote es obligatorio.');
      return;
    }
    if (!vViaAdministracion || !vViaAdministracion.trim()) {
      alert('La vía de administración es obligatoria.');
      return;
    }

    setVacunasApplied([...vacunasApplied, {
      producto_id: vProducto.id,
      productoName: vProducto.name,
      numero_lote: vLote.trim(),
      fecha_aplicacion: vFechaAplicacion,
      fecha_proxima_dosis: vFechaProxima || null,
      iniciar_nueva_serie: !continuarSerie,
      via_administracion: vViaAdministracion,
    }]);

    setVProducto(null);
    setVLote('');
    setVViaAdministracion('');
    setVProtocolo(null);
    setVValidationWarning(null);
    setActiveSerie(null);
    setContinuarSerie(true);
    setVFechaProxima('');
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
        if (!vLote || !vLote.trim()) {
          alert('El número de lote es obligatorio.');
          setIsSaving(false);
          return;
        }
        if (!vViaAdministracion || !vViaAdministracion.trim()) {
          alert('La vía de administración es obligatoria.');
          setIsSaving(false);
          return;
        }
        finalVacunas.push({
          producto_id: vProducto.id,
          productoName: vProducto.name,
          numero_lote: vLote.trim(),
          fecha_aplicacion: vFechaAplicacion,
          fecha_proxima_dosis: vFechaProxima || null,
          iniciar_nueva_serie: !continuarSerie,
          via_administracion: vViaAdministracion,
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
          iniciar_nueva_serie: v.iniciar_nueva_serie || false,
          via_administracion: v.via_administracion,
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
          onSelect={handleSelectVacuna}
        />
        {isValidatingProtocol && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 8 }}>
            <Spinner size={12} />
            <span>Verificando protocolo oficial...</span>
          </div>
        )}
        {vProducto && !isValidatingProtocol && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 8 }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--accent)', fontWeight: 600 }}>
              Seleccionado: {vProducto.name}
            </span>
            {vValidationWarning && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', backgroundColor: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: 6, margin: '4px 0', color: 'var(--danger)', fontSize: '0.75rem', fontWeight: 600 }}>
                ⚠️ {vValidationWarning}
              </div>
            )}
            {activeSerie && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', backgroundColor: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.2)', borderRadius: 6, margin: '6px 0' }}>
                <input
                  type="checkbox"
                  id="continuarSerieCheckbox"
                  checked={continuarSerie}
                  onChange={(e) => {
                    setContinuarSerie(e.target.checked);
                    calculateNextDoseDate(e.target.checked, vFechaAplicacion, vProtocolo, activeSerie);
                  }}
                  style={{ width: 14, height: 14, cursor: 'pointer' }}
                />
                <label htmlFor="continuarSerieCheckbox" style={{ fontSize: '0.78rem', fontWeight: 600, color: '#d97706', cursor: 'pointer' }}>
                  {activeSerie.estado_serie === 'completa'
                    ? 'Registrar como dosis de refuerzo (booster) para la serie existente'
                    : `Continuar serie en curso existente (Registrar como Dosis ${activeSerie.dosis_aplicadas + 1})`
                  }
                </label>
              </div>
            )}
          </div>
        )}

        {vProducto && (
          <Select
            label="Vía de administración *"
            options={[
              { value: '', label: 'Seleccionar vía...' },
              ...((vProtocolo?.vias_administracion || ['SUBCUTANEA', 'INTRAMUSCULAR', 'ORAL']).map((via: string) => ({
                value: via,
                label: via,
              })))
            ]}
            value={vViaAdministracion}
            onChange={(e) => setVViaAdministracion(e.target.value)}
            required
          />
        )}

        <Input
          label="Número de Lote *"
          placeholder="Ej: LOTE-ABC-123"
          value={vLote}
          onChange={(e) => setVLote(e.target.value)}
          required
        />

        <div className="form-row">
          <Input
            label="Aplicada hoy"
            type="date"
            value={vFechaAplicacion}
            onChange={(e) => {
              setVFechaAplicacion(e.target.value);
              calculateNextDoseDate(continuarSerie, e.target.value, vProtocolo, activeSerie);
            }}
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
                <span className="prescribed-item-details">
                  Lote: {v.numero_lote} · Vía: {v.via_administracion}
                </span>
                {v.fecha_proxima_dosis && <span className="prescribed-item-details">Próxima: {v.fecha_proxima_dosis}</span>}
              </div>
              <button className="prescribed-item-delete" type="button" onClick={() => handleRemoveVacuna(index)}>
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {showCurationModal && curationTemplate && (
        <ProtocolCurationModal
          isOpen={showCurationModal}
          protocoloTemplate={curationTemplate}
          onClose={handleCloseCuration}
          onSave={handleSaveCuration}
        />
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
