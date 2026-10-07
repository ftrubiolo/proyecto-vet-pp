import { Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { AIChatDrawer } from './AIChatDrawer';
import { AlertTriangle } from 'lucide-react';

export function AppLayout() {
  const { user } = useAuth();

  const roleClass = user?.rol === 'Veterinario' ? 'role-vet' : 'role-owner';
  const showGraceWarning = user?.rol === 'Veterinario' && user?.subscriptionStatus === 'impago';

  return (
    <div className={`flex min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-800 dark:text-slate-100 ${roleClass}`}>
      <Sidebar />
      <Header />
      <main className="flex-1 ml-0 md:ml-64 mt-[68px] p-4 sm:p-6 lg:p-8 min-h-[calc(100vh-68px)] bg-slate-50 dark:bg-slate-950">
        {showGraceWarning && (
          <div className="flex items-center gap-3 p-3.5 mb-6 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-600 text-white text-sm font-semibold shadow-md animate-fade-in">
            <AlertTriangle size={20} className="flex-shrink-0" />
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
