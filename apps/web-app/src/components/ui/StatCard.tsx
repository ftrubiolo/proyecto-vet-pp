import type { ReactNode } from 'react';
import { Card, type CardProps } from './Card';
import { Spinner } from './Spinner';
import { cn } from '../../utils/cn';

export interface StatCardProps extends Omit<CardProps, 'children'> {
  icon: ReactNode;
  value: ReactNode;
  label: ReactNode;
  loading?: boolean;
}

export function StatCard({
  icon,
  value,
  label,
  loading = false,
  className = '',
  ...props
}: StatCardProps) {
  return (
    <Card className={cn('p-5 sm:p-6', className)} {...props}>
      <div className="flex flex-col justify-between h-full gap-3">
        <div className="flex items-center justify-between">
          <div className="w-10 h-10 rounded-xl bg-[var(--accent-light)] text-[var(--accent)] flex items-center justify-center shrink-0">
            {icon}
          </div>
          <div className="text-2xl font-extrabold text-[var(--text-h)] tracking-tight min-h-[32px] flex items-center">
            {loading ? <Spinner size={20} /> : value}
          </div>
        </div>
        <div className="text-xs sm:text-sm font-medium text-[var(--text-muted)]">
          {label}
        </div>
      </div>
    </Card>
  );
}
