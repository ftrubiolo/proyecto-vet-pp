import type { ReactNode, HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
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
  const classes = [
    variant === 'inner' ? 'card-inner' : 'card',
    clickable ? 'card-clickable' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
}
