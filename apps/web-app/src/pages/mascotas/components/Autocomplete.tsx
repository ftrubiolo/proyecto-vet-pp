import { useState, useEffect } from 'react';

interface AutocompleteProps {
  label: string;
  placeholder: string;
  items: { id: any; name: string }[];
  onSelect: (item: { id: any; name: string }) => void;
  valueName?: string;
  clearOnSelect?: boolean;
}

export function Autocomplete({ 
  label, 
  placeholder, 
  items, 
  onSelect, 
  valueName = '', 
  clearOnSelect = true 
}: AutocompleteProps) {
  const [query, setQuery] = useState(valueName);
  const [isOpen, setIsOpen] = useState(false);

  // Sync state if initial or current selection changes from the outside
  useEffect(() => {
    setQuery(valueName);
  }, [valueName]);

  const filtered = query.trim() === ''
    ? []
    : items.filter(item => item.name.toLowerCase().includes(query.toLowerCase())).slice(0, 8);

  return (
    <div className="relative flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-[var(--text-h)]">{label}</label>
      <input
        type="text"
        className="w-full px-3.5 py-2.5 bg-[var(--surface-solid)] border border-[var(--border)] rounded-xl text-sm text-[var(--text-h)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-light)] outline-none transition-all placeholder:text-[var(--text-muted)]"
        placeholder={placeholder}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        onBlur={() => {
          // Give small timeout so onClick triggers before list closes
          setTimeout(() => setIsOpen(false), 200);
        }}
      />
      {isOpen && filtered.length > 0 && (
        <ul className="absolute top-full left-0 right-0 bg-[var(--surface-solid)] border border-[var(--border)] rounded-xl z-[1100] list-none py-1 mt-1 shadow-xl max-h-48 overflow-y-auto">
          {filtered.map(item => (
            <li
              key={item.id}
              onClick={() => {
                onSelect(item);
                setQuery(clearOnSelect ? '' : item.name);
                setIsOpen(false);
              }}
              className="px-3.5 py-2 text-sm text-[var(--text-h)] hover:bg-[var(--accent-light)] hover:text-[var(--accent)] cursor-pointer border-b border-[var(--border)] last:border-b-0 transition-colors"
            >
              {item.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
