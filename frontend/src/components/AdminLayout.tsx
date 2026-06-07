import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
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
  LogOut,
  ChevronDown,
  CheckCheck,
} from 'lucide-react';
import { ROUTE_PATHS } from '@/lib/index';
import { useAuth } from '@/context/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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

// Admin notifications — static, extend with real API later
const ADMIN_NOTIFICATIONS = [
  { id: 1, text: 'Nouvelle demande en attente d\'approbation.', time: 'Il y a 5 min', read: false },
  { id: 2, text: 'Un nouvel utilisateur s\'est inscrit.', time: 'Il y a 1h', read: false },
  { id: 3, text: 'L\'emploi du temps du groupe A1 a été modifié.', time: 'Hier', read: true },
];

export function AdminLayout({ children, currentPath }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // BUG 4 FIX: search state
  const [searchQuery, setSearchQuery] = useState('');
  // BUG 3 FIX: notification state
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState(ADMIN_NOTIFICATIONS);

  const location = useLocation();
  const navigate  = useNavigate();
  const { user, logout } = useAuth();
  const activePath = currentPath || location.pathname;

  const unreadCount = notifications.filter(n => !n.read).length;

  const initials = user
    ? `${user.prenom.charAt(0)}${user.nom.charAt(0)}`.toUpperCase()
    : 'A';

  const fullName = user ? `${user.prenom} ${user.nom}` : 'Administrateur';

  const handleLogout = async () => {
    await logout();
    navigate(ROUTE_PATHS.HOME, { replace: true });
  };

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  // BUG 4 FIX: filter nav by search
  const filteredNavItems = searchQuery.trim()
    ? navItems.filter(item =>
        item.label.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : navItems;

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

          {/* BUG 4 FIX: search with onChange */}
          <div className="hidden md:flex items-center flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Rechercher dans le menu..."
                className="w-full pl-10 pr-4 py-2 bg-muted border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* BUG 3 FIX: Notification dropdown with working onClick */}
            <DropdownMenu open={notifOpen} onOpenChange={setNotifOpen}>
              <DropdownMenuTrigger asChild>
                <button className="relative p-2 hover:bg-muted rounded-lg transition-colors">
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-destructive text-destructive-foreground text-xs font-semibold rounded-full flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <div className="flex items-center justify-between px-3 py-2 border-b">
                  <span className="font-semibold text-sm">Notifications</span>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="text-xs text-primary hover:underline flex items-center gap-1"
                    >
                      <CheckCheck className="w-3 h-3" /> Tout marquer lu
                    </button>
                  )}
                </div>
                {notifications.map(n => (
                  <div
                    key={n.id}
                    className={`px-3 py-3 border-b last:border-b-0 cursor-pointer hover:bg-muted/50 transition-colors ${!n.read ? 'bg-primary/5' : ''}`}
                    onClick={() => setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x))}
                  >
                    <div className="flex items-start gap-2">
                      {!n.read && <span className="mt-1.5 h-2 w-2 rounded-full bg-primary flex-shrink-0" />}
                      <div className={!n.read ? '' : 'ml-4'}>
                        <p className="text-sm leading-tight">{n.text}</p>
                        <p className="text-xs text-muted-foreground mt-1">{n.time}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* ── User dropdown ─────────────────────────────────── */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-muted transition-colors focus:outline-none">
                  <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-semibold text-sm">
                    {initials}
                  </div>
                  <span className="hidden sm:inline text-sm font-medium">{fullName}</span>
                  <ChevronDown className="hidden sm:inline w-4 h-4 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel>
                  <p className="font-semibold text-foreground">{fullName}</p>
                  <p className="text-xs text-muted-foreground font-normal">{user?.email}</p>
                </DropdownMenuLabel>
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
          </div>
        </div>
      </header>

      <aside
        className={`fixed top-16 left-0 bottom-0 w-64 bg-card border-r border-border z-40 transition-transform duration-200 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        {/* BUG 4 FIX: mobile search in sidebar */}
        <div className="p-4 border-b md:hidden">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Rechercher..."
              className="w-full pl-10 pr-4 py-2 bg-muted border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-sm"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <nav className="p-4 space-y-1">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePath === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => { setSidebarOpen(false); setSearchQuery(''); }}
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
          {filteredNavItems.length === 0 && searchQuery && (
            <p className="text-sm text-muted-foreground px-4 py-3">Aucun résultat pour « {searchQuery} »</p>
          )}
        </nav>

        {/* ── Sidebar bottom: logout ──────────────────────────── */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
          >
            <LogOut className="w-5 h-5" />
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

      <main className="pt-16 lg:ml-64 min-h-screen">
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
