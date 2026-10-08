import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '../../utils/cn';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  children: ReactNode;
}

const variantStyles: Record<string, string> = {
  primary:
    'text-white bg-[image:var(--accent-gradient-role,var(--accent-gradient))] shadow-[0_4px_12px_var(--accent-light,rgba(14,165,233,0.2))] hover:shadow-[0_6px_20px_var(--accent-light,rgba(14,165,233,0.35))] hover:-translate-y-0.5 active:translate-y-0',
  secondary:
    'bg-[var(--surface-solid)] text-[var(--text-h)] border border-[var(--border)] hover:bg-[var(--surface-2)] shadow-sm',
  danger:
    'text-white bg-red-600 hover:bg-red-700 shadow-sm hover:-translate-y-0.5 active:translate-y-0',
  ghost:
    'bg-transparent text-[var(--text)] hover:bg-[var(--accent-light)] hover:text-[var(--accent)]',
};

const sizeStyles: Record<string, string> = {
  sm: 'px-3 py-1.5 text-xs rounded-lg gap-1.5',
  md: 'px-4 py-2 text-sm rounded-xl gap-2',
  lg: 'px-6 py-3 text-base rounded-2xl gap-2.5',
};

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center font-semibold transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none select-none active:scale-[0.98]',
        variantStyles[variant] || variantStyles.primary,
        sizeStyles[size] || sizeStyles.md,
        fullWidth && 'w-full',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
