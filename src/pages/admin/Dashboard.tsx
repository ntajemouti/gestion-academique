import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Users, BookOpen, Layers, GraduationCap, UserCheck, ClipboardList } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import api from '@/api/client';

// ── Types ──────────────────────────────────────────────────────────────────────
interface DashboardStats {
  total_users: number;
  total_stagiaires: number;
  total_formateurs: number;
  total_administrateurs: number;
  total_filieres: number;
  total_groupes: number;
  total_modules: number;
  demandes_en_attente: number;
  recent_users: RecentUser[];
}

interface RecentUser {
  id: number;
  prenom: string;
  nom: string;
  email: string;
  role: string;
  matricule: string;
  created_at: string;
}

// ── Stat card ──────────────────────────────────────────────────────────────────
interface StatCardProps {
  title: string;
  value: number | string;
  description?: string;
  icon: React.ReactNode;
  colorClass: string;
}

function StatCard({ title, value, description, icon, colorClass }: StatCardProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold mt-1">{value}</p>
            {description && (
              <p className="text-xs text-muted-foreground mt-1">{description}</p>
            )}
          </div>
          <div className={`p-3 rounded-full ${colorClass}`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Role badge ─────────────────────────────────────────────────────────────────
function RoleBadge({ role }: { role: string }) {
  const colors: Record<string, string> = {
    Administrateur: 'bg-purple-100 text-purple-800',
    Formateur:      'bg-green-100 text-green-800',
    Stagiaire:      'bg-blue-100 text-blue-800',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colors[role] ?? 'bg-gray-100 text-gray-800'}`}>
      {role}
    </span>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const { toast } = useToast();
  const [stats, setStats]     = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        // Fetch all data in parallel and compute stats client-side
        const [usersRes, filieresRes, groupesRes, modulesRes, demandesRes] = await Promise.all([
          api.get('/users/formateurs'),
          api.get('/filieres'),
          api.get('/groupes'),
          api.get('/modules'),
          api.get('/demandes').catch(() => ({ data: [] as any[] })), // optional endpoint
        ]);

        const users: any[]    = usersRes.data?.data    ?? usersRes.data    ?? [];
        const filieres: any[] = filieresRes.data?.data ?? filieresRes.data ?? [];
        const groupes: any[]  = groupesRes.data?.data  ?? groupesRes.data  ?? [];
        const modules: any[]  = modulesRes.data?.data  ?? modulesRes.data  ?? [];
        const demandes: any[] = demandesRes.data?.data ?? demandesRes.data ?? [];

        setStats({
          total_users:           users.length,
          total_stagiaires:      users.filter((u: any) => u.role === 'Stagiaire').length,
          total_formateurs:      users.filter((u: any) => u.role === 'Formateur').length,
          total_administrateurs: users.filter((u: any) => u.role === 'Administrateur').length,
          total_filieres:        filieres.length,
          total_groupes:         groupes.length,
          total_modules:         modules.length,
          demandes_en_attente:   demandes.filter((d: any) => d.statut === 'En attente').length,
          recent_users:          [...users]
            .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(0, 6),
        });
      } catch (err: any) {
        toast({
          title: 'Erreur de chargement',
          description: err.response?.data?.message || 'Impossible de charger le tableau de bord.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const currentYear = new Date().getFullYear();

  return (
    <AdminLayout currentPath="/admin/dashboard">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Tableau de bord</h1>
            <p className="text-muted-foreground mt-1">Vue d'ensemble de l'établissement</p>
          </div>
          <Badge variant="secondary" className="text-sm px-4 py-2">
            {currentYear}-{currentYear + 1}
          </Badge>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
          </div>
        ) : stats ? (
          <>
            {/* ── Stats Row 1: Users ── */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Utilisateurs</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  title="Total utilisateurs"
                  value={stats.total_users}
                  icon={<Users className="h-5 w-5 text-slate-600" />}
                  colorClass="bg-slate-100"
                />
                <StatCard
                  title="Stagiaires"
                  value={stats.total_stagiaires}
                  icon={<GraduationCap className="h-5 w-5 text-blue-600" />}
                  colorClass="bg-blue-100"
                />
                <StatCard
                  title="Formateurs"
                  value={stats.total_formateurs}
                  icon={<UserCheck className="h-5 w-5 text-green-600" />}
                  colorClass="bg-green-100"
                />
                <StatCard
                  title="Administrateurs"
                  value={stats.total_administrateurs}
                  icon={<Users className="h-5 w-5 text-purple-600" />}
                  colorClass="bg-purple-100"
                />
              </div>
            </div>

            {/* ── Stats Row 2: Structure pédagogique ── */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Structure pédagogique</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  title="Filières"
                  value={stats.total_filieres}
                  icon={<BookOpen className="h-5 w-5 text-orange-600" />}
                  colorClass="bg-orange-100"
                />
                <StatCard
                  title="Groupes"
                  value={stats.total_groupes}
                  icon={<Layers className="h-5 w-5 text-teal-600" />}
                  colorClass="bg-teal-100"
                />
                <StatCard
                  title="Modules"
                  value={stats.total_modules}
                  icon={<BookOpen className="h-5 w-5 text-indigo-600" />}
                  colorClass="bg-indigo-100"
                />
                <StatCard
                  title="Demandes en attente"
                  value={stats.demandes_en_attente}
                  description="Nécessitent une action"
                  icon={<ClipboardList className="h-5 w-5 text-red-600" />}
                  colorClass="bg-red-100"
                />
              </div>
            </div>

            {/* ── Recent Users Table ── */}
            <Card>
              <CardHeader>
                <CardTitle>Utilisateurs récemment ajoutés</CardTitle>
                <CardDescription>Les 6 derniers comptes créés dans le système</CardDescription>
              </CardHeader>
              <CardContent>
                {stats.recent_users.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Aucun utilisateur pour l'instant.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-2 font-medium text-muted-foreground">Matricule</th>
                          <th className="text-left py-3 px-2 font-medium text-muted-foreground">Nom complet</th>
                          <th className="text-left py-3 px-2 font-medium text-muted-foreground">Email</th>
                          <th className="text-left py-3 px-2 font-medium text-muted-foreground">Rôle</th>
                          <th className="text-left py-3 px-2 font-medium text-muted-foreground">Date création</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.recent_users.map((user) => (
                          <tr key={user.id} className="border-b last:border-0 hover:bg-muted/40 transition-colors">
                            <td className="py-3 px-2 font-mono text-xs">{user.matricule}</td>
                            <td className="py-3 px-2 font-medium">{user.prenom} {user.nom}</td>
                            <td className="py-3 px-2 text-muted-foreground">{user.email}</td>
                            <td className="py-3 px-2"><RoleBadge role={user.role} /></td>
                            <td className="py-3 px-2 text-muted-foreground">
                              {new Date(user.created_at).toLocaleDateString('fr-FR', {
                                day: '2-digit', month: 'short', year: 'numeric',
                              })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        ) : null}
      </div>
    </AdminLayout>
  );
}