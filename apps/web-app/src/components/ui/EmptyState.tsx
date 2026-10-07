import type { ReactNode } from 'react';
import { cn } from '../../utils/cn';

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  message?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, message, action, className = '' }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center p-8 text-center text-[var(--text-muted)]', className)}>
      {icon && (
        <div className="w-14 h-14 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center text-[var(--text-muted)] mb-3">
          {icon}
        </div>
      )}
      <h3 className="text-base font-bold text-[var(--text-h)] mb-1">
        {title}
      </h3>
      {message && (
        <p className="text-sm text-[var(--text-muted)] max-w-sm mb-3">
          {message}
        </p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
