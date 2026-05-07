import { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { GraduationCap, Menu, X, LogOut, ChevronDown, LayoutDashboard } from 'lucide-react';
import { ROUTE_PATHS } from '@/lib/index';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/context/AuthContext';

interface PublicLayoutProps {
  children: React.ReactNode;
}

export function PublicHeader() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { label: 'Accueil',    path: ROUTE_PATHS.HOME },
    { label: 'À propos',   path: '#about' },
    { label: 'Formations', path: '#filieres' },
    { label: 'Clubs',      path: '#clubs' },
  ];

  const initials = user
    ? `${user.prenom.charAt(0)}${user.nom.charAt(0)}`.toUpperCase()
    : '';

  const fullName = user ? `${user.prenom} ${user.nom}` : '';

  const dashboardPath =
    user?.role === 'Administrateur'
      ? ROUTE_PATHS.ADMIN_DASHBOARD
      : user?.role === 'Formateur'
      ? ROUTE_PATHS.FORMATEUR_DASHBOARD
      : ROUTE_PATHS.STAGIAIRE_DASHBOARD;

  const roleBadgeClass =
    user?.role === 'Administrateur'
      ? 'bg-red-100 text-red-800'
      : user?.role === 'Formateur'
      ? 'bg-green-100 text-green-800'
      : 'bg-primary/10 text-primary';

  const handleLogout = async () => {
    await logout();
    navigate(ROUTE_PATHS.LOGIN, { replace: true });
  };

  // ── Right-side slot: auth buttons OR user dropdown ────────────
  const AuthSlot = () => {
    if (loading) return <div className="w-24 h-8 bg-muted animate-pulse rounded-lg" />;

    if (user) {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-muted transition-colors focus:outline-none">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium text-foreground leading-tight">{fullName}</p>
                <Badge className={`text-xs mt-0.5 ${roleBadgeClass}`}>{user.role}</Badge>
              </div>
              <ChevronDown className="hidden sm:inline w-4 h-4 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <p className="font-semibold text-foreground">{fullName}</p>
              <p className="text-xs text-muted-foreground font-normal">{user.email}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate(dashboardPath)} className="cursor-pointer">
              <LayoutDashboard className="w-4 h-4 mr-2" />
              Mon tableau de bord
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Se déconnecter
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }

    return (
      <div className="flex items-center gap-4">
        <Button variant="ghost" asChild>
          <Link to={ROUTE_PATHS.LOGIN}>Se connecter</Link>
        </Button>
        <Button asChild>
          <Link to={ROUTE_PATHS.SIGNUP}>S'inscrire</Link>
        </Button>
      </div>
    );
  };

  // ── Mobile auth slot ──────────────────────────────────────────
  const MobileAuthSlot = () => {
    if (loading) return null;

    if (user) {
      return (
        <div className="flex flex-col gap-2 pt-4 border-t border-border">
          <div className="flex items-center gap-3 px-1 py-2">
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">{fullName}</p>
              <Badge className={`text-xs ${roleBadgeClass}`}>{user.role}</Badge>
            </div>
          </div>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => { navigate(dashboardPath); setIsMobileMenuOpen(false); }}
          >
            <LayoutDashboard className="w-4 h-4 mr-2" />
            Mon tableau de bord
          </Button>
          <Button
            variant="destructive"
            className="w-full"
            onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Se déconnecter
          </Button>
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-2 pt-4 border-t border-border">
        <Button variant="ghost" asChild className="w-full">
          <Link to={ROUTE_PATHS.LOGIN} onClick={() => setIsMobileMenuOpen(false)}>
            Se connecter
          </Link>
        </Button>
        <Button asChild className="w-full">
          <Link to={ROUTE_PATHS.SIGNUP} onClick={() => setIsMobileMenuOpen(false)}>
            S'inscrire
          </Link>
        </Button>
      </div>
    );
  };

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
            {navItems.map((item) =>
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
            )}
          </nav>

          {/* Desktop auth slot */}
          <div className="hidden md:flex items-center">
            <AuthSlot />
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
              {navItems.map((item) =>
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
              )}
              <MobileAuthSlot />
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