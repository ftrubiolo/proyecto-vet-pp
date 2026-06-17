import { Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { AIChatDrawer } from './AIChatDrawer';
import './AppLayout.css';

export function AppLayout() {
  const { user } = useAuth();

  const roleClass = user?.rol === 'Veterinario' ? 'role-vet' : 'role-owner';
  const showGraceWarning = user?.rol === 'Veterinario' && user?.subscriptionStatus === 'impago';

  return (
    <div className={`app-layout ${roleClass}`}>
      <Sidebar />
      <Header />
      <main className="app-main">
        {showGraceWarning && (
          <div style={{
            background: 'linear-gradient(135deg, #f97316, #ea580c)',
            color: '#ffffff',
            padding: '12px 16px',
            borderRadius: 'var(--radius-inner, 8px)',
            fontSize: '0.875rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: 'var(--shadow-sm)',
            marginBottom: 'var(--space-md, 16px)',
          }}>
            <span>⚠️</span>
            <span>
              <strong>Período de gracia activo:</strong> Tu renovación de pago en Mercado Pago falló. Regularizá el saldo para evitar la suspensión de tu cuenta en los próximos 7 días.
            </span>
          </div>
        )}
        <Outlet />
      </main>
      <AIChatDrawer key={user?.id || 'guest'} />
    </div>
  );
}
