import { useState, useRef, useEffect } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { LayoutDashboard, PawPrint, CalendarDays, User, LogOut, ChevronRight, Settings } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { cn } from '../../utils/cn';

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
    <aside className="fixed top-0 left-0 w-64 h-screen z-40 flex flex-col border-r border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl transition-transform duration-300 -translate-x-full md:translate-x-0">
      {/* Logo */}
      <div className="flex items-center px-6 pt-6 pb-2">
        <div className="font-heading font-extrabold text-2xl text-slate-900 dark:text-slate-100 tracking-tight">
          Vet<span className="bg-gradient-to-r from-sky-500 to-emerald-500 bg-clip-text text-transparent">Vault</span>
        </div>
      </div>

      <div className="h-px bg-slate-200/70 dark:bg-slate-800 mx-6 my-4" />

      {/* Nav */}
      <nav className="flex-1 px-4 py-1 flex flex-col gap-1 overflow-y-auto">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-3 py-2">
          Menú Principal
        </span>
        {navItems(user).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 font-semibold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-slate-800/60'
              )
            }
          >
            <item.icon size={20} className="flex-shrink-0 opacity-80" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer Profile */}
      <div className="relative p-4 border-t border-slate-200/70 dark:border-slate-800" ref={menuRef}>
        {isMenuOpen && (
          <div className="absolute bottom-18 left-4 right-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-1.5 flex flex-col gap-1 z-50 backdrop-blur-xl animate-slide-down">
            <Link
              to="/perfil"
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              <Settings size={16} />
              <span>Configuración</span>
            </Link>
            <button
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors w-full text-left cursor-pointer"
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
          type="button"
          className={cn(
            'flex items-center justify-between w-full p-2 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850/60 hover:bg-white dark:hover:bg-slate-800/80 hover:border-sky-400/50 transition-all cursor-pointer',
            isMenuOpen && 'border-sky-500 bg-white dark:bg-slate-800 shadow-sm'
          )}
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          <div
            className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-emerald-500 flex items-center justify-center text-white overflow-hidden flex-shrink-0"
            style={
              hasFoto
                ? {
                    backgroundImage: `url(${user?.foto_url})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }
                : undefined
            }
          >
            {!hasFoto && <User size={16} />}
          </div>

          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate flex-1 mx-2 text-left">
            Mi Cuenta
          </span>

          <ChevronRight
            size={16}
            className={cn(
              'text-slate-400 transition-transform duration-200',
              isMenuOpen && 'rotate-90 text-slate-700 dark:text-slate-200'
            )}
          />
        </button>
      </div>
    </aside>
  );
}
