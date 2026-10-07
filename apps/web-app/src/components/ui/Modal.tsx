import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl';
}

const widthStyles: Record<string, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '4xl': 'max-w-4xl',
};

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  className = '',
  maxWidth = 'lg',
}: ModalProps) {
  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className={cn(
          'w-full rounded-3xl border border-[var(--border)] bg-[var(--surface-solid)] shadow-2xl p-6 max-h-[90vh] overflow-y-auto animate-fade-in-up flex flex-col gap-4 text-[var(--text)]',
          widthStyles[maxWidth] || widthStyles.lg,
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
          <h2 className="text-lg font-bold text-[var(--text-h)] m-0">
            {title}
          </h2>
          <button
            className="p-1.5 rounded-full text-[var(--text-muted)] hover:text-[var(--text-h)] hover:bg-[var(--surface-2)] transition-colors cursor-pointer"
            onClick={onClose}
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </div>
        <div className="flex-1">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--border)]">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
