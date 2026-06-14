import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useFetch } from '../../hooks/useFetch';
import { Search, Sparkles, Plus, PawPrint } from 'lucide-react';
import { Button } from '../ui/Button';
import { CreateCitaModal } from '../appointments/CreateCitaModal';
import './Header.css';

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

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [showAIDropdown, setShowAIDropdown] = useState(false);
  const [showCreateCita, setShowCreateCita] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const aiRef = useRef<HTMLDivElement>(null);

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
      if (aiRef.current && !aiRef.current.contains(event.target as Node)) {
        setShowAIDropdown(false);
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

  const filteredMascotas = searchQuery.trim() === ''
    ? []
    : rawMascotas.filter((m: any) =>
        m.nombre?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.raza?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.especie?.toLowerCase().includes(searchQuery.toLowerCase())
      );

  return (
    <header className="header">
      {/* Page Title */}
      <div className="header-left">
        <h1 className="header-title">{pageTitle}</h1>
      </div>

      {/* Global Searchbar */}
      <div className="header-search-container" ref={searchRef}>
        <Search className="header-search-icon" size={18} />
        <input
          type="text"
          className="header-search-input"
          placeholder={searchPlaceholder}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setIsSearchFocused(true)}
        />

        {/* Search Results Dropdown */}
        {isSearchFocused && searchQuery.trim().length > 0 && (
          <div className="search-results-dropdown">
            {isLoading ? (
              <div className="search-results-loading">Cargando pacientes...</div>
            ) : filteredMascotas.length === 0 ? (
              <div className="search-results-empty">
                No se encontraron resultados para "{searchQuery}"
              </div>
            ) : (
              filteredMascotas.slice(0, 5).map((m: any) => (
                <div
                  key={m.id}
                  className="search-result-item"
                  onClick={() => {
                    navigate(`/mascotas/${m.id}`);
                    setSearchQuery('');
                    setIsSearchFocused(false);
                  }}
                >
                  <PawPrint size={16} className="search-result-pet-icon" />
                  <div className="search-result-pet-info">
                    <span className="search-result-pet-name">{m.nombre}</span>
                    <span className="search-result-pet-details">
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
      <div className="header-right">
        {/* AI Copilot Wrapper */}
        <div className="ai-dropdown-wrapper" ref={aiRef}>
          <button
            className={`header-action-btn ai-btn ${showAIDropdown ? 'active' : ''}`}
            onClick={() => setShowAIDropdown(!showAIDropdown)}
            title="VetVault AI Assistant"
          >
            <Sparkles className="ai-icon" size={18} />
          </button>

          {/* Floating AI Dropdown Aligned Underneath */}
          {showAIDropdown && (
            <div className="ai-dropdown-panel">
              <div className="ai-dropdown-header">
                <Sparkles size={16} className="ai-dropdown-title-icon" />
                <h3 className="ai-dropdown-title">VetVault AI</h3>
              </div>
              <div className="ai-dropdown-content">
                <div className="ai-dropdown-empty">
                  <Sparkles size={32} className="ai-dropdown-empty-icon" />
                  <h4 className="ai-dropdown-empty-title">
                    {isVet ? 'Asistente Clínico IA' : 'Asistente de Cuidado IA'}
                  </h4>
                  <p className="ai-dropdown-empty-text">
                    {isVet
                      ? 'Próximamente podrás analizar historias clínicas, resumir síntomas y redactar recetas utilizando inteligencia artificial.'
                      : 'Próximamente podrás consultar dudas de cuidado para tus mascotas, interpretar vacunas y recibir consejos personalizados.'}
                  </p>
                  <div className="ai-dropdown-badge">Próximamente</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Nueva Cita Action */}
        <Button
          className="header-new-cita-btn"
          onClick={() => setShowCreateCita(true)}
        >
          <Plus size={16} />
          <span className="btn-text-desktop">Nueva Cita</span>
        </Button>
      </div>

      {/* Global Booking Modal */}
      {showCreateCita && (
        <CreateCitaModal
          onClose={() => setShowCreateCita(false)}
          onCreate={() => {
            setShowCreateCita(false);
            // Notify current page to refresh data if necessary
            window.dispatchEvent(new CustomEvent('appointment-created'));
          }}
        />
      )}
    </header>
  );
}

