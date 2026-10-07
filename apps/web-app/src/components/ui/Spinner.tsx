import { cn } from '../../utils/cn';

export interface SpinnerProps {
  size?: number;
  className?: string;
}

export function Spinner({ size = 24, className = '' }: SpinnerProps) {
  return (
    <div
      className={cn(
        'inline-block animate-spin rounded-full border-2 border-slate-300 dark:border-slate-700 border-t-sky-500',
        className
      )}
      style={{ width: size, height: size }}
      role="status"
      aria-label="Cargando"
    />
  );
}
