import { useState } from 'react';
import { UserLayout } from '@/components/UserLayout';
import { useAuth } from '@/hooks/useAuth';
import { mockModules, mockFilieres, mockGroupes, mockUsers } from '@/data/index';
import { ROUTE_PATHS } from '@/lib/index';
import { BookOpen, Users, Clock, Award, ChevronRight, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ModuleWithDetails {
  id: string;
  code: string;
  nom: string;
  filiere: string;
  filiereColor: string;
  groupe: string;
  coefficient: number;
  heuresParSemaine: number;
  nombreStagiaires: number;
}

export default function FormateurMesModules() {
  const { user } = useAuth();
  const [selectedModule, setSelectedModule] = useState<ModuleWithDetails | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const formateurModules = mockModules.filter(
    (module) => module.formateurId === user?.id
  );

  const modulesWithDetails: ModuleWithDetails[] = formateurModules.map((module) => {
    const filiere = mockFilieres.find((f) => f.id === module.filiereId);
    const groupesForModule = mockGroupes.filter((g) => g.filiereId === module.filiereId);
    const totalStagiaires = groupesForModule.reduce(
      (sum, g) => sum + g.nombreStagiaires,
      0
    );

    return {
      id: module.id,
      code: module.code,
      nom: module.nom,
      filiere: filiere?.nom || 'N/A',
      filiereColor: filiere?.color || '#64748b',
      groupe: groupesForModule.map((g) => g.nom).join(', ') || 'N/A',
      coefficient: module.coefficient,
      heuresParSemaine: module.heuresParSemaine,
      nombreStagiaires: totalStagiaires,
    };
  });

  const handleModuleClick = (module: ModuleWithDetails) => {
    setSelectedModule(module);
    setIsDialogOpen(true);
  };

  const getStagiairesForModule = (moduleId: string) => {
    const module = mockModules.find((m) => m.id === moduleId);
    if (!module) return [];

    const groupesForFiliere = mockGroupes.filter(
      (g) => g.filiereId === module.filiereId
    );
    const groupeIds = groupesForFiliere.map((g) => g.id);

    return mockUsers.filter(
      (u) => u.role === 'Stagiaire' && u.groupeId && groupeIds.includes(u.groupeId)
    );
  };

  return (
    <UserLayout currentPath={ROUTE_PATHS.FORMATEUR_MES_MODULES}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Mes Modules</h1>
          <p className="text-muted-foreground mt-2">
            Modules que vous enseignez cette année
          </p>
        </div>

        {modulesWithDetails.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Aucun module assigné pour le moment
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {modulesWithDetails.map((module) => (
              <Card
                key={module.id}
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleModuleClick(module)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <Badge
                        variant="outline"
                        className="mb-2 font-mono text-xs"
                      >
                        {module.code}
                      </Badge>
                      <CardTitle className="text-lg">{module.nom}</CardTitle>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <CardDescription>
                    <span
                      className="inline-block px-2 py-1 rounded text-xs font-medium text-white"
                      style={{ backgroundColor: module.filiereColor }}
                    >
                      {module.filiere}
                    </span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="w-4 h-4" />
                    <span>{module.nombreStagiaires} stagiaires</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>{module.heuresParSemaine}h/semaine</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Award className="w-4 h-4" />
                    <span>Coefficient: {module.coefficient}</span>
                  </div>
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground">
                      Groupe(s): {module.groupe}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <div className="flex items-start justify-between">
                <div>
                  <DialogTitle className="text-2xl">
                    {selectedModule?.nom}
                  </DialogTitle>
                  <DialogDescription className="mt-2">
                    <Badge variant="outline" className="font-mono">
                      {selectedModule?.code}
                    </Badge>
                    <span className="mx-2">•</span>
                    <span
                      className="inline-block px-2 py-1 rounded text-xs font-medium text-white"
                      style={{ backgroundColor: selectedModule?.filiereColor }}
                    >
                      {selectedModule?.filiere}
                    </span>
                  </DialogDescription>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsDialogOpen(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </DialogHeader>

            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <Users className="w-8 h-8 mx-auto text-primary mb-2" />
                      <p className="text-2xl font-bold">
                        {selectedModule?.nombreStagiaires}
                      </p>
                      <p className="text-xs text-muted-foreground">Stagiaires</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <Clock className="w-8 h-8 mx-auto text-accent mb-2" />
                      <p className="text-2xl font-bold">
                        {selectedModule?.heuresParSemaine}h
                      </p>
                      <p className="text-xs text-muted-foreground">Par semaine</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <Award className="w-8 h-8 mx-auto text-chart-2 mb-2" />
                      <p className="text-2xl font-bold">
                        {selectedModule?.coefficient}
                      </p>
                      <p className="text-xs text-muted-foreground">Coefficient</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Liste des stagiaires</h3>
                <ScrollArea className="h-[300px] rounded-md border">
                  <div className="p-4 space-y-2">
                    {selectedModule &&
                      getStagiairesForModule(selectedModule.id).map(
                        (stagiaire, index) => {
                          const groupe = mockGroupes.find(
                            (g) => g.id === stagiaire.groupeId
                          );
                          return (
                            <div
                              key={stagiaire.id}
                              className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                                  {index + 1}
                                </div>
                                <div>
                                  <p className="font-medium">
                                    {stagiaire.prenom} {stagiaire.nom}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {stagiaire.matricule}
                                  </p>
                                </div>
                              </div>
                              <Badge variant="secondary">
                                {groupe?.nom || 'N/A'}
                              </Badge>
                            </div>
                          );
                        }
                      )}
                    {selectedModule &&
                      getStagiairesForModule(selectedModule.id).length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                          Aucun stagiaire inscrit
                        </div>
                      )}
                  </div>
                </ScrollArea>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </UserLayout>
  );
}
