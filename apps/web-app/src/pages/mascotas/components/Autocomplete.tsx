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
    <div className="autocomplete-container form-group" style={{ position: 'relative' }}>
      <label className="form-label">{label}</label>
      <input
        type="text"
        className="form-input"
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
        <ul className="autocomplete-results" style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          background: 'var(--surface-solid)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-inner)',
          zIndex: 1100,
          listStyle: 'none',
          padding: '4px 0',
          marginTop: '4px',
          boxShadow: 'var(--shadow)',
          maxHeight: '200px',
          overflowY: 'auto'
        }}>
          {filtered.map(item => (
            <li
              key={item.id}
              onClick={() => {
                onSelect(item);
                setQuery(clearOnSelect ? '' : item.name);
                setIsOpen(false);
              }}
              style={{
                padding: '8px 12px',
                cursor: 'pointer',
                fontSize: '0.875rem',
                color: 'var(--text-h)',
                borderBottom: '1px solid var(--border)'
              }}
              className="autocomplete-item"
            >
              {item.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
