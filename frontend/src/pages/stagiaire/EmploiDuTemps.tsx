import { UserLayout } from '@/components/UserLayout';
import { useAuth } from '@/hooks/useAuth';
import { mockEmploisDuTemps, mockModules, mockUsers, mockFilieres } from '@/data/index';
import { ROUTE_PATHS } from '@/lib/index';
import { Calendar, Clock, MapPin, User } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const JOURS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'] as const;
const HEURES = ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00'];

function getCurrentDay(): string {
  const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  return days[new Date().getDay()];
}

export default function StagiaireEmploiDuTemps() {
  const { user } = useAuth();
  const currentDay = getCurrentDay();

  const userSchedule = mockEmploisDuTemps.filter(
    (edt) => edt.groupeId === user?.groupeId
  );

  const getModuleInfo = (moduleId: string) => {
    const module = mockModules.find((m) => m.id === moduleId);
    const formateur = mockUsers.find((u) => u.id === module?.formateurId);
    const filiere = mockFilieres.find((f) => f.id === module?.filiereId);
    return { module, formateur, filiere };
  };

  const getScheduleForDay = (jour: string) => {
    return userSchedule.filter((edt) => edt.jour === jour);
  };

  return (
    <UserLayout currentPath={ROUTE_PATHS.STAGIAIRE_EMPLOI_DU_TEMPS}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Mon Emploi du Temps</h1>
            <p className="text-muted-foreground mt-1">
              Semaine du {new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <Badge variant="outline" className="text-sm px-3 py-1">
            <Calendar className="w-4 h-4 mr-2" />
            Année 2025-2026
          </Badge>
        </div>

        <div className="hidden lg:block">
          <Card className="overflow-hidden">
            <div className="grid grid-cols-7 border-b">
              <div className="p-4 bg-muted/30 border-r font-semibold text-sm">
                Horaires
              </div>
              {JOURS.map((jour) => (
                <div
                  key={jour}
                  className={`p-4 text-center font-semibold text-sm border-r last:border-r-0 ${
                    jour === currentDay ? 'bg-primary/10 text-primary' : 'bg-muted/30'
                  }`}
                >
                  {jour}
                  {jour === currentDay && (
                    <Badge variant="default" className="ml-2 text-xs">
                      Aujourd'hui
                    </Badge>
                  )}
                </div>
              ))}
            </div>

            <div className="divide-y">
              {HEURES.map((heure, idx) => (
                <div key={heure} className="grid grid-cols-7 min-h-[100px]">
                  <div className="p-4 bg-muted/10 border-r flex items-center justify-center">
                    <div className="text-sm font-medium text-muted-foreground">
                      <Clock className="w-4 h-4 inline mr-1" />
                      {heure}
                    </div>
                  </div>
                  {JOURS.map((jour) => {
                    const daySchedule = getScheduleForDay(jour);
                    const slot = daySchedule.find(
                      (s) => s.heureDebut === heure
                    );

                    if (!slot) {
                      return (
                        <div
                          key={`${jour}-${heure}`}
                          className={`p-2 border-r last:border-r-0 ${
                            jour === currentDay ? 'bg-primary/5' : ''
                          }`}
                        />
                      );
                    }

                    const { module, formateur, filiere } = getModuleInfo(slot.moduleId);

                    return (
                      <div
                        key={`${jour}-${heure}`}
                        className={`p-2 border-r last:border-r-0 ${
                          jour === currentDay ? 'bg-primary/5' : ''
                        }`}
                      >
                        <div
                          className="h-full rounded-lg p-3 text-white shadow-sm transition-all hover:shadow-md"
                          style={{ backgroundColor: filiere?.color || '#64748b' }}
                        >
                          <div className="font-semibold text-sm mb-1">
                            {module?.nom || 'Module'}
                          </div>
                          <div className="text-xs opacity-90 space-y-1">
                            <div className="flex items-center">
                              <User className="w-3 h-3 mr-1" />
                              {formateur?.prenom} {formateur?.nom}
                            </div>
                            <div className="flex items-center">
                              <MapPin className="w-3 h-3 mr-1" />
                              {slot.salle}
                            </div>
                            <div className="flex items-center">
                              <Clock className="w-3 h-3 mr-1" />
                              {slot.heureDebut} - {slot.heureFin}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="lg:hidden space-y-4">
          {JOURS.map((jour) => {
            const daySchedule = getScheduleForDay(jour);
            const isToday = jour === currentDay;

            return (
              <Card key={jour} className={isToday ? 'border-primary' : ''}>
                <div
                  className={`p-4 border-b font-semibold ${
                    isToday ? 'bg-primary text-primary-foreground' : 'bg-muted/30'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{jour}</span>
                    {isToday && (
                      <Badge variant="secondary" className="text-xs">
                        Aujourd'hui
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  {daySchedule.length === 0 ? (
                    <p className="text-muted-foreground text-sm text-center py-4">
                      Aucun cours prévu
                    </p>
                  ) : (
                    daySchedule.map((slot) => {
                      const { module, formateur, filiere } = getModuleInfo(slot.moduleId);

                      return (
                        <div
                          key={slot.id}
                          className="rounded-lg p-4 text-white shadow-sm"
                          style={{ backgroundColor: filiere?.color || '#64748b' }}
                        >
                          <div className="font-semibold mb-2">{module?.nom || 'Module'}</div>
                          <div className="text-sm opacity-90 space-y-1">
                            <div className="flex items-center">
                              <Clock className="w-4 h-4 mr-2" />
                              {slot.heureDebut} - {slot.heureFin}
                            </div>
                            <div className="flex items-center">
                              <User className="w-4 h-4 mr-2" />
                              {formateur?.prenom} {formateur?.nom}
                            </div>
                            <div className="flex items-center">
                              <MapPin className="w-4 h-4 mr-2" />
                              {slot.salle}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </UserLayout>
  );
}
