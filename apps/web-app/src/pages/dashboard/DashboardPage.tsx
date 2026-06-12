import { useAuth } from '../../hooks/useAuth';
import { VetDashboard } from './VetDashboard';
import { OwnerDashboard } from './OwnerDashboard';
import './DashboardPage.css';

export function DashboardPage() {
  const { user } = useAuth();

  if (user?.rol === 'Veterinario') {
    return <VetDashboard />;
  }

  // Por defecto, o si es Propietario, mostrar el Dashboard de propietario
  return <OwnerDashboard />;
}
