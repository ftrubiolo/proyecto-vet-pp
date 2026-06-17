import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ShieldAlert, Loader } from 'lucide-react';
import { api } from '../../api/client';
import { useAuth } from '../../hooks/useAuth';
import './RegisterPage.css';

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
      } catch (err) {
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
    <div className="register-page">
      <div className="register-card" style={{ maxWidth: '500px' }}>
        <div className="success-card">
          {status === 'polling' && (
            <>
              <div className="success-icon-wrapper" style={{ background: 'rgba(14, 165, 233, 0.1)', color: 'var(--accent-blue, #0ea5e9)' }}>
                <Loader size={36} className="animate-spin" style={{ animation: 'spin 1.5s linear infinite' }} />
              </div>
              <h2 className="success-title">Procesando Pago</h2>
              <p className="success-message">
                Mercado Pago está confirmando tu transacción. Esto puede demorar unos segundos. Por favor no cierres esta ventana...
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="success-icon-wrapper">
                <Check size={36} />
              </div>
              <h2 className="success-title">¡Suscripción Activada!</h2>
              <p className="success-message">
                Tu pago fue procesado correctamente y tu cuenta se encuentra activa. Redirigiéndote a tu panel de gestión...
              </p>
            </>
          )}

          {status === 'delay' && (
            <>
              <div className="success-icon-wrapper" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
                <ShieldAlert size={36} />
              </div>
              <h2 className="success-title">Demora en la acreditación</h2>
              <p className="success-message">
                Mercado Pago está tardando un poco más de lo habitual en reportar el pago. Puedes verificar el estado manualmente o ingresar directamente.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                <button className="btn-next" onClick={handleManualCheck}>
                  Re-verificar Estado
                </button>
                <button className="btn-back" onClick={handleGoToDashboard}>
                  Ir al Dashboard
                </button>
              </div>
            </>
          )}
        </div>
      </div>
      
      {/* Inject custom spin animation to CSS without modifying global files */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
}
