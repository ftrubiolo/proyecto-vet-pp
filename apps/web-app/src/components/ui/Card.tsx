import type { ReactNode, HTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'inner';
  clickable?: boolean;
  children: ReactNode;
}

export function Card({
  variant = 'default',
  clickable = false,
  className = '',
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        'transition-all duration-200',
        variant === 'inner'
          ? 'rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text)] backdrop-blur-sm p-4 hover:border-[var(--accent)]'
          : 'rounded-3xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] backdrop-blur-md p-6 shadow-sm hover:shadow-md',
        clickable &&
          'cursor-pointer hover:-translate-y-0.5 hover:shadow-lg hover:border-[var(--accent)] active:translate-y-0 select-none',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
