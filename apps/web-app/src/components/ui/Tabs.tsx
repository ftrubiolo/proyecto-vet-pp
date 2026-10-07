import { cn } from '../../utils/cn';

export interface Tab {
  id: string;
  label: string;
}

export interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
}

export function Tabs({ tabs, activeTab, onChange, className = '' }: TabsProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 p-1 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] overflow-x-auto max-w-full',
        className
      )}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            className={cn(
              'px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-150 cursor-pointer whitespace-nowrap select-none',
              isActive
                ? 'bg-[var(--surface-solid)] text-[var(--text-h)] shadow-sm border border-[var(--border)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text-h)] hover:bg-[var(--surface-solid)]/60'
            )}
            onClick={() => onChange(tab.id)}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
