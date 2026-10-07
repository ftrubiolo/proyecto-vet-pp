import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useFetch } from '../../hooks/useFetch';
import { useAIChat } from '../../hooks/useAIChat';
import { Search, Sparkles, Plus, PawPrint } from 'lucide-react';
import { Button } from '../ui/Button';
import { CreateCitaModal } from '../appointments/CreateCitaModal';
import { cn } from '../../utils/cn';

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/mascotas': 'Mascotas',
  '/citas': 'Citas',
  '/perfil': 'Mi Cuenta',
};

export function Header() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { isAIChatOpen, setIsAIChatOpen } = useAIChat();

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [showCreateCita, setShowCreateCita] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);

  // Fetch mascotas only when the user is focusing or typing in search
  const { data: mascotasData, isLoading } = useFetch<any[]>(
    isSearchFocused ? '/mascotas' : null
  );

  // Get page title from current path
  const basePath = '/' + (location.pathname.split('/')[1] || 'dashboard');
  const pageTitle = pageTitles[basePath] || 'VetVault';

  const isVet = user?.rol === 'Veterinario';
  const searchPlaceholder = isVet
    ? 'Buscar pacientes...'
    : 'Buscar mis mascotas...';

  // Handle clicking outside dropdowns to close them
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Filter logic
  const rawMascotas = Array.isArray(mascotasData)
    ? mascotasData
    : (mascotasData as any)?.mascotas || [];

  const filteredMascotas =
    searchQuery.trim() === ''
      ? []
      : rawMascotas.filter(
          (m: any) =>
            m.nombre?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            m.raza?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            m.especie?.toLowerCase().includes(searchQuery.toLowerCase())
        );

  return (
    <header className="fixed top-0 left-0 md:left-64 right-0 h-[68px] z-30 flex items-center justify-between px-4 sm:px-6 lg:px-8 border-b border-[var(--border)] bg-[var(--surface)] backdrop-blur-xl gap-4">
      {/* Page Title */}
      <div className="flex items-center flex-shrink-0">
        <h1 className="font-heading font-bold text-lg text-[var(--text-h)]">
          {pageTitle}
        </h1>
      </div>

      {/* Global Searchbar */}
      <div
        className="relative flex items-center bg-[var(--surface-solid)] border border-[var(--border)] rounded-xl px-3.5 h-10 w-full max-w-xs sm:max-w-sm transition-all focus-within:ring-2 focus-within:ring-[var(--accent)]/20 focus-within:border-[var(--accent)] focus-within:max-w-md hidden sm:flex"
        ref={searchRef}
      >
        <Search className="text-[var(--text-muted)] mr-2 flex-shrink-0" size={17} />
        <input
          type="text"
          className="w-full bg-transparent border-none text-[var(--text-h)] text-sm placeholder-[var(--text-muted)] focus:outline-none"
          placeholder={searchPlaceholder}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setIsSearchFocused(true)}
        />

        {/* Search Results Dropdown */}
        {isSearchFocused && searchQuery.trim().length > 0 && (
          <div className="absolute top-12 left-0 right-0 bg-[var(--surface-solid)] border border-[var(--border)] rounded-2xl shadow-xl max-h-72 overflow-y-auto p-1.5 z-50 animate-slide-down">
            {isLoading ? (
              <div className="p-4 text-center text-xs text-[var(--text-muted)]">
                Cargando pacientes...
              </div>
            ) : filteredMascotas.length === 0 ? (
              <div className="p-4 text-center text-xs text-[var(--text-muted)]">
                No se encontraron resultados para "{searchQuery}"
              </div>
            ) : (
              filteredMascotas.slice(0, 5).map((m: any) => (
                <div
                  key={m.id}
                  className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-[var(--surface-2)] cursor-pointer transition-colors"
                  onClick={() => {
                    navigate(`/mascotas/${m.id}`);
                    setSearchQuery('');
                    setIsSearchFocused(false);
                  }}
                >
                  <PawPrint size={16} className="text-[var(--accent)] flex-shrink-0" />
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-semibold text-[var(--text-h)] truncate">
                      {m.nombre}
                    </span>
                    <span className="text-xs text-[var(--text-muted)] truncate">
                      {m.raza || 'Sin raza'} · {m.especie || ''}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3">
        {/* AI Copilot Button */}
        <button
          type="button"
          className={cn(
            'w-10 h-10 rounded-xl border border-[var(--border)] bg-[var(--surface-solid)] flex items-center justify-center text-[var(--accent)] shadow-sm transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer hover:border-[var(--accent)]',
            isAIChatOpen && 'border-[var(--accent)] bg-[var(--accent-light)] shadow-md ring-2 ring-[var(--accent)]/20'
          )}
          onClick={() => setIsAIChatOpen(!isAIChatOpen)}
          title="VetVault Copilot"
        >
          <Sparkles size={18} className="animate-pulse" />
        </button>

        {/* Nueva Cita Action */}
        <Button
          onClick={() => {
            user?.rol === 'Veterinario'
              ? setShowCreateCita(true)
              : navigate('/citas');
          }}
        >
          <Plus size={16} />
          <span className="hidden sm:inline">Nueva Cita</span>
        </Button>
      </div>

      {/* Global Booking Modal */}
      {showCreateCita && (
        <CreateCitaModal
          onClose={() => setShowCreateCita(false)}
          onCreate={() => {
            setShowCreateCita(false);
            window.dispatchEvent(new CustomEvent('appointment-created'));
          }}
        />
      )}
    </header>
  );
}
