import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PawPrint,
  CalendarDays,
  Syringe,
  CheckCircle2,
  Plus,
} from 'lucide-react';
import type { Mascota, MascotasResponse } from '@vetvault/shared';
import { getUIEstado } from '@vetvault/shared';
import { useAuth } from '../../hooks/useAuth';
import { useFetch } from '../../hooks/useFetch';
import { useToast } from '../../hooks/useToast';
import { api } from '../../api/client';
import { Card } from '../../components/ui/Card';
import { StatCard } from '../../components/ui/StatCard';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { CreateCitaModal } from '../../components/appointments/CreateCitaModal';
import {
  PetHealthPassportCard,
  computePetVaccineStatus,
} from './components/PetHealthPassportCard';
import { UpcomingAppointmentBanner } from './components/UpcomingAppointmentBanner';
import { ClinicReferenceBanner } from './components/ClinicReferenceBanner';
import { RescheduleCitaModal } from './components/RescheduleCitaModal';

export function OwnerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [showCreateCitaModal, setShowCreateCitaModal] = useState(false);
  const [reschedulingCita, setReschedulingCita] = useState<any | null>(null);

  // Fetch mascotas
  const {
    data: mascotasData,
    isLoading: isMascotasLoading,
  } = useFetch<MascotasResponse | Mascota[]>('/mascotas');

  // Fetch appointments
  const {
    data: rawCitas,
    isLoading: isCitasLoading,
    refetch: refetchCitas,
  } = useFetch<any[]>('/citas');

  // Fetch clinics as reference
  const { data: clinicasData } = useFetch<any[]>('/clinicas');

  // Normalize mascotas list
  const mascotas: Mascota[] = useMemo(() => {
    if (Array.isArray(mascotasData)) return mascotasData;
    return (mascotasData as MascotasResponse)?.mascotas || [];
  }, [mascotasData]);

  const rawCitasList: any[] = useMemo(() => {
    return Array.isArray(rawCitas) ? rawCitas : [];
  }, [rawCitas]);

  // Fetch vaccine series per pet
  const [vacunasByMascota, setVacunasByMascota] = useState<Record<string, any[]>>({});
  const [isVacunasLoading, setIsVacunasLoading] = useState(false);

  useEffect(() => {
    if (mascotas.length === 0) {
      setVacunasByMascota({});
      setIsVacunasLoading(false);
      return;
    }

    let isMounted = true;
    setIsVacunasLoading(true);

    Promise.all(
      mascotas.map((m) =>
        api
          .get<any[]>(`/vacunas/mascota/${m.id}`)
          .then((data) => ({ id: m.id, data: Array.isArray(data) ? data : [] }))
          .catch(() => ({ id: m.id, data: [] }))
      )
    )
      .then((results) => {
        if (!isMounted) return;
        const map: Record<string, any[]> = {};
        results.forEach((r) => {
          map[r.id] = r.data;
        });
        setVacunasByMascota(map);
        setIsVacunasLoading(false);
      })
      .catch(() => {
        if (isMounted) setIsVacunasLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [mascotas]);

  // Compute upcoming appointments
  const upcomingCitas = useMemo(() => {
    const now = new Date();
    return rawCitasList
      .filter((c: any) => {
        const appointmentDate = new Date(c.fecha_hora);
        const estado = getUIEstado(c);
        return (
          appointmentDate >= now &&
          (estado === 'Pendiente' || estado === 'Confirmada')
        );
      })
      .sort((a: any, b: any) => {
        return (
          new Date(a.fecha_hora).getTime() - new Date(b.fecha_hora).getTime()
        );
      });
  }, [rawCitasList]);

  // Next immediate appointment
  const nextUpcomingCita = upcomingCitas.length > 0 ? upcomingCitas[0] : null;

  // Completed visits count
  const completedVisitsCount = useMemo(() => {
    return rawCitasList.filter((c: any) => getUIEstado(c) === 'Completada').length;
  }, [rawCitasList]);

  // Pending/upcoming vaccines sum across all pets
  const totalPendingVaccinesCount = useMemo(() => {
    let count = 0;
    Object.values(vacunasByMascota).forEach((seriesList) => {
      const info = computePetVaccineStatus(seriesList);
      count += info.vencidas + info.proximas;
    });
    return count;
  }, [vacunasByMascota]);

  // Determine primary clinic reference
  const primaryClinic = useMemo(() => {
    if (nextUpcomingCita?.clinica) return nextUpcomingCita.clinica;
    const anyCitaWithClinic = rawCitasList.find((c: any) => c.clinica)?.clinica;
    if (anyCitaWithClinic) return anyCitaWithClinic;
    if (Array.isArray(clinicasData) && clinicasData.length > 0) return clinicasData[0];
    return null;
  }, [nextUpcomingCita, rawCitasList, clinicasData]);

  // Cancel appointment handler
  const handleCancelAppointment = async (citaId: string) => {
    if (!window.confirm('¿Seguro que querés cancelar este turno?')) return;
    try {
      await api.patch(`/citas/${citaId}`, { estado_cita_id: 3 });
      toast.success('Turno cancelado exitosamente');
      refetchCitas();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al cancelar la cita');
    }
  };

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  const displayName = user?.nombre || user?.email?.split('@')[0] || 'Propietario';

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* Header section with greeting & primary CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-h)] tracking-tight">
            {greeting()}, {displayName} 👋
          </h2>
          <p className="text-sm text-[var(--text-muted)]">
            Aquí podés ver el estado de tus mascotas, su pasaporte de salud y próximas citas.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={() => setShowCreateCitaModal(true)}
          className="self-start sm:self-auto flex items-center gap-2 shadow-sm"
        >
          <Plus size={16} />
          <span>Sacar Turno</span>
        </Button>
      </div>

      {/* Dynamic Clinical Metrics (Zero Static Placeholders) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<PawPrint size={20} />}
          value={mascotas.length}
          label="Mis mascotas"
          loading={isMascotasLoading}
        />
        <StatCard
          icon={<CalendarDays size={20} />}
          value={upcomingCitas.length}
          label="Próximos turnos"
          loading={isCitasLoading}
        />
        <StatCard
          icon={<Syringe size={20} />}
          value={totalPendingVaccinesCount}
          label="Vacunas por atender"
          loading={isMascotasLoading || isVacunasLoading}
        />
        <StatCard
          icon={<CheckCircle2 size={20} />}
          value={completedVisitsCount}
          label="Consultas realizadas"
          loading={isCitasLoading}
        />
      </div>

      {/* Upcoming Care & Appointment Hero Banner */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-[var(--text-h)] flex items-center gap-2">
            <CalendarDays size={18} className="text-[var(--accent)]" />
            <span>Próxima Cita & Atención</span>
          </h3>
          {upcomingCitas.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/citas')}
              className="text-xs"
            >
              Ver todas ({upcomingCitas.length})
            </Button>
          )}
        </div>

        <UpcomingAppointmentBanner
          upcomingCita={nextUpcomingCita}
          isLoading={isCitasLoading}
          onReschedule={(cita) => setReschedulingCita(cita)}
          onCancel={handleCancelAppointment}
          onBookAppointment={() => setShowCreateCitaModal(true)}
        />
      </div>

      {/* Pet Health Passport Cards Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-[var(--text-h)] flex items-center gap-2">
              <PawPrint size={18} className="text-[var(--accent)]" />
              <span>Pasaporte de Salud de Mascotas</span>
            </h3>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Ficha médica digital, estado preventivo y accesos directos
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/mascotas')}
              className="text-xs"
            >
              Ver todas
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate('/mascotas')}
              className="text-xs hidden sm:flex items-center gap-1.5"
            >
              <Plus size={14} />
              <span>Registrar Mascota</span>
            </Button>
          </div>
        </div>

        {isMascotasLoading ? (
          <Card className="p-8 flex justify-center items-center min-h-[160px]">
            <Spinner />
          </Card>
        ) : mascotas.length === 0 ? (
          <Card className="p-6">
            <EmptyState
              icon={<PawPrint size={40} className="text-[var(--accent)]" />}
              title="Sin mascotas registradas"
              message="Todavía no diste de alta ninguna mascota. Registrá a tus compañeros para gestionar sus turnos, vacunas e historial clínico."
              action={
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate('/mascotas')}
                  className="flex items-center gap-1.5 mt-1"
                >
                  <Plus size={15} />
                  <span>Registrar Mascota</span>
                </Button>
              }
            />
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4.5">
            {mascotas.map((m) => (
              <PetHealthPassportCard
                key={m.id}
                mascota={m}
                series={vacunasByMascota[m.id]}
                isVaccinesLoading={isVacunasLoading}
              />
            ))}
          </div>
        )}
      </div>

      {/* Primary Clinic & Emergency Reference Banner */}
      <div className="space-y-3 pt-2">
        <ClinicReferenceBanner clinic={primaryClinic} />
      </div>

      {/* Appointment Creation Modal */}
      {showCreateCitaModal && (
        <CreateCitaModal
          onClose={() => setShowCreateCitaModal(false)}
          onCreate={() => {
            setShowCreateCitaModal(false);
            refetchCitas();
          }}
        />
      )}

      {/* Appointment Reschedule Modal */}
      <RescheduleCitaModal
        isOpen={Boolean(reschedulingCita)}
        onClose={() => setReschedulingCita(null)}
        onSuccess={() => {
          setReschedulingCita(null);
          refetchCitas();
        }}
        cita={reschedulingCita}
      />
    </div>
  );
}
