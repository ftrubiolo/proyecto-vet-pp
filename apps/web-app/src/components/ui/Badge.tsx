import type { ReactNode } from 'react';

interface BadgeProps {
  variant?: 'accent' | 'success' | 'warning' | 'danger' | 'neutral';
  children: ReactNode;
  className?: string;
}

export function Badge({ variant = 'accent', children, className = '' }: BadgeProps) {
  return (
    <span className={`badge badge-${variant} ${className}`}>
      {children}
    </span>
  );
}
