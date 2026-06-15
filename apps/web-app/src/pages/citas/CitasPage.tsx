import { useAuth } from '../../hooks/useAuth';
import { VetCitasView } from './components/VetCitasView';
import { OwnerCitasView } from './components/OwnerCitasView';
import './CitasPage.css';

export function CitasPage() {
  const { user } = useAuth();
  const isVet = user?.rol === 'Veterinario';

  if (isVet) {
    return <VetCitasView />;
  } else {
    return <OwnerCitasView />;
  }
}
