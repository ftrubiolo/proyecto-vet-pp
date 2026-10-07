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
          ? 'rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-slate-50/80 dark:bg-slate-850/60 backdrop-blur-sm p-4 hover:border-slate-300 dark:hover:border-slate-700'
          : 'rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white/85 dark:bg-slate-900/85 backdrop-blur-md p-6 shadow-sm hover:shadow-md',
        clickable &&
          'cursor-pointer hover:-translate-y-0.5 hover:shadow-lg hover:border-sky-400/60 dark:hover:border-sky-500/50 active:translate-y-0 select-none',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
