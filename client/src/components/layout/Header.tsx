import { CalendarDays, Menu, Moon, Scissors, Sun, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { navigationItems } from '../../data/navigation';

type HeaderProps = {
  theme: string;
  onToggleTheme: () => void;
};

export function Header({ theme, onToggleTheme }: HeaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState('#home');

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 24);
      let current = navigationItems[0];
      navigationItems.forEach((item) => {
        const element = document.querySelector(item.href);
        if (element && element.getBoundingClientRect().top <= 130) {
          current = item;
        }
      });
      setActive(current?.href || '#home');
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const closeMenu = () => setIsOpen(false);

  return (
    <header className={`site-header ${scrolled ? 'is-scrolled' : ''}`}>
      <a className="skip-link" href="#main">
        Pular para o conteúdo
      </a>
      <div className="header-shell">
        <a className="brand" href="#home" onClick={closeMenu}>
          <Scissors size={22} />
          <span>Barbearia Elite</span>
        </a>
        <nav className={`nav-links ${isOpen ? 'is-open' : ''}`} aria-label="Navegação principal">
          {navigationItems.map((item) => (
            <a key={item.href} href={item.href} aria-current={active === item.href ? 'page' : undefined} onClick={closeMenu}>
              {item.label}
            </a>
          ))}
        </nav>
        <div className="header-actions">
          <a className="btn btn-primary header-cta" href="#booking">
            <CalendarDays size={18} />
            Agendar horário
          </a>
          <button className="icon-button" type="button" onClick={onToggleTheme} aria-label="Alternar tema">
            {theme === 'dark' ? <Sun size={19} /> : <Moon size={19} />}
          </button>
          <button className="icon-button menu-button" type="button" aria-label={isOpen ? 'Fechar menu' : 'Abrir menu'} aria-expanded={isOpen} onClick={() => setIsOpen((value) => !value)}>
            {isOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>
    </header>
  );
}
