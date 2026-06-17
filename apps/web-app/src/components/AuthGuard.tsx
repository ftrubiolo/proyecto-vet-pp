import { useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Spinner } from './ui/Spinner';
import { api } from '../api/client';
import { ShieldAlert, LogOut, CreditCard } from 'lucide-react';

export function AuthGuard() {
  const { isAuthenticated, isLoading, user, logout } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<'independent' | 'clinic_pro'>('clinic_pro');
  const [checkoutStatus, setCheckoutStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: 'var(--bg)',
      }}>
        <Spinner size={48} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Enforce subscription verification for Veterinarians
  if (user?.rol === 'Veterinario') {
    const isUnsubscribed = 
      !user.subscriptionStatus || 
      user.subscriptionStatus === 'inactivo' || 
      user.subscriptionStatus === 'cancelado';

    if (isUnsubscribed) {
      const handleCheckout = async () => {
        setCheckoutStatus('loading');
        setErrorMsg('');
        try {
          const res = await api.post<{ initPoint: string }>('/suscripciones/checkout', {
            plan: selectedPlan,
          });
          if (res.initPoint) {
            window.location.href = res.initPoint;
          } else {
            throw new Error('No se recibió la dirección de cobro de Mercado Pago.');
          }
        } catch (err: any) {
          setCheckoutStatus('error');
          setErrorMsg(err.message || 'Error al conectar con Mercado Pago. Reintente por favor.');
        }
      };

      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(-45deg, #f1f5f9, #e2e8f0, #cbd5e1)',
          padding: 'var(--space-lg)',
          fontFamily: 'var(--sans)',
        }}>
          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-outer)',
            padding: 'var(--space-2xl)',
            width: '100%',
            maxWidth: '620px',
            boxShadow: 'var(--shadow-lg)',
            textAlign: 'center',
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.1)',
              color: 'var(--danger)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 'var(--space-md)',
            }}>
              <ShieldAlert size={28} />
            </div>

            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-h)', margin: '0 0 var(--space-xs)' }}>
              Acceso Suspendido
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem', marginBottom: 'var(--space-xl)', lineHeight: 1.5 }}>
              Para continuar gestionando pacientes e historias clínicas en VetVault, debes seleccionar un plan y activar tu suscripción recurrente en Mercado Pago.
            </p>

            {/* Plans row */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 'var(--space-md)',
              marginBottom: 'var(--space-lg)',
              textAlign: 'left',
            }}>
              <div 
                onClick={() => setSelectedPlan('independent')}
                style={{
                  border: `2px solid ${selectedPlan === 'independent' ? 'var(--accent-blue, #0ea5e9)' : 'var(--border)'}`,
                  background: selectedPlan === 'independent' ? 'rgba(14, 165, 233, 0.02)' : 'var(--surface)',
                  padding: 'var(--space-md)',
                  borderRadius: 'var(--radius-inner)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, margin: '0 0 4px', color: 'var(--text-h)' }}>Veterinario Independiente</h3>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-h)', marginBottom: '8px' }}>
                  $19.000 <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>/ mes</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>✓ 1 Profesional</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>✓ Hasta 150 Pacientes</div>
              </div>

              <div 
                onClick={() => setSelectedPlan('clinic_pro')}
                style={{
                  border: `2px solid ${selectedPlan === 'clinic_pro' ? 'var(--accent-blue, #0ea5e9)' : 'var(--border)'}`,
                  background: selectedPlan === 'clinic_pro' ? 'rgba(14, 165, 233, 0.02)' : 'var(--surface)',
                  padding: 'var(--space-md)',
                  borderRadius: 'var(--radius-inner)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  position: 'relative',
                }}
              >
                <div style={{
                  position: 'absolute',
                  top: '-10px',
                  right: '8px',
                  background: 'var(--accent-gradient)',
                  color: '#fff',
                  fontSize: '0.625rem',
                  fontWeight: 800,
                  padding: '2px 6px',
                  borderRadius: '10px',
                  textTransform: 'uppercase',
                }}>Popular</div>
                <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, margin: '0 0 4px', color: 'var(--text-h)' }}>Clínica Pro</h3>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-h)', marginBottom: '8px' }}>
                  $49.000 <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>/ mes</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>✓ Cuentas Ilimitadas</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>✓ Pacientes Ilimitados</div>
              </div>
            </div>

            {errorMsg && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.05)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                color: 'var(--danger)',
                padding: 'var(--space-sm)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.8125rem',
                marginBottom: 'var(--space-md)',
              }}>
                {errorMsg}
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
              <button
                onClick={handleCheckout}
                disabled={checkoutStatus === 'loading'}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'var(--accent-gradient)',
                  border: 'none',
                  borderRadius: 'var(--radius-inner)',
                  color: '#fff',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 12px rgba(14, 165, 233, 0.2)',
                }}
              >
                <CreditCard size={18} />
                {checkoutStatus === 'loading' ? 'Conectando...' : 'Re-activar Suscripción con Mercado Pago'}
              </button>

              <button
                onClick={async () => {
                  try {
                    await api.post('/suscripciones/dev-bypass');
                    window.location.reload();
                  } catch (err) {
                    alert('Error al simular pago habilitado.');
                  }
                }}
                style={{
                  width: '100%',
                  padding: '10px',
                  background: 'none',
                  border: '1px dashed var(--accent-blue, #0ea5e9)',
                  borderRadius: 'var(--radius-inner)',
                  color: 'var(--accent-blue, #0ea5e9)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: '0.8125rem',
                  marginTop: '4px',
                }}
              >
                Simular Pago / Aprobación (DEV ONLY)
              </button>

              <button
                onClick={logout}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  marginTop: 'var(--space-sm)',
                }}
              >
                <LogOut size={16} />
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      );
    }
  }

  return <Outlet />;
}
