import type { ReactNode } from 'react';
import { cn } from '../../utils/cn';

export interface BadgeProps {
  variant?: 'accent' | 'success' | 'warning' | 'danger' | 'neutral';
  children: ReactNode;
  className?: string;
}

const badgeVariants: Record<string, string> = {
  accent:
    'bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 border-sky-200 dark:border-sky-800/60',
  success:
    'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60',
  warning:
    'bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800/60',
  danger:
    'bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/60',
  neutral:
    'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700',
};

export function Badge({ variant = 'accent', children, className = '' }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide border',
        badgeVariants[variant] || badgeVariants.accent,
        className
      )}
    >
      {children}
    </span>
  );
}
