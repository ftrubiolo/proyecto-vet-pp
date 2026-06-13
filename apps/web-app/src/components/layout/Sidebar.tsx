import { useState, useRef, useEffect } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { LayoutDashboard, PawPrint, CalendarDays, User, LogOut, ChevronRight, Settings } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import './Sidebar.css';

const navItems = (user: any) => [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/mascotas', icon: PawPrint, label: user?.rol === 'Veterinario' ? 'Pacientes' : 'Mis Mascotas' },
  { to: '/citas', icon: CalendarDays, label: 'Citas' },
];

export function Sidebar() {
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const hasFoto = !!(user?.foto_url && user.foto_url !== 'null' && user.foto_url !== 'undefined' && user.foto_url.trim() !== '');

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        {/* <div className="sidebar-logo-icon">
          <Stethoscope size={20} />
        </div> */}
        <div className="sidebar-logo-text">
          Vet<span>Vault</span>
        </div>
      </div>

      <div className="sidebar-divider"></div>

      <nav className="sidebar-nav">
        <span className="sidebar-section-label">Menú Principal</span>
        {navItems(user).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'active' : ''}`
            }
          >
            <item.icon size={20} className="sidebar-link-icon" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer" ref={menuRef}>
        {isMenuOpen && (
          <div className="sidebar-profile-menu">
            <Link
              to="/perfil"
              className="sidebar-profile-menu-item"
              onClick={() => setIsMenuOpen(false)}
            >
              <Settings size={16} />
              <span>Configuración</span>
            </Link>
            <button
              className="sidebar-profile-menu-item logout"
              onClick={() => {
                setIsMenuOpen(false);
                logout();
              }}
            >
              <LogOut size={16} />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        )}

        <button
          className={`sidebar-profile-btn ${isMenuOpen ? 'active' : ''}`}
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >

          <div className="sidebar-profile-avatar-square" style={hasFoto ? { backgroundImage: `url(${user?.foto_url})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' } : undefined}>
            {!hasFoto && <User size={18} />}
          </div>

          <span className="sidebar-profile-label">Mi Cuenta</span>

          <div className="sidebar-profile-right">
            <ChevronRight size={16} className={`sidebar-profile-arrow ${isMenuOpen ? 'open' : ''}`} />
          </div>
        </button>
      </div >
    </aside >
  );
}

