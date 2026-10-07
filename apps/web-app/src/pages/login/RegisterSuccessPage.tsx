import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ShieldAlert, Loader } from 'lucide-react';
import { api } from '../../api/client';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/ui/Button';

export function RegisterSuccessPage() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [status, setStatus] = useState<'polling' | 'success' | 'delay'>('polling');
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let intervalId: any;

    const checkSubscription = async () => {
      try {
        // Retrieve fresh user details (cookie verifies user session)
        const data = await api.get<{ user: any }>('/usuarios/me');
        const user = data.user;

        if (user && user.subscriptionStatus === 'activo') {
          // Status updated! Set local auth context and route to dashboard
          setUser(user);
          setStatus('success');
          setTimeout(() => {
            navigate('/dashboard', { replace: true });
          }, 2000);
        } else {
          setRetryCount((prev) => prev + 1);
        }
      } catch {
        // Session not yet updated or error loading
        setRetryCount((prev) => prev + 1);
      }
    };

    if (status === 'polling') {
      intervalId = setInterval(checkSubscription, 2000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [status, navigate, setUser]);

  // Handle slow webhook delays (exceeding 20 seconds / 10 retries)
  useEffect(() => {
    if (retryCount >= 10 && status === 'polling') {
      setStatus('delay');
    }
  }, [retryCount, status]);

  const handleManualCheck = async () => {
    setStatus('polling');
    setRetryCount(0);
  };

  const handleGoToDashboard = () => {
    navigate('/dashboard', { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--bg)] font-sans">
      <div className="w-full max-w-md p-8 rounded-3xl bg-[var(--surface-solid)] border border-[var(--border)] shadow-2xl backdrop-blur-xl animate-fade-in text-center space-y-4">
        {status === 'polling' && (
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-sky-50 dark:bg-sky-950/50 text-sky-500 flex items-center justify-center">
              <Loader size={36} className="animate-spin text-sky-500" />
            </div>
            <h2 className="text-xl font-bold text-[var(--text-h)]">
              Procesando Pago
            </h2>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Mercado Pago está confirmando tu transacción. Esto puede demorar unos segundos. Por favor no cierres esta ventana...
            </p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-500 flex items-center justify-center">
              <Check size={36} />
            </div>
            <h2 className="text-xl font-bold text-[var(--text-h)]">
              ¡Suscripción Activada!
            </h2>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Tu pago fue procesado correctamente y tu cuenta se encuentra activa. Redirigiéndote a tu panel de gestión...
            </p>
          </div>
        )}

        {status === 'delay' && (
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-500 flex items-center justify-center">
              <ShieldAlert size={36} />
            </div>
            <h2 className="text-xl font-bold text-[var(--text-h)]">
              Demora en la acreditación
            </h2>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Mercado Pago está tardando un poco más de lo habitual en reportar el pago. Puedes verificar el estado manualmente o ingresar directamente.
            </p>
            <div className="flex flex-col gap-2 pt-2">
              <Button onClick={handleManualCheck}>Re-verificar Estado</Button>
              <Button variant="secondary" onClick={handleGoToDashboard}>
                Ir al Dashboard
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
