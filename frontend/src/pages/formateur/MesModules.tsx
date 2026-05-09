import { useEffect, useState } from 'react';
import { UserLayout } from '@/components/UserLayout';
import { modulesApi, usersApi } from '@/api/services';
import { ROUTE_PATHS } from '@/lib/index';
import { BookOpen, Users, Clock, Award, ChevronRight, X, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Module {
  id: number;
  code: string;
  nom: string;
  coefficient: number;
  heures_par_semaine: number;
  filiere?: { id: number; nom: string; color?: string };
}

interface Stagiaire {
  id: number;
  prenom: string;
  nom: string;
  matricule: string;
  groupe?: { id: number; nom: string };
  groupe_id?: number;
}

export default function FormateurMesModules() {
  const [modules,  setModules]  = useState<Module[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [selected, setSelected] = useState<Module | null>(null);
  const [stagiairesMap, setStagiairesMap] = useState<Record<number, Stagiaire[]>>({});
  const [loadingStagiaires, setLoadingStagiaires] = useState(false);

  useEffect(() => {
    modulesApi.list()
      .then(({ data }) => setModules(Array.isArray(data) ? data : data.data ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleOpen = async (mod: Module) => {
    setSelected(mod);
    if (!stagiairesMap[mod.id] && mod.filiere?.id) {
      setLoadingStagiaires(true);
      try {
        const { data } = await usersApi.stagiaires({ filiere_id: mod.filiere.id });
        setStagiairesMap(prev => ({ ...prev, [mod.id]: Array.isArray(data) ? data : data.data ?? [] }));
      } catch (err) { console.error(err); }
      finally { setLoadingStagiaires(false); }
    }
  };

  return (
    <UserLayout currentPath={ROUTE_PATHS.FORMATEUR_MES_MODULES}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Mes Modules</h1>
          <p className="text-muted-foreground mt-2">Modules que vous enseignez cette année</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
        ) : modules.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Aucun module assigné pour le moment</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {modules.map(mod => (
              <Card key={mod.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleOpen(mod)}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <Badge variant="outline" className="mb-2 font-mono text-xs">{mod.code}</Badge>
                      <CardTitle className="text-lg">{mod.nom}</CardTitle>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                  {mod.filiere && (
                    <CardDescription>
                      <span className="inline-block px-2 py-1 rounded text-xs font-medium text-white" style={{ backgroundColor: mod.filiere.color ?? '#64748b' }}>
                        {mod.filiere.nom}
                      </span>
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" /><span>{mod.heures_par_semaine}h/semaine</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Award className="w-4 h-4" /><span>Coefficient: {mod.coefficient}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={!!selected} onOpenChange={open => !open && setSelected(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <div className="flex items-start justify-between">
                <div>
                  <DialogTitle className="text-2xl">{selected?.nom}</DialogTitle>
                  <DialogDescription className="mt-2">
                    <Badge variant="outline" className="font-mono">{selected?.code}</Badge>
                    {selected?.filiere && (
                      <span className="ml-2 inline-block px-2 py-1 rounded text-xs font-medium text-white" style={{ backgroundColor: selected.filiere.color ?? '#64748b' }}>
                        {selected.filiere.nom}
                      </span>
                    )}
                  </DialogDescription>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setSelected(null)}><X className="w-4 h-4" /></Button>
              </div>
            </DialogHeader>

            {selected && (
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <Clock className="w-8 h-8 mx-auto text-primary mb-2" />
                      <p className="text-2xl font-bold">{selected.heures_par_semaine}h</p>
                      <p className="text-xs text-muted-foreground">Par semaine</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <Award className="w-8 h-8 mx-auto text-chart-2 mb-2" />
                      <p className="text-2xl font-bold">{selected.coefficient}</p>
                      <p className="text-xs text-muted-foreground">Coefficient</p>
                    </CardContent>
                  </Card>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">
                    Stagiaires de la filière
                    {stagiairesMap[selected.id] && <span className="text-muted-foreground font-normal ml-2">({stagiairesMap[selected.id].length})</span>}
                  </h3>
                  {loadingStagiaires ? (
                    <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
                  ) : (
                    <ScrollArea className="h-[280px] rounded-md border">
                      <div className="p-4 space-y-2">
                        {(stagiairesMap[selected.id] ?? []).length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">Aucun stagiaire inscrit</div>
                        ) : (
                          (stagiairesMap[selected.id] ?? []).map((s, idx) => (
                            <div key={s.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">{idx + 1}</div>
                                <div>
                                  <p className="font-medium">{s.prenom} {s.nom}</p>
                                  <p className="text-xs text-muted-foreground">{s.matricule}</p>
                                </div>
                              </div>
                              {s.groupe && <Badge variant="secondary">{s.groupe.nom}</Badge>}
                            </div>
                          ))
                        )}
                      </div>
                    </ScrollArea>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </UserLayout>
  );
}
