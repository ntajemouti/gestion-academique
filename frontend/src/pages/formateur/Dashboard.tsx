import { useEffect, useState } from 'react';
import { UserLayout } from '@/components/UserLayout';
import { useAuth } from '@/hooks/useAuth';
import { ROUTE_PATHS } from '@/lib/index';
import { dashboardApi } from '@/api/services';
import { Link } from 'react-router-dom';
import { BookOpen, Calendar, ClipboardList, FileText, Users, CalendarX, TrendingUp, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Module { id: number; code: string; nom: string; coefficient: number; heures_par_semaine: number; filiere?: { nom: string; code: string; color: string } }
interface FormateurStats {
  mes_modules: number;
  total_stagiaires: number;
  absences_ce_mois: number;
  demandes_en_attente: number;
  absences: { total: number; cette_semaine: number; ce_mois: number };
  notes_saisies: number;
  stagiaires_concernes: number;
  recent_absences: Array<{ id: number; stagiaire: string; module: string; date: string; justifiee: boolean; type: string }>;
  modules: Module[];
}

export default function FormateurDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<FormateurStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardApi.stats()
      .then(({ data }) => setStats(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (!user) return null;

  const statCards = stats ? [
    { label: 'Modules enseignés', value: stats.mes_modules, icon: BookOpen, color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: 'Stagiaires total', value: stats.total_stagiaires, icon: Users, color: 'text-green-600', bg: 'bg-green-100' },
    { label: 'Absences ce mois', value: stats.absences_ce_mois, icon: CalendarX, color: 'text-orange-600', bg: 'bg-orange-100' },
    { label: 'Demandes à traiter', value: stats.demandes_en_attente, icon: FileText, color: 'text-purple-600', bg: 'bg-purple-100' },
  ] : [];

  const quickAccess = [
    { title: 'Mes Modules', description: "Consulter les modules que j'enseigne", icon: BookOpen, path: ROUTE_PATHS.FORMATEUR_MES_MODULES, color: 'text-blue-600', bg: 'bg-blue-50' },
    { title: 'Emploi du temps', description: 'Voir mon planning de cours', icon: Calendar, path: ROUTE_PATHS.FORMATEUR_DASHBOARD, color: 'text-green-600', bg: 'bg-green-50' },
    { title: 'Absences à saisir', description: 'Gérer les absences des stagiaires', icon: CalendarX, path: ROUTE_PATHS.FORMATEUR_ABSENCES_STAGIAIRES, color: 'text-orange-600', bg: 'bg-orange-50' },
    { title: 'Notes à saisir', description: 'Saisir et consulter les notes', icon: ClipboardList, path: ROUTE_PATHS.FORMATEUR_NOTES_STAGIAIRES, color: 'text-purple-600', bg: 'bg-purple-50' },
  ];

  return (
    <UserLayout currentPath={ROUTE_PATHS.FORMATEUR_DASHBOARD}>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Espace Formateur</h1>
          <p className="text-muted-foreground mt-2">Bienvenue dans votre espace personnel</p>
        </div>

        <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-foreground">{user.prenom} {user.nom}</h2>
                <p className="text-muted-foreground">{(user as any).specialite || 'Formateur'}</p>
                <Badge className="mt-2 bg-green-100 text-green-800 hover:bg-green-100">Actif</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {statCards.map(stat => {
              const Icon = stat.icon;
              return (
                <Card key={stat.label} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">{stat.label}</p>
                        <p className="text-3xl font-bold text-foreground mt-2">{stat.value}</p>
                      </div>
                      <div className={`h-12 w-12 rounded-xl ${stat.bg} flex items-center justify-center`}>
                        <Icon className={`h-6 w-6 ${stat.color}`} />
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickAccess.map(item => {
              const Icon = item.icon;
              return (
                <Link key={item.title} to={item.path}>
                  <Card className={`${item.bg} border-none hover:shadow-lg transition-all hover:scale-105 cursor-pointer h-full`}>
                    <CardContent className="pt-6">
                      <div className="flex flex-col items-center text-center gap-3">
                        <div className="h-14 w-14 rounded-xl bg-white/80 flex items-center justify-center">
                          <Icon className={`h-7 w-7 ${item.color}`} />
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

        {stats && stats.recent_absences.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Activités récentes dans mes modules
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.recent_absences.map(activity => (
                  <div key={activity.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{activity.stagiaire}</p>
                      <p className="text-sm text-muted-foreground">{activity.module}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge className={activity.justifiee ? 'bg-green-100 text-green-800 hover:bg-green-100' : 'bg-red-100 text-red-800 hover:bg-red-100'}>
                        {activity.type}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {new Date(activity.date).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </UserLayout>
  );
}
