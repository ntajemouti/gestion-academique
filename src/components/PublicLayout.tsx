import { useState, useEffect } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { GraduationCap, Menu, X } from 'lucide-react';
import { ROUTE_PATHS } from '@/lib/index';
import { Button } from '@/components/ui/button';

interface PublicLayoutProps {
  children: React.ReactNode;
}

export function PublicHeader() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { label: 'Accueil', path: ROUTE_PATHS.HOME },
    { label: 'À propos', path: '#about' },
    { label: 'Formations', path: '#filieres' },
    { label: 'Clubs', path: '#clubs' },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
        isScrolled ? 'bg-white shadow-md' : 'bg-white'
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to={ROUTE_PATHS.HOME} className="flex items-center gap-2">
            <GraduationCap className="w-8 h-8 text-primary" />
            <span className="text-2xl font-bold text-primary">MyISTA</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              item.path.startsWith('#') ? (
                <a
                  key={item.path}
                  href={item.path}
                  className="text-foreground hover:text-primary transition-colors font-medium"
                >
                  {item.label}
                </a>
              ) : (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `text-foreground hover:text-primary transition-colors font-medium ${
                      isActive ? 'text-primary' : ''
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              )
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link to={ROUTE_PATHS.LOGIN}>Se connecter</Link>
            </Button>
            <Button asChild>
              <Link to={ROUTE_PATHS.SIGNUP}>S'inscrire</Link>
            </Button>
          </div>

          <button
            className="md:hidden text-foreground"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <nav className="flex flex-col gap-4">
              {navItems.map((item) => (
                item.path.startsWith('#') ? (
                  <a
                    key={item.path}
                    href={item.path}
                    className="text-foreground hover:text-primary transition-colors font-medium"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item.label}
                  </a>
                ) : (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      `text-foreground hover:text-primary transition-colors font-medium ${
                        isActive ? 'text-primary' : ''
                      }`
                    }
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item.label}
                  </NavLink>
                )
              ))}
              <div className="flex flex-col gap-2 pt-4 border-t border-border">
                <Button variant="ghost" asChild className="w-full">
                  <Link to={ROUTE_PATHS.LOGIN}>Se connecter</Link>
                </Button>
                <Button asChild className="w-full">
                  <Link to={ROUTE_PATHS.SIGNUP}>S'inscrire</Link>
                </Button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}

export function PublicFooter() {
  return (
    <footer className="bg-card border-t border-border mt-24">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <Link to={ROUTE_PATHS.HOME} className="flex items-center gap-2 mb-4">
              <GraduationCap className="w-8 h-8 text-primary" />
              <span className="text-2xl font-bold text-primary">MyISTA</span>
            </Link>
            <p className="text-muted-foreground">
              Plateforme de gestion académique et administrative pour votre institut de formation.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-foreground mb-4">Liens rapides</h3>
            <ul className="space-y-2">
              <li>
                <a href="#filieres" className="text-muted-foreground hover:text-primary transition-colors">
                  Formations
                </a>
              </li>
              <li>
                <a href="#clubs" className="text-muted-foreground hover:text-primary transition-colors">
                  Clubs
                </a>
              </li>
              <li>
                <a href="#contact" className="text-muted-foreground hover:text-primary transition-colors">
                  Contact
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-foreground mb-4">Contact</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li>Email: contact@myista.ma</li>
              <li>Tél: +212 5XX-XXXXXX</li>
              <li>Adresse: Casablanca, Maroc</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-8 text-center text-muted-foreground">
          <p>© 2026 MyISTA Services. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  );
}

export function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <PublicHeader />
      <main className="flex-1 pt-16">{children}</main>
      <PublicFooter />
    </div>
  );
}
