import type { ReactNode } from 'react';
import { cn } from '../../utils/cn';

export interface BadgeProps {
  variant?: 'accent' | 'success' | 'warning' | 'danger' | 'neutral';
  children: ReactNode;
  className?: string;
}

const badgeVariants: Record<string, string> = {
  accent:
    'bg-[var(--accent-light)] text-[var(--accent)] border-[var(--accent)]/40',
  success:
    'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60',
  warning:
    'bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800/60',
  danger:
    'bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/60',
  neutral:
    'bg-[var(--surface-2)] text-[var(--text)] border-[var(--border)]',
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
