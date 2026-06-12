import { NavLink } from 'react-router-dom';
import { LayoutDashboard, PawPrint, CalendarDays, User, LogOut, Stethoscope } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import './Sidebar.css';

const navItems = (user: any) => [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/mascotas', icon: PawPrint, label: user?.rol === 'Veterinario' ? 'Pacientes' : 'Mis Mascotas' },
  { to: '/citas', icon: CalendarDays, label: 'Citas' },
  { to: '/perfil', icon: User, label: 'Mi Perfil' },
];

export function Sidebar() {
  const { user, logout } = useAuth();

  const rolLabel = user?.rol === 'Veterinario' ? 'Veterinario' : 'Propietario';

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <Stethoscope size={20} />
        </div>
        <div className="sidebar-logo-text">
          Vet<span>Vault</span>
        </div>
      </div>

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

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="avatar">
            {user?.nombre?.[0] || user?.email?.[0]?.toUpperCase() || '?'}
          </div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">
              {user?.nombre ? `${user.nombre} ${user.apellido || ''}`.trim() : user?.email}
            </div>
            <div className="sidebar-user-role">{rolLabel}</div>
          </div>
          <button
            className="sidebar-logout-btn"
            onClick={logout}
            title="Cerrar sesión"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
