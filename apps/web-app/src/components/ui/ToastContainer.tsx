import React from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import type { ToastItem, ToastType } from '../../context/ToastContext';

interface ToastContainerProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

const toastConfig: Record<
  ToastType,
  {
    icon: React.ComponentType<{ className?: string; size?: number }>;
    iconColor: string;
    bgColor: string;
    borderColor: string;
    titleDefault: string;
  }
> = {
  success: {
    icon: CheckCircle2,
    iconColor: 'text-emerald-500 dark:text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30',
    titleDefault: 'Éxito',
  },
  error: {
    icon: AlertCircle,
    iconColor: 'text-red-500 dark:text-red-400',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30',
    titleDefault: 'Error',
  },
  warning: {
    icon: AlertTriangle,
    iconColor: 'text-amber-500 dark:text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
    titleDefault: 'Atención',
  },
  info: {
    icon: Info,
    iconColor: 'text-sky-500 dark:text-sky-400',
    bgColor: 'bg-sky-500/10',
    borderColor: 'border-sky-500/30',
    titleDefault: 'Información',
  },
};

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed top-5 right-5 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0"
    >
      {toasts.map((toast) => {
        const config = toastConfig[toast.type];
        const IconComponent = config.icon;
        const title = toast.title || config.titleDefault;

        return (
          <div
            key={toast.id}
            role={toast.type === 'error' ? 'alert' : 'status'}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl shadow-xl border backdrop-blur-md transition-all duration-300 animate-slide-in-right bg-[var(--surface-solid)]/95 text-[var(--text)] dark:bg-slate-900/95 ${config.borderColor}`}
          >
            <div className={`p-1.5 rounded-xl ${config.bgColor} shrink-0`}>
              <IconComponent className={config.iconColor} size={18} />
            </div>

            <div className="flex-1 min-w-0 pt-0.5">
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-h)] mb-0.5">
                {title}
              </p>
              <p className="text-xs sm:text-sm font-medium text-[var(--text)] leading-snug break-words">
                {toast.message}
              </p>
            </div>

            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              aria-label="Cerrar notificación"
              className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-h)] hover:bg-black/5 dark:hover:bg-white/5 transition-colors shrink-0 -mr-1 -mt-1 cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
