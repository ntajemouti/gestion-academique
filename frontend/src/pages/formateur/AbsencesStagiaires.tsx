import { useState } from 'react';
import { UserLayout } from '@/components/UserLayout';
import { useAuth } from '@/hooks/useAuth';
import {
  mockAbsences,
  mockModules,
  mockUsers,
  mockGroupes,
  mockFilieres,
} from '@/data/index';
import { formatDate } from '@/lib/index';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Calendar, Users } from 'lucide-react';
import { toast } from 'sonner';

export default function FormateurAbsencesStagiaires() {
  const { user } = useAuth();
  const [selectedModuleId, setSelectedModuleId] = useState<string>('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newAbsence, setNewAbsence] = useState({
    stagiaireId: '',
    date: new Date().toISOString().split('T')[0],
    justifiee: false,
    motif: '',
  });

  const formateurModules = mockModules.filter(
    (m) => m.formateurId === user?.id
  );

  const selectedModule = formateurModules.find(
    (m) => m.id === selectedModuleId
  );

  const filiere = selectedModule
    ? mockFilieres.find((f) => f.id === selectedModule.filiereId)
    : null;

  const groupesForModule = selectedModule
    ? mockGroupes.filter((g) => g.filiereId === selectedModule.filiereId)
    : [];

  const stagiairesInGroups = mockUsers.filter(
    (u) =>
      u.role === 'Stagiaire' &&
      groupesForModule.some((g) => g.id === u.groupeId)
  );

  const absencesForModule = selectedModuleId
    ? mockAbsences.filter((a) => a.moduleId === selectedModuleId)
    : [];

  const getAbsenceCountForStagiaire = (stagiaireId: string) => {
    return absencesForModule.filter((a) => a.stagiaireId === stagiaireId)
      .length;
  };

  const handleAddAbsence = () => {
    if (!newAbsence.stagiaireId || !selectedModuleId) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    const absence = {
      id: `abs-${Date.now()}`,
      stagiaireId: newAbsence.stagiaireId,
      moduleId: selectedModuleId,
      date: newAbsence.date,
      justifiee: newAbsence.justifiee,
      motif: newAbsence.motif || undefined,
      formateurId: user?.id || '',
    };

    mockAbsences.push(absence);
    toast.success('Absence enregistrée avec succès');
    setIsAddModalOpen(false);
    setNewAbsence({
      stagiaireId: '',
      date: new Date().toISOString().split('T')[0],
      justifiee: false,
      motif: '',
    });
  };

  const totalAbsences = absencesForModule.length;
  const absencesJustifiees = absencesForModule.filter((a) => a.justifiee)
    .length;
  const absencesNonJustifiees = totalAbsences - absencesJustifiees;

  return (
    <UserLayout currentPath="/formateur/absences-stagiaires">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Absences des Stagiaires
            </h1>
            <p className="text-muted-foreground mt-2">
              Suivi et gestion des absences dans vos modules
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Sélectionner un module
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedModuleId} onValueChange={setSelectedModuleId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choisir un module" />
              </SelectTrigger>
              <SelectContent>
                {formateurModules.map((module) => {
                  const moduleFiliere = mockFilieres.find(
                    (f) => f.id === module.filiereId
                  );
                  return (
                    <SelectItem key={module.id} value={module.id}>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className="font-mono text-xs"
                          style={{
                            borderColor: moduleFiliere?.color,
                            color: moduleFiliere?.color,
                          }}
                        >
                          {module.code}
                        </Badge>
                        <span>{module.nom}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {selectedModuleId && (
          <>
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Absences
                  </CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalAbsences}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Dans ce module
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Justifiées
                  </CardTitle>
                  <div className="h-4 w-4 rounded-full bg-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {absencesJustifiees}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {totalAbsences > 0
                      ? `${Math.round((absencesJustifiees / totalAbsences) * 100)}%`
                      : '0%'}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Non Justifiées
                  </CardTitle>
                  <div className="h-4 w-4 rounded-full bg-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    {absencesNonJustifiees}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {totalAbsences > 0
                      ? `${Math.round((absencesNonJustifiees / totalAbsences) * 100)}%`
                      : '0%'}
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Liste des Stagiaires
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedModule?.nom} - {filiere?.nom}
                    </p>
                  </div>
                  <Dialog
                    open={isAddModalOpen}
                    onOpenChange={setIsAddModalOpen}
                  >
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Ajouter une absence
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                      <DialogHeader>
                        <DialogTitle>Enregistrer une absence</DialogTitle>
                        <DialogDescription>
                          Ajouter une nouvelle absence pour un stagiaire
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="stagiaire">Stagiaire *</Label>
                          <Select
                            value={newAbsence.stagiaireId}
                            onValueChange={(value) =>
                              setNewAbsence({ ...newAbsence, stagiaireId: value })
                            }
                          >
                            <SelectTrigger id="stagiaire">
                              <SelectValue placeholder="Sélectionner un stagiaire" />
                            </SelectTrigger>
                            <SelectContent>
                              {stagiairesInGroups.map((stagiaire) => (
                                <SelectItem
                                  key={stagiaire.id}
                                  value={stagiaire.id}
                                >
                                  {stagiaire.prenom} {stagiaire.nom} ({
                                    stagiaire.matricule
                                  })
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="date">Date *</Label>
                          <Input
                            id="date"
                            type="date"
                            value={newAbsence.date}
                            onChange={(e) =>
                              setNewAbsence({
                                ...newAbsence,
                                date: e.target.value,
                              })
                            }
                          />
                        </div>

                        <div className="flex items-center space-x-2">
                          <Switch
                            id="justifiee"
                            checked={newAbsence.justifiee}
                            onCheckedChange={(checked) =>
                              setNewAbsence({ ...newAbsence, justifiee: checked })
                            }
                          />
                          <Label htmlFor="justifiee" className="cursor-pointer">
                            Absence justifiée
                          </Label>
                        </div>

                        {newAbsence.justifiee && (
                          <div className="space-y-2">
                            <Label htmlFor="motif">Motif</Label>
                            <Textarea
                              id="motif"
                              placeholder="Raison de l'absence..."
                              value={newAbsence.motif}
                              onChange={(e) =>
                                setNewAbsence({
                                  ...newAbsence,
                                  motif: e.target.value,
                                })
                              }
                              rows={3}
                            />
                          </div>
                        )}
                      </div>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => setIsAddModalOpen(false)}
                        >
                          Annuler
                        </Button>
                        <Button onClick={handleAddAbsence}>Enregistrer</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="px-4 py-3 text-left text-sm font-semibold">
                            Matricule
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-semibold">
                            Nom Complet
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-semibold">
                            Groupe
                          </th>
                          <th className="px-4 py-3 text-center text-sm font-semibold">
                            Total Absences
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-semibold">
                            Dernières Absences
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {stagiairesInGroups.length === 0 ? (
                          <tr>
                            <td
                              colSpan={5}
                              className="px-4 py-8 text-center text-muted-foreground"
                            >
                              Aucun stagiaire trouvé pour ce module
                            </td>
                          </tr>
                        ) : (
                          stagiairesInGroups.map((stagiaire) => {
                            const groupe = mockGroupes.find(
                              (g) => g.id === stagiaire.groupeId
                            );
                            const absenceCount =
                              getAbsenceCountForStagiaire(stagiaire.id);
                            const stagiaireAbsences = absencesForModule
                              .filter((a) => a.stagiaireId === stagiaire.id)
                              .sort(
                                (a, b) =>
                                  new Date(b.date).getTime() -
                                  new Date(a.date).getTime()
                              )
                              .slice(0, 3);

                            return (
                              <tr
                                key={stagiaire.id}
                                className="border-b hover:bg-muted/50 transition-colors"
                              >
                                <td className="px-4 py-3">
                                  <Badge
                                    variant="outline"
                                    className="font-mono text-xs"
                                  >
                                    {stagiaire.matricule}
                                  </Badge>
                                </td>
                                <td className="px-4 py-3 font-medium">
                                  {stagiaire.prenom} {stagiaire.nom}
                                </td>
                                <td className="px-4 py-3 text-sm text-muted-foreground">
                                  {groupe?.nom}
                                </td>
                                <td className="px-4 py-3 text-center">
                                  {absenceCount > 0 ? (
                                    <Badge
                                      variant="destructive"
                                      className="font-semibold"
                                    >
                                      {absenceCount}
                                    </Badge>
                                  ) : (
                                    <span className="text-sm text-muted-foreground">
                                      0
                                    </span>
                                  )}
                                </td>
                                <td className="px-4 py-3">
                                  {stagiaireAbsences.length > 0 ? (
                                    <div className="flex flex-wrap gap-1">
                                      {stagiaireAbsences.map((absence) => (
                                        <Badge
                                          key={absence.id}
                                          variant="outline"
                                          className="text-xs"
                                          style={{
                                            backgroundColor: absence.justifiee
                                              ? '#dcfce7'
                                              : '#fee2e2',
                                            borderColor: absence.justifiee
                                              ? '#16a34a'
                                              : '#dc2626',
                                            color: absence.justifiee
                                              ? '#16a34a'
                                              : '#dc2626',
                                          }}
                                        >
                                          {formatDate(absence.date)}
                                        </Badge>
                                      ))}
                                    </div>
                                  ) : (
                                    <span className="text-sm text-muted-foreground">
                                      Aucune absence
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {!selectedModuleId && (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">
                  Sélectionnez un module
                </p>
                <p className="text-sm">
                  Choisissez un module pour voir les absences des stagiaires
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </UserLayout>
  );
}
