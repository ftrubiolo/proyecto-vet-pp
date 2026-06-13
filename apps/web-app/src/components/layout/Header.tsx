import { useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import './Header.css';

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/mascotas': 'Mascotas',
  '/citas': 'Citas',
  '/perfil': 'Mi Cuenta',
};

export function Header() {
  const { user } = useAuth();
  const location = useLocation();

  // Get page title from current path
  const basePath = '/' + (location.pathname.split('/')[1] || 'dashboard');
  const pageTitle = pageTitles[basePath] || 'VetVault';

  const rolLabel = user?.rol === 'Veterinario' ? 'Veterinario' : 'Propietario';

  return (
    <header className="header">
      <div className="header-left">
        <h1 className="header-title">{pageTitle}</h1>
      </div>

      <div className="header-right">
        <div className="header-role-badge">
          <span className="header-role-dot" />
          {rolLabel}
        </div>
      </div>
    </header>
  );
}
