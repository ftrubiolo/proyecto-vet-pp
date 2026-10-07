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
    <header className="fixed top-0 left-0 md:left-64 right-0 h-[68px] z-30 flex items-center justify-between px-4 sm:px-6 lg:px-8 border-b border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl gap-4">
      {/* Page Title */}
      <div className="flex items-center flex-shrink-0">
        <h1 className="font-heading font-bold text-lg text-slate-900 dark:text-slate-100">
          {pageTitle}
        </h1>
      </div>

      {/* Global Searchbar */}
      <div
        className="relative flex items-center bg-slate-100/90 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 rounded-xl px-3.5 h-10 w-full max-w-xs sm:max-w-sm transition-all focus-within:ring-2 focus-within:ring-sky-500/20 focus-within:border-sky-500 focus-within:max-w-md hidden sm:flex"
        ref={searchRef}
      >
        <Search className="text-slate-400 mr-2 flex-shrink-0" size={17} />
        <input
          type="text"
          className="w-full bg-transparent border-none text-slate-800 dark:text-slate-100 text-sm placeholder-slate-400 focus:outline-none"
          placeholder={searchPlaceholder}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setIsSearchFocused(true)}
        />

        {/* Search Results Dropdown */}
        {isSearchFocused && searchQuery.trim().length > 0 && (
          <div className="absolute top-12 left-0 right-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl max-h-72 overflow-y-auto p-1.5 z-50 animate-slide-down">
            {isLoading ? (
              <div className="p-4 text-center text-xs text-slate-400">
                Cargando pacientes...
              </div>
            ) : filteredMascotas.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">
                No se encontraron resultados para "{searchQuery}"
              </div>
            ) : (
              filteredMascotas.slice(0, 5).map((m: any) => (
                <div
                  key={m.id}
                  className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                  onClick={() => {
                    navigate(`/mascotas/${m.id}`);
                    setSearchQuery('');
                    setIsSearchFocused(false);
                  }}
                >
                  <PawPrint size={16} className="text-sky-500 flex-shrink-0" />
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                      {m.nombre}
                    </span>
                    <span className="text-xs text-slate-400 truncate">
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
            'w-10 h-10 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-center text-sky-500 shadow-sm transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer hover:border-sky-400',
            isAIChatOpen && 'border-sky-500 bg-sky-50 dark:bg-sky-950/50 shadow-md ring-2 ring-sky-500/20'
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
