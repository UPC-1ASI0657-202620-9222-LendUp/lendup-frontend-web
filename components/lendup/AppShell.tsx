'use client';

import { useState } from 'react';
import {
  Link,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import {
  AlertTriangle,
  Bell,
  CalendarDays,
  CircleDollarSign,
  ClipboardList,
  Home,
  LayoutGrid,
  LogOut,
  Menu,
  Package,
  Search,
  ShieldAlert,
  ShieldCheck,
  UserRound,
  UsersRound,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Brand } from '@/components/lendup/Brand';
import { LanguageSwitcher } from '@/components/lendup/LanguageSwitcher';
import { Avatar } from '@/components/lendup/shared';
import { useI18n, type MessageKey } from '@/lib/i18n';
import { findUniversity } from '@/services/catalog.service';
import { useLendUp } from '@/hooks/use-lendup';
import { currentUserOf, termsAcceptedBy } from '@/stores/selectors';
import type { Role } from '@/types/domain';

interface NavItem {
  to: string;
  label: MessageKey;
  icon: LucideIcon;
}
interface NavGroup {
  label: MessageKey;
  items: NavItem[];
}

const navigation: Record<Role, NavGroup[]> = {
  STUDENT: [
    {
      label: 'nav.groups.main',
      items: [
        { to: '/app', label: 'nav.home', icon: Home },
        { to: '/explore', label: 'nav.explore', icon: Search },
        { to: '/my-items', label: 'nav.myItems', icon: Package },
      ],
    },
    {
      label: 'nav.groups.operations',
      items: [
        { to: '/requests', label: 'nav.requests', icon: ClipboardList },
        { to: '/reservations', label: 'nav.reservations', icon: LayoutGrid },
        { to: '/loans', label: 'nav.loans', icon: UsersRound },
        { to: '/calendar', label: 'nav.calendar', icon: CalendarDays },
      ],
    },
    {
      label: 'nav.groups.account',
      items: [
        {
          to: '/transactions',
          label: 'nav.transactions',
          icon: CircleDollarSign,
        },
        { to: '/incidents', label: 'nav.incidents', icon: ShieldAlert },
        { to: '/notifications', label: 'nav.notifications', icon: Bell },
        { to: '/profile', label: 'nav.profile', icon: UserRound },
      ],
    },
  ],
  ADMIN: [
    {
      label: 'nav.groups.admin',
      items: [
        { to: '/app', label: 'nav.home', icon: Home },
        {
          to: '/admin/incidents',
          label: 'nav.adminIncidents',
          icon: ShieldCheck,
        },
        { to: '/notifications', label: 'nav.notifications', icon: Bell },
        { to: '/profile', label: 'nav.profile', icon: UserRound },
      ],
    },
  ],
};

const mobilePrimary: Record<Role, string[]> = {
  STUDENT: ['/app', '/explore', '/loans', '/notifications'],
  ADMIN: ['/app', '/admin/incidents', '/notifications'],
};

export function AppShell() {
  const { state, logout } = useLendUp();
  const { t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState('');
  const current = currentUserOf(state);
  if (!current) return null;

  const groups = navigation[current.role];
  const items = groups.flatMap((group) => group.items);
  const unread = state.notifications.filter(
    (item) => item.userId === current.id && !item.read,
  ).length;
  const university = findUniversity(current.universityId);
  const needsVerification = current.role === 'STUDENT' && !current.verified;
  const needsTerms =
    current.role === 'STUDENT' && !termsAcceptedBy(state, current.id);

  const renderLink = (
    { to, label, icon: Icon }: NavItem,
    onClick?: () => void,
  ) => (
    <NavLink
      key={to}
      to={to}
      end={to === '/app'}
      onClick={onClick}
      className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
    >
      <Icon aria-hidden="true" />
      <span>{t(label)}</span>
      {to === '/notifications' && unread > 0 && (
        <span
          className="nav-count"
          aria-label={t('nav.unreadCount', { count: unread })}
        >
          {unread}
        </span>
      )}
    </NavLink>
  );

  const signOut = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        {t('common.skipToContent')}
      </a>
      <aside className="sidebar">
        <Brand to="/app" tone="light" label={t('nav.brandHome')} />
        <nav aria-label={t('nav.main')}>
          {groups.map((group) => (
            <div className="nav-group" key={group.label}>
              <p className="nav-group-label">{t(group.label)}</p>
              {group.items.map((item) => renderLink(item))}
            </div>
          ))}
        </nav>
      </aside>
      <div className="app-main">
        <header className="topbar">
          <Brand to="/app" label={t('nav.brandHome')} />
          {current.role === 'STUDENT' && (
            <search className="top-search">
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  navigate(`/explore?q=${encodeURIComponent(query.trim())}`);
                }}
              >
                <Search aria-hidden="true" />
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  aria-label={t('nav.searchLabel')}
                  placeholder={t('nav.searchPlaceholder')}
                />
              </form>
            </search>
          )}
          <div className="top-actions">
            <LanguageSwitcher />
            <Link
              to="/notifications"
              className="icon-button"
              aria-label={t('nav.notificationsWithCount', { count: unread })}
            >
              <Bell aria-hidden="true" />
              {unread > 0 && (
                <span className="notification-count">{unread}</span>
              )}
            </Link>
            <Link to="/profile" className="header-user">
              <Avatar user={current} />
              <span>
                <strong>{current.firstName}</strong>
                <small>
                  {university?.shortName ?? t(`roles.${current.role}`)}
                </small>
              </span>
            </Link>
            <button
              type="button"
              className="icon-button"
              onClick={signOut}
              aria-label={t('nav.signOut')}
            >
              <LogOut aria-hidden="true" />
            </button>
          </div>
        </header>
        <main
          id="main-content"
          className="content"
          key={location.pathname}
          tabIndex={-1}
        >
          {needsVerification && (
            <div className="app-banner warning">
              <AlertTriangle aria-hidden="true" />
              <p>{t('banners.verification')}</p>
              <Button
                size="sm"
                variant="outline"
                render={<Link to="/verify-email" />}
              >
                {t('banners.verificationAction')}
              </Button>
            </div>
          )}
          {!needsVerification && needsTerms && (
            <div className="app-banner info">
              <ShieldCheck aria-hidden="true" />
              <p>{t('banners.terms')}</p>
              <Button size="sm" variant="outline" render={<Link to="/terms" />}>
                {t('banners.termsAction')}
              </Button>
            </div>
          )}
          <Outlet />
        </main>
      </div>
      <nav className="mobile-nav" aria-label={t('nav.mobile')}>
        {items
          .filter((item) => mobilePrimary[current.role].includes(item.to))
          .map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} end={to === '/app'}>
              <Icon aria-hidden="true" />
              <span>{t(label)}</span>
              {to === '/notifications' && unread > 0 && (
                <span className="mobile-count">{unread}</span>
              )}
            </NavLink>
          ))}
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          aria-expanded={menuOpen}
        >
          <Menu aria-hidden="true" />
          <span>{t('nav.menu')}</span>
        </button>
      </nav>
      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent
          side="bottom"
          className="mobile-menu-sheet"
          closeLabel={t('common.close')}
        >
          <SheetHeader>
            <SheetTitle>{t('nav.menuTitle')}</SheetTitle>
            <SheetDescription>{t('nav.menuDescription')}</SheetDescription>
          </SheetHeader>
          <nav aria-label={t('nav.mobileSecondary')}>
            {items.map((item) => renderLink(item, () => setMenuOpen(false)))}
          </nav>
          <div className="mobile-menu-footer">
            <LanguageSwitcher />
            <Button type="button" variant="outline" onClick={signOut}>
              <LogOut aria-hidden="true" />
              {t('nav.signOut')}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
