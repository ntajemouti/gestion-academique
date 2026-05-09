import { useEffect, useState } from 'react';
import { UserLayout } from '@/components/UserLayout';
import { useAuth } from '@/hooks/useAuth';
import { ROUTE_PATHS } from '@/lib/index';
import { dashboardApi } from '@/api/services';
import { Link } from 'react-router-dom';
import { Calendar, ClipboardList, XCircle, Star, FileText, TrendingUp, BookOpen, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface DashboardStats {
  cours_cette_semaine: number;
  absences_ce_mois: number;
  moyenne_generale: number;
  mention: string;
  notes_count: number;
  absences: { total: number; justifiees: number; injustifiees: number; ce_mois: number };
  demandes: { total: number; en_attente: number };
  clubs_count: number;
  filiere: string | null;
  groupe: string | null;
}

export default function StagiaireDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await dashboardApi.stats();
        setStats(data);
      } catch (err) {
        console.error('Dashboard load error:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (!user || user.role !== 'Stagiaire') return null;

  const statCards = stats
    ? [
        { label: 'Cours cette semaine', value: stats.cours_cette_semaine, icon: BookOpen, color: '#2563eb' },
        { label: 'Absences ce mois', value: stats.absences_ce_mois, icon: XCircle, color: '#ef4444' },
        { label: 'Moyenne générale', value: stats.moyenne_generale?.toFixed(2) ?? '—', icon: TrendingUp, color: '#16a34a' },
        { label: 'Demandes en cours', value: stats.demandes?.en_attente ?? 0, icon: FileText, color: '#f59e0b' },
      ]
    : [];

  const quickAccessItems = [
    { title: 'Emploi du temps', description: 'Consulter mon planning', icon: Calendar, color: '#2563eb', path: ROUTE_PATHS.STAGIAIRE_EMPLOI_DU_TEMPS },
    { title: 'Mes Notes', description: 'Voir mes résultats', icon: ClipboardList, color: '#16a34a', path: ROUTE_PATHS.STAGIAIRE_NOTES },
    { title: 'Mes Absences', description: 'Suivi des absences', icon: XCircle, color: '#ef4444', path: ROUTE_PATHS.STAGIAIRE_ABSENCES },
    { title: 'Clubs', description: 'Rejoindre un club', icon: Star, color: '#f59e0b', path: ROUTE_PATHS.STAGIAIRE_CLUBS },
    { title: 'Mes Demandes', description: 'Gérer mes demandes', icon: FileText, color: '#9333ea', path: ROUTE_PATHS.STAGIAIRE_DEMANDES },
  ];

  return (
    <UserLayout currentPath={ROUTE_PATHS.STAGIAIRE_DASHBOARD}>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Mon Espace Stagiaire</h1>
          <p className="text-muted-foreground mt-2">Bienvenue sur votre tableau de bord personnel</p>
        </div>

        <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div>
                <h2 className="text-2xl font-bold text-foreground">{user.prenom} {user.nom}</h2>
                <div className="flex items-center gap-3 mt-3 flex-wrap">
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">{user.matricule}</Badge>
                  {stats?.filiere && <Badge variant="outline" className="bg-accent/10 text-accent border-accent/30">{stats.filiere}</Badge>}
                  {stats?.groupe && <Badge variant="outline" className="bg-secondary text-secondary-foreground">{stats.groupe}</Badge>}
                </div>
              </div>
              {stats && (
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">Moyenne générale</div>
                  <div className="text-3xl font-bold text-primary mt-1">{stats.moyenne_generale?.toFixed(2) ?? '—'}/20</div>
                  <Badge className="mt-2 bg-green-100 text-green-800 hover:bg-green-100">{stats.mention}</Badge>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1,2,3,4].map(i => <Card key={i} className="animate-pulse"><CardContent className="pt-6 h-24" /></Card>)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {statCards.map(stat => {
              const Icon = stat.icon;
              return (
                <Card key={stat.label} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">{stat.label}</p>
                        <p className="text-3xl font-bold text-foreground mt-2">{stat.value}</p>
                      </div>
                      <div className="p-3 rounded-xl" style={{ background: `linear-gradient(135deg, ${stat.color}15, ${stat.color}05)` }}>
                        <Icon className="w-6 h-6" style={{ color: stat.color }} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <div>
          <h2 className="text-xl font-semibold text-foreground mb-4">Accès rapide</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quickAccessItems.map(item => {
              const Icon = item.icon;
              return (
                <Link key={item.title} to={item.path}>
                  <Card className="hover:shadow-lg transition-all hover:scale-[1.02] cursor-pointer h-full">
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <div className="p-3 rounded-xl flex-shrink-0" style={{ background: `linear-gradient(135deg, ${item.color}20, ${item.color}10)` }}>
                          <Icon className="w-6 h-6" style={{ color: item.color }} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">{item.title}</h3>
                          <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>

        {stats && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                Résumé de présence
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 rounded-lg bg-muted/30">
                  <p className="text-2xl font-bold">{stats.absences.total}</p>
                  <p className="text-xs text-muted-foreground mt-1">Total absences</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-green-50">
                  <p className="text-2xl font-bold text-green-600">{stats.absences.justifiees}</p>
                  <p className="text-xs text-muted-foreground mt-1">Justifiées</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-red-50">
                  <p className="text-2xl font-bold text-red-600">{stats.absences.injustifiees}</p>
                  <p className="text-xs text-muted-foreground mt-1">Non justifiées</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-blue-50">
                  <p className="text-2xl font-bold text-blue-600">{stats.clubs_count}</p>
                  <p className="text-xs text-muted-foreground mt-1">Clubs rejoints</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </UserLayout>
  );
}
