import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
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
} from 'lucide-react';
import { ROUTE_PATHS } from '@/lib/index';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

interface UserLayoutProps {
  children: React.ReactNode;
  currentPath?: string;
}

const stagiaireNavItems = [
  {
    label: 'Tableau de bord',
    path: ROUTE_PATHS.STAGIAIRE_DASHBOARD,
    icon: LayoutDashboard,
  },
  {
    label: 'Emploi du temps',
    path: ROUTE_PATHS.STAGIAIRE_EMPLOI_DU_TEMPS,
    icon: Calendar,
  },
  {
    label: 'Notes',
    path: ROUTE_PATHS.STAGIAIRE_NOTES,
    icon: ClipboardList,
  },
  {
    label: 'Absences',
    path: ROUTE_PATHS.STAGIAIRE_ABSENCES,
    icon: CalendarX,
  },
  {
    label: 'Clubs',
    path: ROUTE_PATHS.STAGIAIRE_CLUBS,
    icon: Star,
  },
  {
    label: 'Mes Demandes',
    path: ROUTE_PATHS.STAGIAIRE_DEMANDES,
    icon: FileText,
  },
];

const formateurNavItems = [
  {
    label: 'Tableau de bord',
    path: ROUTE_PATHS.FORMATEUR_DASHBOARD,
    icon: LayoutDashboard,
  },
  {
    label: 'Mes Modules',
    path: ROUTE_PATHS.FORMATEUR_MES_MODULES,
    icon: BookOpen,
  },
  {
    label: 'Emploi du temps',
    path: ROUTE_PATHS.STAGIAIRE_EMPLOI_DU_TEMPS,
    icon: Calendar,
  },
  {
    label: 'Absences Stagiaires',
    path: ROUTE_PATHS.FORMATEUR_ABSENCES_STAGIAIRES,
    icon: CalendarX,
  },
  {
    label: 'Notes Stagiaires',
    path: ROUTE_PATHS.FORMATEUR_NOTES_STAGIAIRES,
    icon: ClipboardList,
  },
  {
    label: 'Demandes',
    path: ROUTE_PATHS.STAGIAIRE_DEMANDES,
    icon: FileText,
  },
];

export function UserLayout({ children, currentPath }: UserLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { user, isFormateur } = useAuth();

  const activePath = currentPath || location.pathname;
  const navItems = isFormateur ? formateurNavItems : stagiaireNavItems;

  const getInitials = (prenom: string, nom: string) => {
    return `${prenom.charAt(0)}${nom.charAt(0)}`.toUpperCase();
  };

  const getRoleBadgeColor = () => {
    return isFormateur ? 'bg-green-100 text-green-800' : 'bg-primary/10 text-primary';
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

            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {user ? getInitials(user.prenom, user.nom) : 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:block">
                <p className="text-sm font-medium text-foreground">
                  {user ? `${user.prenom} ${user.nom}` : 'Utilisateur'}
                </p>
                <Badge className={`text-xs ${getRoleBadgeColor()}`}>
                  {user?.role || 'Utilisateur'}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </header>

      <aside
        className={`fixed top-16 left-0 bottom-0 w-64 bg-card border-r border-border transition-transform duration-200 z-40 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        <nav className="p-4 space-y-1">
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
