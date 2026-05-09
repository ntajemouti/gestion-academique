import { useEffect, useState } from 'react';
import { UserLayout } from '@/components/UserLayout';
import { emploisApi } from '@/api/services';
import { ROUTE_PATHS } from '@/lib/index';
import { Calendar, Clock, MapPin, Users, BookOpen, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const JOURS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'] as const;
const HEURES = ['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00'];

interface Creneau {
  id: number;
  jour: string;
  heure_debut: string;
  heure_fin: string;
  salle: string;
  module: { id: number; code: string; nom: string; filiere?: { nom: string; color?: string } } | null;
  groupe:   { id: number; nom: string } | null;
}

function getCurrentDay() {
  return ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'][new Date().getDay()];
}

// Summary stats from schedule
function buildStats(creneaux: Creneau[]) {
  const groupes = new Set(creneaux.map(c => c.groupe?.id).filter(Boolean));
  const modules = new Set(creneaux.map(c => c.module?.id).filter(Boolean));
  const heuresTotal = creneaux.length * 2; // assume 2h/slot avg; adjust if needed
  return { groupes: groupes.size, modules: modules.size, seances: creneaux.length };
}

export default function FormateurEmploiDuTemps() {
  const currentDay = getCurrentDay();
  const [schedule, setSchedule] = useState<Record<string, Creneau[]>>({});
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    emploisApi.list()
      .then(({ data }) => {
        // API returns { Lundi: [...], Mardi: [...], ... } already scoped to logged-in formateur
        setSchedule(data ?? {});
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const allCreneaux: Creneau[] = Object.values(schedule).flat();
  const stats = buildStats(allCreneaux);

  const getSlot = (jour: string, heure: string) =>
    (schedule[jour] ?? []).find(c => c.heure_debut === heure);

  const todayCreneaux = schedule[currentDay] ?? [];

  if (loading) {
    return (
      <UserLayout currentPath={ROUTE_PATHS.FORMATEUR_EMPLOI_DU_TEMPS}>
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </UserLayout>
    );
  }

  return (
    <UserLayout currentPath={ROUTE_PATHS.FORMATEUR_EMPLOI_DU_TEMPS}>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
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

        {/* Quick stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-blue-100">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Séances / semaine</p>
                  <p className="text-2xl font-bold">{stats.seances}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-green-100">
                  <Users className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Groupes</p>
                  <p className="text-2xl font-bold">{stats.groupes}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-purple-100">
                  <Calendar className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Modules enseignés</p>
                  <p className="text-2xl font-bold">{stats.modules}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Today highlight */}
        {JOURS.includes(currentDay as any) && (
          <Card className="border-primary/40 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <Clock className="w-5 h-5" />
                Aujourd'hui — {currentDay}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {todayCreneaux.length === 0 ? (
                <p className="text-muted-foreground text-sm">Pas de cours aujourd'hui.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {todayCreneaux.map(slot => {
                    const color = slot.module?.filiere?.color ?? '#2563eb';
                    return (
                      <div
                        key={slot.id}
                        className="rounded-lg p-4 text-white shadow-sm"
                        style={{ backgroundColor: color }}
                      >
                        <p className="font-bold text-sm">{slot.module?.nom ?? 'Module'}</p>
                        <p className="text-xs opacity-90 font-mono mt-1">{slot.module?.code}</p>
                        <div className="mt-2 space-y-1 text-xs opacity-90">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {slot.heure_debut} – {slot.heure_fin}
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {slot.groupe?.nom ?? '—'}
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {slot.salle}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* ── Desktop weekly grid ── */}
        <div className="hidden lg:block">
          <Card className="overflow-hidden">
            <div className="grid grid-cols-7 border-b">
              <div className="p-4 bg-muted/40 border-r font-semibold text-sm text-center">Horaires</div>
              {JOURS.map(jour => (
                <div
                  key={jour}
                  className={`p-4 text-center font-semibold text-sm border-r last:border-r-0 ${
                    jour === currentDay ? 'bg-primary/10 text-primary' : 'bg-muted/30'
                  }`}
                >
                  {jour}
                  {jour === currentDay && (
                    <Badge variant="default" className="ml-2 text-xs">Aujourd'hui</Badge>
                  )}
                </div>
              ))}
            </div>

            <div className="divide-y">
              {HEURES.slice(0, -1).map((heure) => (
                <div key={heure} className="grid grid-cols-7 min-h-[90px]">
                  {/* Time label */}
                  <div className="p-3 bg-muted/10 border-r flex items-center justify-center">
                    <span className="text-xs font-medium text-muted-foreground">
                      {heure}
                    </span>
                  </div>

                  {/* Day cells */}
                  {JOURS.map(jour => {
                    const slot = getSlot(jour, heure);
                    const color = slot?.module?.filiere?.color ?? '#64748b';
                    return (
                      <div
                        key={`${jour}-${heure}`}
                        className={`p-1.5 border-r last:border-r-0 ${jour === currentDay ? 'bg-primary/5' : ''}`}
                      >
                        {slot ? (
                          <div
                            className="h-full rounded-md p-2 text-white shadow-sm hover:shadow-md transition-shadow"
                            style={{ backgroundColor: color }}
                          >
                            <p className="font-semibold text-xs leading-tight">{slot.module?.nom ?? 'Module'}</p>
                            <p className="text-xs opacity-80 font-mono mt-0.5">{slot.module?.code}</p>
                            <div className="mt-1 space-y-0.5 text-xs opacity-80">
                              <div className="flex items-center gap-1">
                                <Users className="w-2.5 h-2.5 flex-shrink-0" />
                                <span className="truncate">{slot.groupe?.nom ?? '—'}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <MapPin className="w-2.5 h-2.5 flex-shrink-0" />
                                <span>{slot.salle}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="w-2.5 h-2.5 flex-shrink-0" />
                                <span>{slot.heure_debut}–{slot.heure_fin}</span>
                              </div>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* ── Mobile daily cards ── */}
        <div className="lg:hidden space-y-4">
          {JOURS.map(jour => {
            const daySlots = schedule[jour] ?? [];
            const isToday  = jour === currentDay;
            return (
              <Card key={jour} className={isToday ? 'border-primary border-2' : ''}>
                <div className={`p-4 border-b font-semibold flex items-center justify-between ${isToday ? 'bg-primary text-primary-foreground' : 'bg-muted/30'}`}>
                  <span>{jour}</span>
                  {isToday && <Badge variant="secondary" className="text-xs">Aujourd'hui</Badge>}
                </div>
                <div className="p-4 space-y-3">
                  {daySlots.length === 0 ? (
                    <p className="text-muted-foreground text-sm text-center py-3">Pas de cours</p>
                  ) : (
                    daySlots.map(slot => {
                      const color = slot.module?.filiere?.color ?? '#64748b';
                      return (
                        <div key={slot.id} className="rounded-lg p-4 text-white" style={{ backgroundColor: color }}>
                          <p className="font-bold">{slot.module?.nom ?? 'Module'}</p>
                          <p className="text-xs opacity-80 font-mono">{slot.module?.code}</p>
                          <div className="mt-2 space-y-1 text-sm opacity-90">
                            <div className="flex items-center gap-2"><Clock className="w-4 h-4" />{slot.heure_debut} – {slot.heure_fin}</div>
                            <div className="flex items-center gap-2"><Users className="w-4 h-4" />{slot.groupe?.nom ?? '—'}</div>
                            <div className="flex items-center gap-2"><MapPin className="w-4 h-4" />{slot.salle}</div>
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

        {/* Empty state */}
        {allCreneaux.length === 0 && (
          <Card>
            <CardContent className="py-16 text-center text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-40" />
              <p className="text-lg font-medium">Aucun créneau planifié</p>
              <p className="text-sm mt-2">L'administrateur n'a pas encore créé votre emploi du temps.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </UserLayout>
  );
}
