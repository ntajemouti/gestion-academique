import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  GraduationCap,
  Users,
  UserCog,
  FileText,
  CalendarX,
  ClipboardList,
  Star,
  Calendar,
  Search,
  Bell,
  Menu,
  X,
} from 'lucide-react';
import { ROUTE_PATHS } from '@/lib/index';

interface AdminLayoutProps {
  children: React.ReactNode;
  currentPath?: string;
}

const navItems = [
  { label: 'Tableau de bord', path: ROUTE_PATHS.ADMIN_DASHBOARD, icon: LayoutDashboard },
  { label: 'Modules', path: ROUTE_PATHS.ADMIN_MODULES, icon: BookOpen },
  { label: 'Filières', path: ROUTE_PATHS.ADMIN_FILIERES, icon: GraduationCap },
  { label: 'Groupes', path: ROUTE_PATHS.ADMIN_GROUPES, icon: Users },
  { label: 'Utilisateurs', path: ROUTE_PATHS.ADMIN_UTILISATEURS, icon: UserCog },
  { label: 'Demandes', path: ROUTE_PATHS.ADMIN_DEMANDES, icon: FileText },
  { label: 'Absences', path: ROUTE_PATHS.ADMIN_ABSENCES, icon: CalendarX },
  { label: 'Notes', path: ROUTE_PATHS.ADMIN_NOTES, icon: ClipboardList },
  { label: 'Clubs', path: ROUTE_PATHS.ADMIN_CLUBS, icon: Star },
  { label: 'Emplois du temps', path: ROUTE_PATHS.ADMIN_EMPLOIS_DU_TEMPS, icon: Calendar },
];

export function AdminLayout({ children, currentPath }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const activePath = currentPath || location.pathname;

  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 left-0 right-0 h-16 bg-card border-b border-border z-50">
        <div className="h-full flex items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 hover:bg-muted rounded-lg transition-colors"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <Link to={ROUTE_PATHS.ADMIN_DASHBOARD} className="flex items-center gap-2">
              <GraduationCap className="w-8 h-8 text-primary" />
              <span className="text-xl font-bold text-primary">MyISTA</span>
            </Link>
          </div>

          <div className="hidden md:flex items-center flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Rechercher..."
                className="w-full pl-10 pr-4 py-2 bg-muted border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="relative p-2 hover:bg-muted rounded-lg transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-xs font-semibold rounded-full flex items-center justify-center">
                3
              </span>
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-semibold">
                A
              </div>
              <span className="hidden sm:inline text-sm font-medium">Admin</span>
            </div>
          </div>
        </div>
      </header>

      <aside
        className={`fixed top-16 left-0 bottom-0 w-64 bg-card border-r border-border z-40 transition-transform duration-200 ${
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
                <Icon className="w-5 h-5" />
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

      <main className="pt-16 lg:ml-64 min-h-screen">
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
