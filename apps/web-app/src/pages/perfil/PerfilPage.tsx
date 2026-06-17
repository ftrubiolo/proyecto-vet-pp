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
import './PerfilPage.css';

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
      <div className="page" style={{ display: 'flex', justifyContent: 'center', padding: '64px' }}>
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
    <div className="page">
      <ProfileHeader profile={profile || undefined} user={user} isVet={isVet} />

      <div style={{ marginTop: 'var(--space-lg)' }}>
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

        <div className="perfil-tab-content">
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
