import { useState } from 'react';
import { CreditCard, Check, AlertTriangle, Calendar, Building, ShieldAlert, Sparkles, Mail } from 'lucide-react';
import { useFetch } from '../../../hooks/useFetch';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Spinner } from '../../../components/ui/Spinner';
import { useToast } from '../../../hooks/useToast';
import { api } from '../../../api/client';
import type { Suscripcion } from '@vetvault/shared';

export function SubscriptionTab() {
  const { toast } = useToast();
  const { data, isLoading, error } = useFetch<{ subscription: Suscripcion | null }>('/suscripciones/mi-suscripcion');
  const [selectedPlan, setSelectedPlan] = useState<'independent' | 'clinic_pro'>('clinic_pro');
  const [actionStatus, setActionStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [showContactModal, setShowContactModal] = useState(false);

  const sub = data?.subscription;
  const isDevelopment = import.meta.env.DEV;

  const handleCheckout = async (plan: 'independent' | 'clinic_pro') => {
    setActionStatus('loading');
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
      const msg = err.message || 'Error al conectar con Mercado Pago. Reintente por favor.';
      toast.error(msg);
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
      const msg = err.message || 'Error al simular pago.';
      toast.error(msg);
    } finally {
      setActionStatus('idle');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
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
    <div className="flex flex-col gap-6">
      {error && (
        <div className="p-3 rounded-xl text-sm font-medium border border-rose-500/30 bg-rose-500/10 text-rose-500">
          {error}
        </div>
      )}

      {hasActiveSubscription ? (
        <div className="flex flex-col gap-4">
          {/* Active Subscription Summary */}
          <Card>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Plan Actual</span>
                <h3 className="text-xl font-bold text-[var(--text-h)] mt-0.5">{getPlanLabel(sub.plan)}</h3>
              </div>
              <div>
                {getStatusBadge(sub.estado)}
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-[var(--border)] flex flex-col gap-2">
              <div className="flex items-center gap-2 text-sm text-[var(--text)]">
                <Calendar size={16} className="text-[var(--text-muted)] shrink-0" />
                <span>
                  <strong>Vencimiento / Renovación:</strong> {sub.fecha_expiracion ? new Date(sub.fecha_expiracion).toLocaleDateString() : 'No disponible'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-[var(--text)]">
                <span className="w-4 text-center font-bold text-[var(--text-muted)] shrink-0">$</span>
                <span>
                  <strong>Costo:</strong> {getPlanPriceLabel(sub.plan)} (ARS)
                </span>
              </div>
            </div>

            {sub.estado === 'impago' && daysLeftForGrace !== null && (
              <div className="mt-4 flex items-center gap-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-600 dark:text-amber-400 text-sm">
                <AlertTriangle size={18} className="shrink-0" />
                <div>
                  <strong>Alerta de Pago Pendiente:</strong> Tu última transacción falló. Quedan {daysLeftForGrace} días del periodo de gracia antes de que el acceso a VetVault sea suspendido.
                </div>
              </div>
            )}

            <div className="mt-6 bg-[var(--surface-2)] p-4 rounded-xl border border-[var(--border)]">
              <h4 className="text-sm font-bold text-[var(--text-h)] mb-1">¿Cómo cancelar o modificar tu suscripción?</h4>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed mb-2">
                Las suscripciones de VetVault se gestionan directamente a través de tu cuenta de Mercado Pago.
                Para modificar el medio de pago o dar de baja el débito automático:
              </p>
              <ol className="list-decimal pl-5 text-xs text-[var(--text-muted)] space-y-1">
                <li>Ingresa a tu cuenta en <a href="https://www.mercadopago.com.ar" target="_blank" rel="noopener noreferrer" className="text-[var(--accent)] underline hover:opacity-80">Mercado Pago</a>.</li>
                <li>Dirígete a la sección de <strong>Suscripciones</strong>.</li>
                <li>Busca la suscripción correspondiente a <strong>VetVault</strong> para pausar o cancelar el servicio.</li>
              </ol>
            </div>
          </Card>

          {/* Plan upgrade options for active users */}
          <div className="mt-2">
            <h4 className="text-base font-bold text-[var(--text-h)] mb-1">Cambiar Plan de Suscripción</h4>
            <p className="text-sm text-[var(--text-muted)]">
              Si deseas cambiar de plan, selecciona uno a continuación. El cambio se procesará iniciando una nueva pre-aprobación en Mercado Pago.
            </p>
          </div>
        </div>
      ) : (
        <Card>
          <div className="text-center py-4">
            <div className="w-12 h-12 rounded-full bg-sky-500/10 text-[var(--accent)] inline-flex items-center justify-center mb-3">
              <CreditCard size={24} />
            </div>
            <h3 className="text-lg font-bold text-[var(--text-h)] mb-1">Suscripción Inactiva</h3>
            <p className="text-sm text-[var(--text-muted)] max-w-md mx-auto mb-2">
              No tienes una suscripción activa. Selecciona un plan a continuación para activar tu cuenta de VetVault.
            </p>
          </div>
        </Card>
      )}

      {/* Plan Cards Row */}
      {(!hasActiveSubscription || sub?.plan !== 'enterprise') && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Plan 1 */}
          <div 
            onClick={() => setSelectedPlan('independent')}
            className={`p-6 rounded-2xl border-2 flex flex-col justify-between min-h-[340px] cursor-pointer transition-all duration-200 bg-[var(--surface)] hover:-translate-y-1 hover:shadow-lg ${
              selectedPlan === 'independent' ? 'border-[var(--accent)] ring-2 ring-[var(--accent)]/20' : 'border-[var(--border)] hover:border-[var(--accent)]/50'
            }`}
          >
            <div>
              <h4 className="text-base font-bold text-[var(--text-h)] mb-1">Veterinario Independiente</h4>
              <div className="text-2xl font-black text-[var(--text-h)] mb-4">
                $19.000 <span className="text-xs font-medium text-[var(--text-muted)]">/ mes</span>
              </div>
              <ul className="space-y-2 mb-6">
                <li className="flex items-center gap-2 text-xs text-[var(--text)]"><Check size={14} className="text-[var(--accent)] shrink-0" /> 1 Profesional de la salud</li>
                <li className="flex items-center gap-2 text-xs text-[var(--text)]"><Check size={14} className="text-[var(--accent)] shrink-0" /> Hasta 150 Mascotas</li>
                <li className="flex items-center gap-2 text-xs text-[var(--text)]"><Check size={14} className="text-[var(--accent)] shrink-0" /> Historias Clínicas ilimitadas</li>
                <li className="flex items-center gap-2 text-xs text-[var(--text)]"><Check size={14} className="text-[var(--accent)] shrink-0" /> Calendario de Vacunación</li>
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
            onClick={() => setSelectedPlan('clinic_pro')}
            className={`relative p-6 rounded-2xl border-2 flex flex-col justify-between min-h-[340px] cursor-pointer transition-all duration-200 bg-[var(--surface)] hover:-translate-y-1 hover:shadow-lg ${
              selectedPlan === 'clinic_pro' ? 'border-[var(--accent)] ring-2 ring-[var(--accent)]/20' : 'border-[var(--border)] hover:border-[var(--accent)]/50'
            }`}
          >
            <div className="absolute -top-3 right-4 bg-gradient-to-r from-sky-500 to-indigo-600 text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase flex items-center gap-1 shadow-sm">
              <Sparkles size={10} /> Popular
            </div>
            <div>
              <h4 className="text-base font-bold text-[var(--text-h)] mb-1">Clínica Pro</h4>
              <div className="text-2xl font-black text-[var(--text-h)] mb-4">
                $49.000 <span className="text-xs font-medium text-[var(--text-muted)]">/ mes</span>
              </div>
              <ul className="space-y-2 mb-6">
                <li className="flex items-center gap-2 text-xs text-[var(--text)]"><Check size={14} className="text-[var(--accent)] shrink-0" /> Cuentas ilimitadas (Vets/Recepción)</li>
                <li className="flex items-center gap-2 text-xs text-[var(--text)]"><Check size={14} className="text-[var(--accent)] shrink-0" /> Mascotas ilimitadas</li>
                <li className="flex items-center gap-2 text-xs text-[var(--text)]"><Check size={14} className="text-[var(--accent)] shrink-0" /> IA Voice Scribe (100 min/mes)</li>
                <li className="flex items-center gap-2 text-xs text-[var(--text)]"><Check size={14} className="text-[var(--accent)] shrink-0" /> Dashboard Clínico Avanzado</li>
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
              >
                Suscribirse
              </Button>
            )}
          </div>

          {/* Plan 3 - Custom Empresarial */}
          <div 
            onClick={() => setShowContactModal(true)}
            className="p-6 rounded-2xl border-2 border-[var(--border)] hover:border-[var(--accent)]/50 flex flex-col justify-between min-h-[340px] cursor-pointer transition-all duration-200 bg-[var(--surface)] hover:-translate-y-1 hover:shadow-lg"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-base font-bold text-[var(--text-h)]">Plan Empresarial</h4>
                <div className="text-[var(--accent)] bg-sky-500/10 rounded-full w-7 h-7 flex items-center justify-center shrink-0">
                  <Building size={16} />
                </div>
              </div>
              <div className="text-xl font-black text-[var(--text-h)] mb-4">
                Costo a convenir
              </div>
              <ul className="space-y-2 mb-6">
                <li className="flex items-center gap-2 text-xs text-[var(--text)]"><Check size={14} className="text-[var(--accent)] shrink-0" /> Hospitales y Grandes Clínicas</li>
                <li className="flex items-center gap-2 text-xs text-[var(--text)]"><Check size={14} className="text-[var(--accent)] shrink-0" /> Integraciones con APIs & LIS</li>
                <li className="flex items-center gap-2 text-xs text-[var(--text)]"><Check size={14} className="text-[var(--accent)] shrink-0" /> Servidor dedicado opcional</li>
                <li className="flex items-center gap-2 text-xs text-[var(--text)]"><Check size={14} className="text-[var(--accent)] shrink-0" /> Soporte técnico Prioritario 24/7</li>
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
              <Mail size={14} className="mr-1.5 inline" /> Contactar Ventas
            </Button>
          </div>
        </div>
      )}

      {/* Dev Bypass Section */}
      {isDevelopment && (
        <div className="mt-8 pt-4 border-t border-dashed border-[var(--border)]">
          <span className="text-xs font-semibold text-[var(--text-muted)] block mb-2">
            HERRAMIENTAS DE DESARROLLO (DEV ONLY)
          </span>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleDevBypass}
            disabled={actionStatus === 'loading'}
            className="border border-dashed border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--accent-light)] flex items-center gap-2"
          >
            <ShieldAlert size={14} />
            {actionStatus === 'loading' ? 'Procesando...' : 'Simular Pago Exitoso (Dev Bypass)'}
          </Button>
        </div>
      )}

      {/* Contact Sales Modal */}
      {showContactModal && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4"
          onClick={() => setShowContactModal(false)}
        >
          <div 
            className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 w-full max-w-md shadow-2xl animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-[var(--text-h)] mb-1">¿Interesado en el Plan Empresarial?</h3>
            <p className="text-sm text-[var(--text-muted)] leading-relaxed mb-4">
              Para grandes centros médicos y cadenas de veterinarias, ofrecemos cotizaciones personalizadas, migración de datos sin costo y soporte técnico dedicado.
            </p>
            <div className="bg-[var(--surface-2)] border border-[var(--border)] rounded-xl p-4 text-sm flex flex-col gap-2 mb-6">
              <p className="m-0">✉ <strong>Email:</strong> ventas@vetvault.com</p>
              <p className="m-0">📞 <strong>Teléfono:</strong> +54 9 351 123-4567</p>
            </div>
            <div className="flex justify-end">
              <Button size="sm" onClick={() => setShowContactModal(false)}>Cerrar</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
