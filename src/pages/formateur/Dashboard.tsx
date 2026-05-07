import { UserLayout } from '@/components/UserLayout';
import { useAuth } from '@/hooks/useAuth';
import { ROUTE_PATHS } from '@/lib/index';
import { mockModules, mockAbsences, mockDemandes, mockUsers, mockGroupes } from '@/data/index';
import { Link } from 'react-router-dom';
import { BookOpen, Calendar, ClipboardList, FileText, Users, CalendarX, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function FormateurDashboard() {
  const { user } = useAuth();

  if (!user) return null;

  const formateurModules = mockModules.filter((m) => m.formateurId === user.id);
  const totalStagiaires = formateurModules.reduce((sum, module) => {
    const groupesWithModule = mockGroupes.filter((g) => g.filiereId === module.filiereId);
    return sum + groupesWithModule.reduce((gSum, g) => gSum + g.nombreStagiaires, 0);
  }, 0);

  const currentMonth = new Date().getMonth();
  const absencesThisMonth = mockAbsences.filter(
    (a) => a.formateurId === user.id && new Date(a.date).getMonth() === currentMonth
  ).length;

  const demandesEnAttente = mockDemandes.filter((d) => d.statut === 'En attente').length;

  const stats = [
    {
      label: 'Modules enseignés',
      value: formateurModules.length,
      icon: BookOpen,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      label: 'Stagiaires total',
      value: totalStagiaires,
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      label: 'Absences ce mois',
      value: absencesThisMonth,
      icon: CalendarX,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
    {
      label: 'Demandes à traiter',
      value: demandesEnAttente,
      icon: FileText,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
  ];

  const quickAccessItems = [
    {
      title: 'Mes Modules',
      description: 'Consulter les modules que j\'enseigne',
      icon: BookOpen,
      path: ROUTE_PATHS.FORMATEUR_MES_MODULES,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Emploi du temps',
      description: 'Voir mon planning de cours',
      icon: Calendar,
      path: ROUTE_PATHS.FORMATEUR_DASHBOARD,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Absences à saisir',
      description: 'Gérer les absences des stagiaires',
      icon: CalendarX,
      path: ROUTE_PATHS.FORMATEUR_ABSENCES_STAGIAIRES,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      title: 'Notes à saisir',
      description: 'Saisir et consulter les notes',
      icon: ClipboardList,
      path: ROUTE_PATHS.FORMATEUR_NOTES_STAGIAIRES,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
  ];

  const recentActivities = mockAbsences
    .filter((a) => a.formateurId === user.id)
    .slice(0, 5)
    .map((absence) => {
      const stagiaire = mockUsers.find((u) => u.id === absence.stagiaireId);
      const module = mockModules.find((m) => m.id === absence.moduleId);
      return {
        id: absence.id,
        stagiaire: stagiaire ? `${stagiaire.prenom} ${stagiaire.nom}` : 'Inconnu',
        module: module?.nom || 'Module inconnu',
        type: absence.justifiee ? 'Absence justifiée' : 'Absence non justifiée',
        date: absence.date,
        justifiee: absence.justifiee,
      };
    });

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
                <h2 className="text-2xl font-semibold text-foreground">
                  {user.prenom} {user.nom}
                </h2>
                <p className="text-muted-foreground">{user.specialite || 'Formateur'}</p>
                <Badge className="mt-2 bg-green-100 text-green-800 hover:bg-green-100">Actif</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                      <p className="text-3xl font-bold text-foreground mt-2">{stat.value}</p>
                    </div>
                    <div className={`h-12 w-12 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                      <Icon className={`h-6 w-6 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div>
          <h2 className="text-xl font-semibold text-foreground mb-4">Accès rapide</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickAccessItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.title} to={item.path}>
                  <Card className={`${item.bgColor} border-none hover:shadow-lg transition-all hover:scale-105 cursor-pointer h-full`}>
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

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Activités récentes dans mes modules
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivities.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">Aucune activité récente</p>
            ) : (
              <div className="space-y-4">
                {recentActivities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{activity.stagiaire}</p>
                      <p className="text-sm text-muted-foreground">{activity.module}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge
                        className={`${
                          activity.justifiee
                            ? 'bg-green-100 text-green-800 hover:bg-green-100'
                            : 'bg-red-100 text-red-800 hover:bg-red-100'
                        }`}
                      >
                        {activity.type}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {new Date(activity.date).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </UserLayout>
  );
}
