'use client';

import {
  Link,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import {
  Bell,
  CalendarDays,
  ChevronDown,
  CircleDollarSign,
  ClipboardList,
  Home,
  LayoutGrid,
  Menu,
  Package,
  RefreshCcw,
  Search,
  ShieldAlert,
  ShieldCheck,
  UserRound,
  UsersRound,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDemo } from '@/stores/demo-store';

const nav = [
  { to: '/app', label: 'Inicio', icon: Home },
  { to: '/explore', label: 'Explorar', icon: Search },
  { to: '/my-items', label: 'Mis objetos', icon: Package },
  { to: '/requests', label: 'Solicitudes', icon: ClipboardList },
  { to: '/reservations', label: 'Reservas', icon: LayoutGrid },
  { to: '/loans', label: 'Préstamos', icon: UsersRound },
  { to: '/calendar', label: 'Calendario', icon: CalendarDays },
  { to: '/transactions', label: 'Transacciones', icon: CircleDollarSign },
  { to: '/incidents', label: 'Incidencias', icon: ShieldAlert },
  { to: '/notifications', label: 'Notificaciones', icon: Bell },
  { to: '/profile', label: 'Perfil', icon: UserRound },
];

export function AppShell() {
  const { state, switchUser, resetDemo, logout } = useDemo();
  const navigate = useNavigate();
  const location = useLocation();
  const current = state.users.find((user) => user.id === state.currentUserId)!;
  const unread = state.notifications.filter(
    (item) => item.userId === current.id && !item.read,
  ).length;
  const showDemoControls = process.env.NODE_ENV !== 'production';
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link to="/app" className="brand">
          <span className="brand-mark">
            <ShieldCheck />
          </span>
          <span>LendUp</span>
        </Link>
        <nav aria-label="Navegación principal">
          {nav.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                isActive ? 'nav-link active' : 'nav-link'
              }
            >
              <Icon />
              {label}
              {label === 'Notificaciones' && unread > 0 && (
                <span className="nav-count">{unread}</span>
              )}
            </NavLink>
          ))}
          {current.role === 'ADMIN' && (
            <NavLink
              to="/admin/incidents"
              className={({ isActive }) =>
                isActive ? 'nav-link active' : 'nav-link'
              }
            >
              <ShieldCheck />
              Administración
            </NavLink>
          )}
        </nav>
        {showDemoControls && (
          <div className="demo-panel">
            <p>Entorno demo</p>
            <label htmlFor="demo-user">Ver como</label>
            <div className="select-wrap">
              <select
                id="demo-user"
                value={current.id}
                onChange={(event) => {
                  switchUser(event.target.value);
                  navigate(
                    event.target.value === 'admin'
                      ? '/admin/incidents'
                      : '/app',
                  );
                }}
              >
                <option value="alexandra">Alexandra · prestataria</option>
                <option value="carlos">Carlos · prestamista</option>
                <option value="admin">Administrador LendUp</option>
              </select>
              <ChevronDown />
            </div>
            <button type="button" onClick={resetDemo}>
              <RefreshCcw />
              Restablecer demo
            </button>
          </div>
        )}
      </aside>
      <div className="app-main">
        <header className="topbar">
          <Link to="/app" className="mobile-brand">
            <span className="brand-mark">
              <ShieldCheck />
            </span>
            LendUp
          </Link>
          <div className="top-search">
            <Search />
            <input
              aria-label="Buscar en LendUp"
              placeholder="Buscar objetos, préstamos…"
              onKeyDown={(event) => {
                if (event.key === 'Enter')
                  navigate(
                    `/explore?q=${encodeURIComponent(event.currentTarget.value)}`,
                  );
              }}
            />
          </div>
          <div className="top-actions">
            <Button
              variant="ghost"
              size="icon"
              render={<Link to="/notifications" />}
              aria-label={`${unread} notificaciones`}
            >
              <Bell />
              {unread > 0 && (
                <span className="notification-count">{unread}</span>
              )}
            </Button>
            <Link to="/profile" className="header-user">
              {current.avatar ? (
                <img className="avatar" src={current.avatar} alt="" />
              ) : (
                <span className="avatar">{current.initials}</span>
              )}
              <span>
                <strong>{current.firstName}</strong>
                <small>{current.university}</small>
              </span>
            </Link>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                logout();
                navigate('/login');
              }}
            >
              Salir
            </Button>
          </div>
        </header>
        <main className="content" key={location.pathname}>
          <Outlet />
        </main>
      </div>
      <nav className="mobile-nav" aria-label="Navegación móvil">
        {nav
          .slice(0, 2)
          .concat(nav.slice(5, 6), nav.slice(9, 10))
          .map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to}>
              <Icon />
              <span>{label}</span>
            </NavLink>
          ))}
        <button type="button" onClick={() => navigate('/profile')}>
          <Menu />
          <span>Menú</span>
        </button>
      </nav>
    </div>
  );
}
