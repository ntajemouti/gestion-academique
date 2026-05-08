import { UserLayout } from '@/components/UserLayout';
import { useAuth } from '@/hooks/useAuth';
import { ROUTE_PATHS, calculateMoyenne, getMention } from '@/lib/index';
import { mockFilieres, mockGroupes, mockModules, mockNotes, mockAbsences, mockDemandes, mockEmploisDuTemps, mockActivities } from '@/data/index';
import { Link } from 'react-router-dom';
import { Calendar, ClipboardList, XCircle, Star, FileText, TrendingUp, BookOpen, Users, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function StagiaireDashboard() {
  const { user } = useAuth();

  if (!user || user.role !== 'Stagiaire') {
    return null;
  }

  const filiere = mockFilieres.find((f) => f.id === user.filiereId);
  const groupe = mockGroupes.find((g) => g.id === user.groupeId);

  const userNotes = mockNotes.filter((n) => n.stagiaireId === user.id);
  const moyenne = calculateMoyenne(userNotes);
  const mention = getMention(moyenne);

  const userAbsences = mockAbsences.filter((a) => a.stagiaireId === user.id);
  const absencesThisMonth = userAbsences.filter((a) => {
    const date = new Date(a.date);
    const now = new Date();
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  });

  const userDemandes = mockDemandes.filter((d) => d.userId === user.id);
  const demandesEnCours = userDemandes.filter((d) => d.statut === 'En attente');

  const userEmplois = mockEmploisDuTemps.filter((e) => e.groupeId === user.groupeId);
  const coursThisSemaine = userEmplois.length;

  const recentActivities = mockActivities.filter((a) => a.stagiaire === `${user.prenom} ${user.nom}`).slice(0, 5);

  const stats = [
    {
      label: 'Cours cette semaine',
      value: coursThisSemaine,
      icon: BookOpen,
      color: '#2563eb',
    },
    {
      label: 'Absences ce mois',
      value: absencesThisMonth.length,
      icon: XCircle,
      color: '#ef4444',
    },
    {
      label: 'Moyenne générale',
      value: moyenne.toFixed(2),
      icon: TrendingUp,
      color: '#16a34a',
    },
    {
      label: 'Demandes en cours',
      value: demandesEnCours.length,
      icon: FileText,
      color: '#f59e0b',
    },
  ];

  const quickAccessItems = [
    {
      title: 'Emploi du temps',
      description: 'Consulter mon planning',
      icon: Calendar,
      color: '#2563eb',
      path: ROUTE_PATHS.STAGIAIRE_EMPLOI_DU_TEMPS,
    },
    {
      title: 'Mes Notes',
      description: 'Voir mes résultats',
      icon: ClipboardList,
      color: '#16a34a',
      path: ROUTE_PATHS.STAGIAIRE_NOTES,
    },
    {
      title: 'Mes Absences',
      description: 'Suivi des absences',
      icon: XCircle,
      color: '#ef4444',
      path: ROUTE_PATHS.STAGIAIRE_ABSENCES,
    },
    {
      title: 'Clubs',
      description: 'Rejoindre un club',
      icon: Star,
      color: '#f59e0b',
      path: ROUTE_PATHS.STAGIAIRE_CLUBS,
    },
    {
      title: 'Mes Demandes',
      description: 'Gérer mes demandes',
      icon: FileText,
      color: '#9333ea',
      path: ROUTE_PATHS.STAGIAIRE_DEMANDES,
    },
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
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold text-foreground">
                  {user.prenom} {user.nom}
                </h2>
                <div className="flex items-center gap-3 mt-3">
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                    {user.matricule}
                  </Badge>
                  {filiere && (
                    <Badge variant="outline" className="bg-accent/10 text-accent border-accent/30">
                      {filiere.nom}
                    </Badge>
                  )}
                  {groupe && (
                    <Badge variant="outline" className="bg-secondary text-secondary-foreground">
                      {groupe.nom}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-muted-foreground">Moyenne générale</div>
                <div className="text-3xl font-bold text-primary mt-1">{moyenne.toFixed(2)}/20</div>
                <Badge className="mt-2 bg-green-100 text-green-800 hover:bg-green-100">{mention}</Badge>
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
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                      <p className="text-3xl font-bold text-foreground mt-2">{stat.value}</p>
                    </div>
                    <div
                      className="p-3 rounded-xl"
                      style={{
                        background: `linear-gradient(135deg, ${stat.color}15, ${stat.color}05)`,
                      }}
                    >
                      <Icon className="w-6 h-6" style={{ color: stat.color }} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div>
          <h2 className="text-xl font-semibold text-foreground mb-4">Accès rapide</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quickAccessItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.title} to={item.path}>
                  <Card className="hover:shadow-lg transition-all hover:scale-[1.02] cursor-pointer h-full">
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <div
                          className="p-3 rounded-xl flex-shrink-0"
                          style={{
                            background: `linear-gradient(135deg, ${item.color}20, ${item.color}10)`,
                          }}
                        >
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

        {recentActivities.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                Activités récentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between py-3 border-b last:border-0">
                    <div>
                      <p className="font-medium text-foreground">{activity.activite}</p>
                      <p className="text-sm text-muted-foreground">{activity.filiere}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">{new Date(activity.date).toLocaleDateString('fr-FR')}</p>
                      <Badge variant="outline" className="mt-1">
                        {activity.type}
                      </Badge>
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