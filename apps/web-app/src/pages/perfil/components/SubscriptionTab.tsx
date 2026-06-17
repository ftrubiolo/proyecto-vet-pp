import { useState } from 'react';
import { CreditCard, Check, AlertTriangle, Calendar, Building, ShieldAlert, Sparkles, Mail } from 'lucide-react';
import { useFetch } from '../../../hooks/useFetch';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Spinner } from '../../../components/ui/Spinner';
import { api } from '../../../api/client';
import type { Suscripcion } from '@vetvault/shared';

export function SubscriptionTab() {
  const { data, isLoading, error } = useFetch<{ subscription: Suscripcion | null }>('/suscripciones/mi-suscripcion');
  const [selectedPlan, setSelectedPlan] = useState<'independent' | 'clinic_pro'>('clinic_pro');
  const [actionStatus, setActionStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [showContactModal, setShowContactModal] = useState(false);

  const sub = data?.subscription;
  const isDevelopment = import.meta.env.DEV;

  const handleCheckout = async (plan: 'independent' | 'clinic_pro') => {
    setActionStatus('loading');
    setErrorMsg('');
    try {
      const res = await api.post<{ initPoint: string }>('/suscripciones/checkout', {
        plan,
      });
      if (res.initPoint) {
        window.location.href = res.initPoint;
      } else {
        throw new Error('No se recibió la dirección de cobro de Mercado Pago.');
      }
    } catch (err: any) {
      setActionStatus('error');
      setErrorMsg(err.message || 'Error al conectar con Mercado Pago. Reintente por favor.');
    } finally {
      setActionStatus('idle');
    }
  };

  const handleDevBypass = async () => {
    setActionStatus('loading');
    try {
      await api.post('/suscripciones/dev-bypass');
      window.location.reload();
    } catch (err: any) {
      setActionStatus('error');
      setErrorMsg(err.message || 'Error al simular pago.');
    } finally {
      setActionStatus('idle');
    }
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}>
        <Spinner size={32} />
      </div>
    );
  }

  const getPlanLabel = (planCode?: string | null) => {
    if (planCode === 'independent') return 'Veterinario Independiente';
    if (planCode === 'clinic_pro') return 'Clínica Pro';
    if (planCode === 'enterprise') return 'Plan Empresarial';
    return 'Ninguno';
  };

  const getPlanPriceLabel = (planCode?: string | null) => {
    if (planCode === 'independent') return '$19.000 / mes';
    if (planCode === 'clinic_pro') return '$49.000 / mes';
    if (planCode === 'enterprise') return 'Costo Personalizado';
    return '–';
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'activo':
        return <Badge variant="success">Activo</Badge>;
      case 'impago':
        return <Badge variant="warning">Impago / Pendiente</Badge>;
      case 'cancelado':
        return <Badge variant="danger">Cancelado</Badge>;
      default:
        return <Badge variant="neutral">Inactivo</Badge>;
    }
  };

  const hasActiveSubscription = sub && (sub.estado === 'activo' || sub.estado === 'impago');

  // Days left calculation for impago state
  let daysLeftForGrace: number | null = null;
  if (sub && sub.estado === 'impago' && sub.grace_period_start) {
    const graceLimit = new Date(new Date(sub.grace_period_start).getTime() + 7 * 24 * 60 * 60 * 1000);
    const diffTime = graceLimit.getTime() - new Date().getTime();
    daysLeftForGrace = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  }

  return (
    <div className="subscription-tab-container">
      {error && (
        <div className="login-message error" style={{ marginBottom: 'var(--space-md)' }}>
          {error}
        </div>
      )}

      {errorMsg && (
        <div className="login-message error" style={{ marginBottom: 'var(--space-md)' }}>
          {errorMsg}
        </div>
      )}

      {hasActiveSubscription ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          {/* Active Subscription Summary */}
          <Card>
            <div className="active-sub-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span className="perfil-field-label">Plan Actual</span>
                <h3 className="active-sub-title" style={{ margin: '4px 0 0 0', fontSize: '1.25rem', fontWeight: '700' }}>{getPlanLabel(sub.plan)}</h3>
              </div>
              <div>
                {getStatusBadge(sub.estado)}
              </div>
            </div>

            <div className="active-sub-details" style={{ marginTop: 'var(--space-md)', borderTop: '1px solid var(--border)', paddingTop: 'var(--space-md)' }}>
              <div className="sub-detail-row" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calendar size={16} style={{ color: 'var(--text-muted)' }} />
                <span>
                  <strong>Vencimiento / Renovación:</strong> {sub.fecha_expiracion ? new Date(sub.fecha_expiracion).toLocaleDateString() : 'No disponible'}
                </span>
              </div>
              <div className="sub-detail-row" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: 'var(--space-xs)' }}>
                <span style={{ width: '16px', textAlign: 'center', fontWeight: 'bold', color: 'var(--text-muted)' }}>$</span>
                <span>
                  <strong>Costo:</strong> {getPlanPriceLabel(sub.plan)} (ARS)
                </span>
              </div>
            </div>

            {sub.estado === 'impago' && daysLeftForGrace !== null && (
              <div className="grace-period-alert" style={{
                marginTop: 'var(--space-md)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-sm)',
                padding: 'var(--space-sm)',
                background: 'rgba(249, 115, 22, 0.1)',
                border: '1px solid rgba(249, 115, 22, 0.2)',
                borderRadius: 'var(--radius-sm)',
                color: '#ea580c',
                fontSize: '0.875rem'
              }}>
                <AlertTriangle size={18} style={{ flexShrink: 0 }} />
                <div>
                  <strong>Alerta de Pago Pendiente:</strong> Tu última transacción falló. Quedan {daysLeftForGrace} días del periodo de gracia antes de que el acceso a VetVault sea suspendido.
                </div>
              </div>
            )}

            <div className="sub-management-info" style={{
              marginTop: 'var(--space-lg)',
              background: 'var(--surface-2)',
              padding: 'var(--space-md)',
              borderRadius: 'var(--radius-inner)',
              border: '1px solid var(--border)'
            }}>
              <h4 style={{ margin: '0 0 var(--space-xs) 0', fontSize: '0.9375rem', fontWeight: 700 }}>¿Cómo cancelar o modificar tu suscripción?</h4>
              <p style={{ margin: '0 0 var(--space-sm) 0', fontSize: '0.8125rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                Las suscripciones de VetVault se gestionan directamente a través de tu cuenta de Mercado Pago.
                Para modificar el medio de pago o dar de baja el débito automático:
              </p>
              <ol style={{ margin: 0, paddingLeft: '20px', fontSize: '0.8125rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                <li>Ingresa a tu cuenta en <a href="https://www.mercadopago.com.ar" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>Mercado Pago</a>.</li>
                <li>Dirígete a la sección de <strong>Suscripciones</strong>.</li>
                <li>Busca la suscripción correspondiente a <strong>VetVault</strong> para pausar o cancelar el servicio.</li>
              </ol>
            </div>
          </Card>

          {/* Plan upgrade options for active users */}
          <div style={{ marginTop: 'var(--space-md)' }}>
            <h4 className="perfil-section-title" style={{ marginBottom: '4px' }}>Cambiar Plan de Suscripción</h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: '0 0 var(--space-md) 0' }}>
              Si deseas cambiar de plan, selecciona uno a continuación. El cambio se procesará iniciando una nueva pre-aprobación en Mercado Pago.
            </p>
          </div>
        </div>
      ) : (
        <Card>
          <div style={{ textAlign: 'center', padding: 'var(--space-md) 0' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: 'rgba(14, 165, 233, 0.1)',
              color: 'var(--accent)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 'var(--space-sm)'
            }}>
              <CreditCard size={24} />
            </div>
            <h3 className="perfil-section-title" style={{ marginBottom: '4px' }}>Suscripción Inactiva</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', maxWidth: '480px', margin: '0 auto var(--space-lg)' }}>
              No tienes una suscripción activa. Selecciona un plan a continuación para activar tu cuenta de VetVault.
            </p>
          </div>
        </Card>
      )}

      {/* Plan Cards Row */}
      {(!hasActiveSubscription || sub?.plan !== 'enterprise') && (
        <div className="plans-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: 'var(--space-md)',
          marginTop: 'var(--space-md)'
        }}>
          {/* Plan 1 */}
          <div 
            className={`plan-option-card ${selectedPlan === 'independent' ? 'selected' : ''}`}
            onClick={() => setSelectedPlan('independent')}
            style={{
              background: 'var(--surface)',
              border: `2px solid ${selectedPlan === 'independent' ? 'var(--accent)' : 'var(--border)'}`,
              borderRadius: 'var(--radius-outer)',
              padding: 'var(--space-lg)',
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: '340px'
            }}
          >
            <div>
              <h4 className="plan-option-title" style={{ margin: '0 0 8px 0', fontSize: '1rem', fontWeight: 700 }}>Veterinario Independiente</h4>
              <div className="plan-option-price" style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 16px 0' }}>
                $19.000 <span className="price-suffix" style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)' }}>/ mes</span>
              </div>
              <ul className="plan-option-features" style={{ margin: '0 0 var(--space-lg) 0', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8125rem', color: 'var(--text)' }}><Check size={14} style={{ color: 'var(--accent)', flexShrink: 0 }} /> 1 Profesional de la salud</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8125rem', color: 'var(--text)' }}><Check size={14} style={{ color: 'var(--accent)', flexShrink: 0 }} /> Hasta 150 Mascotas</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8125rem', color: 'var(--text)' }}><Check size={14} style={{ color: 'var(--accent)', flexShrink: 0 }} /> Historias Clínicas ilimitadas</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8125rem', color: 'var(--text)' }}><Check size={14} style={{ color: 'var(--accent)', flexShrink: 0 }} /> Calendario de Vacunación</li>
              </ul>
            </div>
            {(!sub || sub.plan !== 'independent') && (
              <Button 
                variant={selectedPlan === 'independent' ? 'primary' : 'secondary'} 
                size="sm"
                fullWidth 
                onClick={(e) => {
                  e.stopPropagation();
                  handleCheckout('independent');
                }}
                disabled={actionStatus === 'loading'}
              >
                Suscribirse
              </Button>
            )}
          </div>

          {/* Plan 2 */}
          <div 
            className={`plan-option-card premium ${selectedPlan === 'clinic_pro' ? 'selected' : ''}`}
            onClick={() => setSelectedPlan('clinic_pro')}
            style={{
              background: 'var(--surface)',
              border: `2px solid ${selectedPlan === 'clinic_pro' ? 'var(--accent)' : 'var(--border)'}`,
              borderRadius: 'var(--radius-outer)',
              padding: 'var(--space-lg)',
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
              minHeight: '340px'
            }}
          >
            <div className="plan-option-badge" style={{
              position: 'absolute',
              top: '-12px',
              right: '16px',
              background: 'var(--accent-gradient)',
              color: '#fff',
              fontSize: '0.625rem',
              fontWeight: 800,
              padding: '2px 8px',
              borderRadius: '12px',
              textTransform: 'uppercase',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <Sparkles size={10} /> Popular
            </div>
            <div>
              <h4 className="plan-option-title" style={{ margin: '0 0 8px 0', fontSize: '1rem', fontWeight: 700 }}>Clínica Pro</h4>
              <div className="plan-option-price" style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 16px 0' }}>
                $49.000 <span className="price-suffix" style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)' }}>/ mes</span>
              </div>
              <ul className="plan-option-features" style={{ margin: '0 0 var(--space-lg) 0', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8125rem', color: 'var(--text)' }}><Check size={14} style={{ color: 'var(--accent)', flexShrink: 0 }} /> Cuentas ilimitadas (Vets/Recepción)</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8125rem', color: 'var(--text)' }}><Check size={14} style={{ color: 'var(--accent)', flexShrink: 0 }} /> Mascotas ilimitadas</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8125rem', color: 'var(--text)' }}><Check size={14} style={{ color: 'var(--accent)', flexShrink: 0 }} /> IA Voice Scribe (100 min/mes)</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8125rem', color: 'var(--text)' }}><Check size={14} style={{ color: 'var(--accent)', flexShrink: 0 }} /> Dashboard Clínico Avanzado</li>
              </ul>
            </div>
            {(!sub || sub.plan !== 'clinic_pro') && (
              <Button 
                variant="primary" 
                size="sm"
                fullWidth 
                onClick={(e) => {
                  e.stopPropagation();
                  handleCheckout('clinic_pro');
                }}
                disabled={actionStatus === 'loading'}
                style={{ background: 'var(--accent-gradient)' }}
              >
                Suscribirse
              </Button>
            )}
          </div>

          {/* Plan 3 - Custom Empresarial */}
          <div 
            className="plan-option-card enterprise"
            onClick={() => setShowContactModal(true)}
            style={{
              background: 'var(--surface)',
              border: '2px solid var(--border)',
              borderRadius: 'var(--radius-outer)',
              padding: 'var(--space-lg)',
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: '340px'
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '0 0 8px 0' }}>
                <h4 className="plan-option-title" style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Plan Empresarial</h4>
                <div style={{
                  color: 'var(--accent)',
                  background: 'var(--accent-light, rgba(14, 165, 233, 0.1))',
                  borderRadius: '50%',
                  width: '28px',
                  height: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Building size={16} />
                </div>
              </div>
              <div className="plan-option-price" style={{ fontSize: '1.25rem', fontWeight: 800, margin: '4px 0 16px 0', color: 'var(--text)' }}>
                Costo a convenir
              </div>
              <ul className="plan-option-features" style={{ margin: '0 0 var(--space-lg) 0', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8125rem', color: 'var(--text)' }}><Check size={14} style={{ color: 'var(--accent)', flexShrink: 0 }} /> Hospitales y Grandes Clínicas</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8125rem', color: 'var(--text)' }}><Check size={14} style={{ color: 'var(--accent)', flexShrink: 0 }} /> Integraciones con APIs & LIS</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8125rem', color: 'var(--text)' }}><Check size={14} style={{ color: 'var(--accent)', flexShrink: 0 }} /> Servidor dedicado opcional</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8125rem', color: 'var(--text)' }}><Check size={14} style={{ color: 'var(--accent)', flexShrink: 0 }} /> Soporte técnico Prioritario 24/7</li>
              </ul>
            </div>
            <Button 
              variant="secondary" 
              size="sm"
              fullWidth 
              onClick={(e) => {
                e.stopPropagation();
                setShowContactModal(true);
              }}
            >
              <Mail size={14} style={{ marginRight: '6px', display: 'inline' }} /> Contactar Ventas
            </Button>
          </div>
        </div>
      )}

      {/* Dev Bypass Section */}
      {isDevelopment && (
        <div style={{ marginTop: 'var(--space-xl)', borderTop: '1px dashed var(--border)', paddingTop: 'var(--space-md)' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>
            HERRAMIENTAS DE DESARROLLO (DEV ONLY)
          </span>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleDevBypass}
            disabled={actionStatus === 'loading'}
            style={{ border: '1px dashed var(--accent)', color: 'var(--accent)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <ShieldAlert size={14} />
            {actionStatus === 'loading' ? 'Procesando...' : 'Simular Pago Exitoso (Dev Bypass)'}
          </Button>
        </div>
      )}

      {/* Contact Sales Modal */}
      {showContactModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: 'var(--space-md)'
        }} onClick={() => setShowContactModal(false)}>
          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-outer)',
            padding: 'var(--space-xl)',
            width: '100%',
            maxWidth: '450px',
            boxShadow: 'var(--shadow-lg)',
            animation: 'fadeIn 0.2s ease forwards'
          }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 var(--space-xs) 0', fontSize: '1.25rem', fontWeight: 800 }}>¿Interesado en el Plan Empresarial?</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1.5, margin: '0 0 var(--space-md) 0' }}>
              Para grandes centros médicos y cadenas de veterinarias, ofrecemos cotizaciones personalizadas, migración de datos sin costo y soporte técnico dedicado.
            </p>
            <div style={{
              background: 'var(--surface-2)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-inner)',
              padding: 'var(--space-md)',
              fontSize: '0.875rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              marginBottom: 'var(--space-md)'
            }}>
              <p style={{ margin: 0 }}>✉ <strong>Email:</strong> ventas@vetvault.com</p>
              <p style={{ margin: 0 }}>📞 <strong>Teléfono:</strong> +54 9 351 123-4567</p>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button size="sm" onClick={() => setShowContactModal(false)}>Cerrar</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
