import { useAuth } from '../../hooks/useAuth';
import { VetMascotas } from './VetMascotas';
import { OwnerMascotas } from './OwnerMascotas';
import './MascotasPage.css';

export function MascotasPage() {
  const { user } = useAuth();

  if (user?.rol === 'Veterinario') {
    return <VetMascotas />;
  }

  // Por defecto, o si es Propietario, mostrar las mascotas de propietario
  return <OwnerMascotas />;
}
