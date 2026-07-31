import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarDays, Clock, GalleryHorizontal, Home, LayoutDashboard, LogOut, Menu, Scissors, UserRound, Users, X } from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useAdminAuth } from '../../hooks/useAdminAuth';

const navItems = [
  { label: 'Visão geral', path: '/admin', icon: LayoutDashboard, exact: true },
  { label: 'Agenda', path: '/admin/agenda', icon: CalendarDays },
  { label: 'Agendamentos', path: '/admin/agendamentos', icon: Clock },
  { label: 'Serviços e preços', path: '/admin/servicos', icon: Scissors },
  { label: 'Horários', path: '/admin/horarios', icon: CalendarDays },
  { label: 'Bloqueios', path: '/admin/bloqueios', icon: X },
  { label: 'Galeria', path: '/admin/galeria', icon: GalleryHorizontal },
  { label: 'Clientes', path: '/admin/clientes', icon: Users },
  { label: 'Perfil', path: '/admin/perfil', icon: UserRound },
];

const titleMap = new Map(navItems.map((item) => [item.path, item.label]));

export function AdminLayout({ children }: { children: ReactNode }) {
  const { signOut, session } = useAdminAuth();
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('adminSidebarCollapsed') === 'true');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const location = useLocation();
  const title = useMemo(() => titleMap.get(location.pathname) || 'Painel administrativo', [location.pathname]);

  function toggleCollapsed() {
    setCollapsed((current) => {
      localStorage.setItem('adminSidebarCollapsed', String(!current));
      return !current;
    });
  }

  return (
    <div className={`admin-shell ${collapsed ? 'is-collapsed' : ''}`}>
      {drawerOpen ? <button className="admin-drawer-backdrop mobile-only" type="button" aria-label="Fechar menu" onClick={() => setDrawerOpen(false)} /> : null}
      <aside className={`admin-sidebar ${drawerOpen ? 'is-open' : ''}`}>
        <div className="admin-sidebar-top">
          <Link to="/admin" className="admin-brand">
            <Scissors size={22} />
            <span>Barbearia Elite</span>
          </Link>
          <button type="button" className="admin-icon-button mobile-only" aria-label="Fechar menu" onClick={() => setDrawerOpen(false)}>
            <X size={18} />
          </button>
        </div>
        <nav aria-label="Navegação administrativa">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                exact={item.exact}
                activeClassName="is-active"
                title={collapsed ? item.label : undefined}
                onClick={() => setDrawerOpen(false)}
              >
                <Icon size={19} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
        <button type="button" className="admin-nav-button" onClick={() => void signOut()}>
          <LogOut size={19} />
          <span>Sair</span>
        </button>
      </aside>

      <div className="admin-main-shell">
        <header className="admin-header">
          <div>
            <button type="button" className="admin-icon-button mobile-only" aria-label="Abrir menu" aria-expanded={drawerOpen} onClick={() => setDrawerOpen(true)}>
              <Menu size={18} />
            </button>
            <button type="button" className="admin-icon-button desktop-only" aria-label="Recolher sidebar" aria-expanded={!collapsed} onClick={toggleCollapsed}>
              <Menu size={18} />
            </button>
          </div>
          <div className="admin-header-title">
            <span>Admin / {title}</span>
            <h1>{title}</h1>
          </div>
          <div className="admin-header-actions">
            <label className="admin-search">
              <span>Busca</span>
              <input type="search" placeholder="Buscar..." />
            </label>
            <span className="admin-date">{format(new Date(), "dd 'de' MMMM", { locale: ptBR })}</span>
            <a className="admin-button secondary" href="/" target="_blank" rel="noopener noreferrer">
              <Home size={17} />
              Site
            </a>
            <div className="admin-avatar" aria-label="Usuário administrativo">
              {(session?.user.email || 'AD').slice(0, 2).toUpperCase()}
            </div>
          </div>
        </header>
        <main className="admin-content">{children}</main>
      </div>
    </div>
  );
}
