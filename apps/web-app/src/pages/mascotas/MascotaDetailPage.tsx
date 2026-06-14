import { useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, PawPrint, Edit, Calendar, Pill, Syringe, Scale, Plus } from 'lucide-react';
import { useFetch } from '../../hooks/useFetch';
import { useAuth } from '../../hooks/useAuth';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Tabs } from '../../components/ui/Tabs';
import { Spinner } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';

import { type MascotaDetail, calcAge, formatDate } from '@vetvault/shared';

import { DatosTab } from './components/DatosTab';
import { HistorialTab } from './components/HistorialTab';
import { VacunasTab } from './components/VacunasTab';
import { TratamientosTab } from './components/TratamientosTab';
import { EditMascotaModal } from './components/EditMascotaModal';
import { ActiveConsultationForm } from './components/ActiveConsultationForm';

import './MascotaDetailPage.css';
import './ConsultationForm.css';

const tabs = [
  { id: 'datos', label: 'Datos' },
  { id: 'historial', label: 'Historial' },
  { id: 'vacunas', label: 'Vacunas' },
  { id: 'tratamientos', label: 'Tratamientos' },
];

export function MascotaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('datos');
  const [showEditModal, setShowEditModal] = useState(false);
  const [isManualConsultation, setIsManualConsultation] = useState(false);
  const { user } = useAuth();
  const isOwner = user?.rol === 'Propietario';

  const atenderCitaId = searchParams.get('atenderCitaId');
  const clinicaId = searchParams.get('clinicaId');

  // Fetch mascota general info
  const { data: mascota, isLoading, error, refetch: refetchMascota } = useFetch<MascotaDetail>(
    id ? `/mascotas/${id}` : null
  );

  // Fetch clinical records (atenciones)
  const { data: atencionesData, isLoading: isHistorialLoading, refetch: refetchAtenciones } = useFetch<any[]>(
    id ? `/atenciones/mascota/${id}` : null
  );

  // Fetch applied vaccines (vacunas)
  const { data: vacunasData, isLoading: isVacunasLoading, refetch: refetchVacunas } = useFetch<any[]>(
    id ? `/vacunas/mascota/${id}` : null
  );

  // Fetch treatments (tratamientos)
  const { data: tratamientosData, isLoading: isTratamientosLoading, refetch: refetchTratamientos } = useFetch<any[]>(
    id ? `/tratamientos/mascota/${id}` : null
  );

  const triggerRefetches = () => {
    refetchMascota();
    refetchAtenciones();
    refetchVacunas();
    refetchTratamientos();
  };

  if (isLoading) {
    return (
      <div className="page" style={{ display: 'flex', justifyContent: 'center', padding: '64px' }}>
        <Spinner size={40} />
      </div>
    );
  }

  if (error || !mascota) {
    return (
      <div className="page">
        <Card>
          <EmptyState
            icon={<PawPrint size={56} />}
            title="Mascota no encontrada"
            message="No se pudo cargar la información de esta mascota."
          />
        </Card>
      </div>
    );
  }

  const renderLeftPanel = () => {
    const hasFoto = !!(mascota.foto_url && mascota.foto_url !== 'null' && mascota.foto_url !== 'undefined' && mascota.foto_url.trim() !== '');

    const lastVisit = atencionesData && atencionesData.length > 0
      ? atencionesData[0].fecha_atencion
      : null;

    const lastWeightRecord = atencionesData
      ? atencionesData.find((a: any) => a.peso_actual && parseFloat(a.peso_actual) > 0)
      : null;
    const lastWeight = lastWeightRecord ? lastWeightRecord.peso_actual : null;

    const activeMedications = tratamientosData
      ? tratamientosData.filter((t: any) => {
        const now = new Date();
        const start = new Date(t.fecha_inicio);
        const end = t.fecha_fin ? new Date(t.fecha_fin) : null;
        return start <= now && (!end || end >= now);
      })
      : [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let vencidasCount = 0;
    let proximasCount = 0;

    if (vacunasData) {
      vacunasData.forEach((serie: any) => {
        if (serie.estado_serie === 'abandonada') return;

        const protocolo = serie.protocolo;
        if (!protocolo) return;

        // Si la serie está en curso (incompleta), no contamos refuerzo
        if (serie.dosis_aplicadas < (protocolo.total_dosis_serie_primaria || 1)) {
          return;
        }

        // Si no tiene refuerzo o no hay fecha de próximo refuerzo, no contamos
        if (!protocolo.tiene_refuerzo || !serie.proximo_refuerzo) {
          return;
        }

        let nextDoseDate: Date;
        if (serie.proximo_refuerzo instanceof Date) {
          nextDoseDate = new Date(serie.proximo_refuerzo.getTime());
          nextDoseDate.setHours(0, 0, 0, 0);
        } else {
          const str = String(serie.proximo_refuerzo);
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
          vencidasCount++;
        } else if (nextDoseMs <= todayMs + thirtyDaysMs) {
          proximasCount++;
        }
      });
    }

    return (
      <div className="consultation-main-col">
        <button className="mascota-detail-back" onClick={() => navigate('/mascotas')}>
          <ArrowLeft size={16} />
          Volver a mascotas
        </button>

        <Card className="mascota-detail-card">
          <div className="mascota-detail-profile">
            <div
              className="mascota-detail-avatar"
              style={hasFoto ? {
                backgroundImage: `url(${mascota.foto_url})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat'
              } : undefined}
            >
              {!hasFoto && <PawPrint size={32} />}
            </div>
            <div className="mascota-detail-info">
              <h2>{mascota.nombre}</h2>
              <div className="mascota-detail-breed">
                {mascota.raza || 'Sin raza'} · {mascota.especie || ''}
              </div>
              <div className="mascota-detail-badges">
                <Badge variant="accent">{calcAge(mascota.fecha_nacimiento)}</Badge>
                <Badge variant={mascota.sexo === 'M' ? 'accent' : 'success'}>
                  {mascota.sexo === 'M' ? 'Macho' : 'Hembra'}
                </Badge>
                {mascota.es_castrado && <Badge variant="neutral">Castrado/a</Badge>}
              </div>
            </div>
            <div className="mascota-detail-actions" style={{ display: 'flex', gap: 8 }}>
              {!isOwner && (
                <Button onClick={() => setIsManualConsultation(true)} variant="primary" size="sm" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Plus size={14} />
                  Registrar Consulta
                </Button>
              )}
              <Button onClick={() => setShowEditModal(true)} variant="secondary" size="sm" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Edit size={14} />
                Editar Datos
              </Button>
            </div>
          </div>
        </Card>

        <div className="mascota-clinical-summary-bar">
          {lastVisit ? (
            <Badge variant="neutral" className="clinical-summary-badge">
              <Calendar size={12} />
              Última visita: {formatDate(lastVisit)}
            </Badge>
          ) : (
            <Badge variant="neutral" className="clinical-summary-badge">
              <Calendar size={12} />
              Sin visitas
            </Badge>
          )}

          {lastWeight && (
            <Badge variant="neutral" className="clinical-summary-badge">
              <Scale size={12} />
              {lastWeight} kg
            </Badge>
          )}

          {activeMedications.length > 0 ? (
            <Badge variant="accent" className="clinical-summary-badge">
              <Pill size={12} />
              {activeMedications.length} {activeMedications.length === 1 ? 'Medicación activa' : 'Medicaciones activas'}
            </Badge>
          ) : (
            <Badge variant="neutral" className="clinical-summary-badge">
              <Pill size={12} />
              Sin medicamentos
            </Badge>
          )}

          {vencidasCount > 0 ? (
            <Badge variant="danger" className="clinical-summary-badge">
              <Syringe size={12} />
              {vencidasCount === 1 ? 'Vacuna vencida' : `Vacunas vencidas (${vencidasCount})`}
            </Badge>
          ) : proximasCount > 0 ? (
            <Badge variant="warning" className="clinical-summary-badge">
              <Syringe size={12} />
              {proximasCount === 1 ? 'Vacuna próxima' : `Vacunas próximas (${proximasCount})`}
            </Badge>
          ) : (
            <Badge variant="success" className="clinical-summary-badge">
              <Syringe size={12} />
              Vacunas al día
            </Badge>
          )}
        </div>

        <div style={{ marginTop: 'var(--space-lg)' }}>
          <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

          <div className="mascota-tab-content">
            {activeTab === 'datos' && (
              <DatosTab
                mascota={mascota}
                isOwner={isOwner}
                atenciones={atencionesData || []}
                vacunas={vacunasData || []}
                tratamientos={tratamientosData || []}
                onEditClick={() => setShowEditModal(true)}
              />
            )}
            {activeTab === 'historial' && <HistorialTab atenciones={atencionesData || []} isLoading={isHistorialLoading} />}
            {activeTab === 'vacunas' && <VacunasTab vacunas={vacunasData || []} isLoading={isVacunasLoading} />}
            {activeTab === 'tratamientos' && <TratamientosTab tratamientos={tratamientosData || []} isLoading={isTratamientosLoading} />}
          </div>
        </div>
      </div>
    );
  };

  const hasActiveConsultation = ((atenderCitaId && clinicaId) || isManualConsultation) && !isOwner;

  return (
    <div className="page">
      {hasActiveConsultation ? (
        <div className="consultation-layout">
          {renderLeftPanel()}
          <div className="consultation-sidebar-col">
            <ActiveConsultationForm
              citaId={atenderCitaId || null}
              clinicaId={clinicaId || null}
              mascotaId={mascota.id}
              onClose={() => {
                setSearchParams({});
                setIsManualConsultation(false);
              }}
              onSuccess={() => {
                const hadAppointment = !!atenderCitaId;
                setSearchParams({});
                setIsManualConsultation(false);
                triggerRefetches();
                if (hadAppointment) {
                  navigate('/citas');
                }
              }}
            />
          </div>
        </div>
      ) : (
        renderLeftPanel()
      )}

      {showEditModal && (
        <EditMascotaModal
          mascota={mascota}
          onClose={() => setShowEditModal(false)}
          onUpdated={() => {
            setShowEditModal(false);
            refetchMascota();
          }}
        />
      )}
    </div>
  );
}
