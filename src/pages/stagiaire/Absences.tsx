import { useMemo } from 'react';
import { UserLayout } from '@/components/UserLayout';
import { useAuth } from '@/hooks/useAuth';
import { mockAbsences, mockModules } from '@/data/index';
import { formatDate } from '@/lib/index';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CalendarX, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';

export default function StagiaireAbsences() {
  const { user } = useAuth();

  const userAbsences = useMemo(() => {
    if (!user) return [];
    return mockAbsences.filter((abs) => abs.stagiaireId === user.id);
  }, [user]);

  const stats = useMemo(() => {
    const total = userAbsences.length;
    const justifiees = userAbsences.filter((abs) => abs.justifiee).length;
    const nonJustifiees = total - justifiees;
    const tauxPresence = total > 0 ? ((1 - total / 100) * 100).toFixed(1) : '100.0';

    return {
      total,
      justifiees,
      nonJustifiees,
      tauxPresence: parseFloat(tauxPresence),
    };
  }, [userAbsences]);

  const getModuleName = (moduleId: string): string => {
    const module = mockModules.find((m) => m.id === moduleId);
    return module ? module.nom : 'Module inconnu';
  };

  const showAlert = stats.nonJustifiees >= 3;

  return (
    <UserLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Mes Absences</h1>
          <p className="text-muted-foreground mt-2">
            Consultez votre historique d'absences et votre taux de présence
          </p>
        </div>

        {showAlert && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Attention</AlertTitle>
            <AlertDescription>
              Vous avez {stats.nonJustifiees} absence(s) non justifiée(s). Veuillez régulariser votre situation auprès de l'administration.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Absences</CardTitle>
              <CalendarX className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Ce semestre
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Justifiées</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.justifiees}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Avec justificatif
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Non Justifiées</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.nonJustifiees}</div>
              <p className="text-xs text-muted-foreground mt-1">
                À régulariser
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Taux de Présence</CardTitle>
            <CardDescription>
              Votre assiduité globale ce semestre
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold text-foreground">{stats.tauxPresence}%</span>
              <Badge variant={stats.tauxPresence >= 90 ? 'default' : stats.tauxPresence >= 80 ? 'secondary' : 'destructive'}>
                {stats.tauxPresence >= 90 ? 'Excellent' : stats.tauxPresence >= 80 ? 'Bien' : 'À améliorer'}
              </Badge>
            </div>
            <Progress value={stats.tauxPresence} className="h-2" />
            <p className="text-sm text-muted-foreground">
              Un taux de présence minimum de 80% est requis pour valider le semestre
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Historique des Absences</CardTitle>
            <CardDescription>
              Liste complète de vos absences enregistrées
            </CardDescription>
          </CardHeader>
          <CardContent>
            {userAbsences.length === 0 ? (
              <div className="text-center py-12">
                <CalendarX className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Aucune absence enregistrée</p>
                <p className="text-sm text-muted-foreground mt-1">Continuez votre excellent travail !</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-semibold text-sm">Date</th>
                      <th className="text-left py-3 px-4 font-semibold text-sm">Module</th>
                      <th className="text-left py-3 px-4 font-semibold text-sm">Justifiée</th>
                      <th className="text-left py-3 px-4 font-semibold text-sm">Motif</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userAbsences.map((absence, index) => (
                      <tr
                        key={absence.id}
                        className={index % 2 === 0 ? 'bg-muted/5' : ''}
                      >
                        <td className="py-3 px-4 text-sm">{formatDate(absence.date)}</td>
                        <td className="py-3 px-4 text-sm font-medium">{getModuleName(absence.moduleId)}</td>
                        <td className="py-3 px-4">
                          <Badge
                            variant={absence.justifiee ? 'default' : 'destructive'}
                            className="text-xs"
                          >
                            {absence.justifiee ? 'OUI' : 'NON'}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">
                          {absence.motif || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </UserLayout>
  );
}