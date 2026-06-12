import { Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import './AppLayout.css';

export function AppLayout() {
  const { user } = useAuth();

  const roleClass = user?.rol === 'Veterinario' ? 'role-vet' : 'role-owner';

  return (
    <div className={`app-layout ${roleClass}`}>
      <Sidebar />
      <Header />
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}
