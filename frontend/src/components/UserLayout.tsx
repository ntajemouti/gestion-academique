import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  ClipboardList,
  CalendarX,
  Star,
  FileText,
  BookOpen,
  Menu,
  X,
  Bell,
  Search,
  GraduationCap,
  LogOut,
  ChevronDown,
} from 'lucide-react';
import { ROUTE_PATHS } from '@/lib/index';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

interface UserLayoutProps {
  children: React.ReactNode;
  currentPath?: string;
}

const stagiaireNavItems = [
  { label: 'Tableau de bord',  path: ROUTE_PATHS.STAGIAIRE_DASHBOARD,      icon: LayoutDashboard },
  { label: 'Emploi du temps',  path: ROUTE_PATHS.STAGIAIRE_EMPLOI_DU_TEMPS, icon: Calendar },
  { label: 'Notes',            path: ROUTE_PATHS.STAGIAIRE_NOTES,           icon: ClipboardList },
  { label: 'Absences',         path: ROUTE_PATHS.STAGIAIRE_ABSENCES,        icon: CalendarX },
  { label: 'Clubs',            path: ROUTE_PATHS.STAGIAIRE_CLUBS,           icon: Star },
  { label: 'Mes Demandes',     path: ROUTE_PATHS.STAGIAIRE_DEMANDES,        icon: FileText },
];

const formateurNavItems = [
  { label: 'Tableau de bord',       path: ROUTE_PATHS.FORMATEUR_DASHBOARD,           icon: LayoutDashboard },
  { label: 'Mes Modules',           path: ROUTE_PATHS.FORMATEUR_MES_MODULES,         icon: BookOpen },
  { label: 'Emploi du temps',       path: ROUTE_PATHS.FORMATEUR_EMPLOI_DU_TEMPS,     icon: Calendar },
  { label: 'Absences Stagiaires',   path: ROUTE_PATHS.FORMATEUR_ABSENCES_STAGIAIRES, icon: CalendarX },
  { label: 'Notes Stagiaires',      path: ROUTE_PATHS.FORMATEUR_NOTES_STAGIAIRES,    icon: ClipboardList },
  { label: 'Mes Demandes',          path: ROUTE_PATHS.FORMATEUR_DEMANDES,            icon: FileText },
];

export function UserLayout({ children, currentPath }: UserLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location  = useLocation();
  const navigate  = useNavigate();
  const { user, logout } = useAuth();

  const isFormateur = user?.role === 'Formateur';
  const activePath  = currentPath || location.pathname;
  const navItems    = isFormateur ? formateurNavItems : stagiaireNavItems;

  const initials = user
    ? `${user.prenom.charAt(0)}${user.nom.charAt(0)}`.toUpperCase()
    : 'U';

  const fullName = user ? `${user.prenom} ${user.nom}` : 'Utilisateur';

  const roleBadgeClass = isFormateur
    ? 'bg-green-100 text-green-800'
    : 'bg-primary/10 text-primary';

  const handleLogout = async () => {
    await logout();
    navigate(ROUTE_PATHS.HOME, { replace: true });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 left-0 right-0 h-16 bg-card border-b border-border z-50">
        <div className="h-full flex items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>

            <Link to={ROUTE_PATHS.HOME} className="flex items-center gap-2">
              <GraduationCap className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold text-foreground">MyISTA</span>
            </Link>
          </div>

          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Rechercher..."
                className="pl-10 bg-muted border-0"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 h-2 w-2 bg-destructive rounded-full" />
            </Button>

            {/* ── User dropdown ──────────────────────────────────── */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-muted transition-colors focus:outline-none">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-medium text-foreground leading-tight">{fullName}</p>
                    <Badge className={`text-xs mt-0.5 ${roleBadgeClass}`}>
                      {user?.role || 'Utilisateur'}
                    </Badge>
                  </div>
                  <ChevronDown className="hidden md:inline h-4 w-4 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <p className="font-semibold text-foreground">{fullName}</p>
                  <p className="text-xs text-muted-foreground font-normal">{user?.email}</p>
                  <p className="text-xs text-muted-foreground font-normal">
                    Matricule: {user?.matricule}
                  </p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Se déconnecter
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <aside
        className={`fixed top-16 left-0 bottom-0 w-64 bg-card border-r border-border transition-transform duration-200 z-40 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        <nav className="p-4 space-y-1 pb-20">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePath === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* ── Sidebar bottom: logout ─────────────────────────── */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
          >
            <LogOut className="h-5 w-5" />
            <span className="font-medium">Se déconnecter</span>
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <main className="pt-16 lg:pl-64">
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}