import { useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, PawPrint, Edit } from 'lucide-react';
import { useFetch } from '../../hooks/useFetch';
import { useAuth } from '../../hooks/useAuth';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Tabs } from '../../components/ui/Tabs';
import { Spinner } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';

import type { MascotaDetail } from './types';
import { calcAge } from './utils';

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
            <div className="mascota-detail-actions">
              <Button onClick={() => setShowEditModal(true)} variant="secondary" size="sm" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Edit size={14} />
                Editar Datos
              </Button>
            </div>
          </div>
        </Card>

        <div style={{ marginTop: 'var(--space-lg)' }}>
          <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

          <div className="mascota-tab-content">
            {activeTab === 'datos' && <DatosTab mascota={mascota} isOwner={isOwner} atenciones={atencionesData || []} />}
            {activeTab === 'historial' && <HistorialTab atenciones={atencionesData || []} isLoading={isHistorialLoading} />}
            {activeTab === 'vacunas' && <VacunasTab vacunas={vacunasData || []} isLoading={isVacunasLoading} />}
            {activeTab === 'tratamientos' && <TratamientosTab tratamientos={tratamientosData || []} isLoading={isTratamientosLoading} />}
          </div>
        </div>
      </div>
    );
  };

  const hasActiveConsultation = atenderCitaId && clinicaId && !isOwner;

  return (
    <div className="page">
      {hasActiveConsultation ? (
        <div className="consultation-layout">
          {renderLeftPanel()}
          <div className="consultation-sidebar-col">
            <ActiveConsultationForm
              citaId={atenderCitaId!}
              clinicaId={clinicaId!}
              mascotaId={mascota.id}
              onClose={() => setSearchParams({})}
              onSuccess={() => {
                setSearchParams({});
                triggerRefetches();
                navigate('/citas');
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
