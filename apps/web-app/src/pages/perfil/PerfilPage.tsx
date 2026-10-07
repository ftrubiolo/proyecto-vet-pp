import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useFetch } from '../../hooks/useFetch';
import { Spinner } from '../../components/ui/Spinner';
import { Tabs } from '../../components/ui/Tabs';
import type { VetProfile, OwnerProfile } from '@vetvault/shared';
import { ProfileHeader } from './components/ProfileHeader';
import { PersonalInfoTab } from './components/PersonalInfoTab';
import { ClinicsTab } from './components/ClinicsTab';
import { SubscriptionTab } from './components/SubscriptionTab';
import { AccountSettingsTab } from './components/AccountSettingsTab';

export function PerfilPage() {
  const { user } = useAuth();
  const isVet = user?.rol === 'Veterinario';
  const profileId = isVet ? user?.vetId : user?.proId;

  const endpoint = profileId
    ? isVet
      ? `/veterinarios/${profileId}`
      : `/propietarios/${profileId}`
    : null;

  const { data: profile, isLoading, refetch } = useFetch<VetProfile | OwnerProfile>(endpoint);

  const [activeTab, setActiveTab] = useState('perfil');

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto flex justify-center p-16">
        <Spinner size={40} />
      </div>
    );
  }

  const tabs = isVet
    ? [
      { id: 'perfil', label: 'Perfil' },
      { id: 'clinicas', label: 'Clinicas' },
      { id: 'suscripcion', label: 'Suscripción' },
      { id: 'settings', label: 'Configuración' },
    ]
    : [
      { id: 'perfil', label: 'Perfil' },
      { id: 'settings', label: 'Configuración' },
    ];

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6 animate-fade-in">
      <ProfileHeader profile={profile || undefined} user={user} isVet={isVet} />

      <div className="mt-6">
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

        <div className="mt-6">
          {/* PROFILE DATA TAB */}
          {activeTab === 'perfil' && profile && (
            <PersonalInfoTab
              profile={profile}
              profileId={profileId || ''}
              isVet={isVet}
              refetch={refetch}
            />
          )}

          {/* CLINIC DATA TAB */}
          {activeTab === 'clinicas' && isVet && profile && (
            <ClinicsTab
              profile={profile as VetProfile}
              refetch={refetch}
            />
          )}

          {/* SUBSCRIPTION DATA TAB */}
          {activeTab === 'suscripcion' && isVet && (
            <SubscriptionTab />
          )}

          {/* SETTINGS TAB */}
          {activeTab === 'settings' && (
            <AccountSettingsTab
              profile={profile || undefined}
              user={user}
              refetch={refetch}
            />
          )}
        </div>
      </div>
    </div>
  );
}
