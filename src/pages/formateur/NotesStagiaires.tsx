import { useState, useMemo } from 'react';
import { UserLayout } from '@/components/UserLayout';
import { useAuth } from '@/hooks/useAuth';
import {
  mockModules,
  mockNotes,
  mockUsers,
  mockGroupes,
  mockFilieres,
} from '@/data/index';
import {
  Note,
  getNoteColor,
  formatDate,
  calculateMoyenne,
  ROUTE_PATHS,
} from '@/lib/index';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Save, Plus, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

interface EditableNote {
  stagiaireId: string;
  note: number;
  dateEvaluation: string;
}

export default function FormateurNotesStagiaires() {
  const { user } = useAuth();
  const [selectedModuleId, setSelectedModuleId] = useState<string>('');
  const [editableNotes, setEditableNotes] = useState<Record<string, EditableNote>>({});
  const [isAddingNew, setIsAddingNew] = useState(false);

  const formateurModules = useMemo(() => {
    if (!user) return [];
    return mockModules.filter((m) => m.formateurId === user.id);
  }, [user]);

  const selectedModule = useMemo(() => {
    return mockModules.find((m) => m.id === selectedModuleId);
  }, [selectedModuleId]);

  const moduleNotes = useMemo(() => {
    if (!selectedModuleId) return [];
    return mockNotes.filter((n) => n.moduleId === selectedModuleId);
  }, [selectedModuleId]);

  const stagiairesInModule = useMemo(() => {
    if (!selectedModule) return [];
    const filiere = mockFilieres.find((f) => f.id === selectedModule.filiereId);
    if (!filiere) return [];
    const groupes = mockGroupes.filter((g) => g.filiereId === filiere.id);
    const groupeIds = groupes.map((g) => g.id);
    return mockUsers.filter(
      (u) => u.role === 'Stagiaire' && u.groupeId && groupeIds.includes(u.groupeId)
    );
  }, [selectedModule]);

  const tableData = useMemo(() => {
    return stagiairesInModule.map((stagiaire) => {
      const stagiaireNotes = moduleNotes.filter((n) => n.stagiaireId === stagiaire.id);
      const groupe = mockGroupes.find((g) => g.id === stagiaire.groupeId);
      const moyenne = stagiaireNotes.length > 0 ? calculateMoyenne(stagiaireNotes) : null;

      return {
        stagiaire,
        groupe: groupe?.nom || '-',
        notes: stagiaireNotes,
        moyenne,
      };
    });
  }, [stagiairesInModule, moduleNotes]);

  const handleNoteChange = (stagiaireId: string, value: string) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue < 0 || numValue > 20) return;

    setEditableNotes((prev) => ({
      ...prev,
      [stagiaireId]: {
        stagiaireId,
        note: numValue,
        dateEvaluation: new Date().toISOString().split('T')[0],
      },
    }));
  };

  const handleSaveNotes = () => {
    if (!selectedModule) return;

    const notesToSave = Object.values(editableNotes);
    if (notesToSave.length === 0) {
      toast.error('Aucune note à enregistrer');
      return;
    }

    notesToSave.forEach((editNote) => {
      const newNote: Note = {
        id: `note-${Date.now()}-${editNote.stagiaireId}`,
        stagiaireId: editNote.stagiaireId,
        moduleId: selectedModule.id,
        note: editNote.note,
        coefficient: selectedModule.coefficient,
        dateEvaluation: editNote.dateEvaluation,
        formateurId: user?.id || '',
      };
      mockNotes.push(newNote);
    });

    toast.success(`${notesToSave.length} note(s) enregistrée(s) avec succès`);
    setEditableNotes({});
    setIsAddingNew(false);
  };

  const globalMoyenne = useMemo(() => {
    const allNotes = tableData.flatMap((d) => d.notes);
    return allNotes.length > 0 ? calculateMoyenne(allNotes) : 0;
  }, [tableData]);

  return (
    <UserLayout currentPath={ROUTE_PATHS.FORMATEUR_NOTES_STAGIAIRES}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Notes des Stagiaires</h1>
            <p className="text-muted-foreground mt-1">
              Saisie et gestion des notes d'évaluation
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Sélectionner un module</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedModuleId} onValueChange={setSelectedModuleId}>
              <SelectTrigger className="w-full md:w-96">
                <SelectValue placeholder="Choisir un module..." />
              </SelectTrigger>
              <SelectContent>
                {formateurModules.map((module) => {
                  const filiere = mockFilieres.find((f) => f.id === module.filiereId);
                  return (
                    <SelectItem key={module.id} value={module.id}>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className="font-mono text-xs"
                          style={{ borderColor: filiere?.color }}
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

        {selectedModule && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-primary/10">
                      <TrendingUp className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Moyenne générale</p>
                      <p className="text-2xl font-bold text-foreground">
                        {globalMoyenne.toFixed(2)}/20
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-accent/10">
                      <Save className="w-6 h-6 text-accent" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Coefficient</p>
                      <p className="text-2xl font-bold text-foreground">
                        {selectedModule.coefficient}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-chart-2/10">
                      <Plus className="w-6 h-6 text-chart-2" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Stagiaires</p>
                      <p className="text-2xl font-bold text-foreground">
                        {stagiairesInModule.length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Saisie des notes</CardTitle>
                  <div className="flex gap-2">
                    {!isAddingNew && (
                      <Button
                        onClick={() => setIsAddingNew(true)}
                        variant="outline"
                        size="sm"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Nouvelle évaluation
                      </Button>
                    )}
                    {Object.keys(editableNotes).length > 0 && (
                      <Button onClick={handleSaveNotes} size="sm">
                        <Save className="w-4 h-4 mr-2" />
                        Enregistrer les notes
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Matricule</TableHead>
                        <TableHead>Stagiaire</TableHead>
                        <TableHead>Groupe</TableHead>
                        <TableHead className="text-center">Moyenne actuelle</TableHead>
                        {isAddingNew && (
                          <>
                            <TableHead className="text-center">Nouvelle note (/20)</TableHead>
                            <TableHead className="text-center">Date</TableHead>
                          </>
                        )}
                        <TableHead className="text-center">Évaluations</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tableData.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={isAddingNew ? 7 : 5} className="text-center py-8">
                            <p className="text-muted-foreground">
                              Aucun stagiaire trouvé pour ce module
                            </p>
                          </TableCell>
                        </TableRow>
                      ) : (
                        tableData.map((row) => (
                          <TableRow key={row.stagiaire.id}>
                            <TableCell>
                              <Badge variant="outline" className="font-mono text-xs">
                                {row.stagiaire.matricule}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-medium">
                              {row.stagiaire.prenom} {row.stagiaire.nom}
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">{row.groupe}</Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              {row.moyenne !== null ? (
                                <span
                                  className={`font-semibold ${getNoteColor(row.moyenne)}`}
                                >
                                  {row.moyenne.toFixed(2)}/20
                                </span>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            {isAddingNew && (
                              <>
                                <TableCell className="text-center">
                                  <Input
                                    type="number"
                                    min="0"
                                    max="20"
                                    step="0.5"
                                    placeholder="Note"
                                    className="w-24 mx-auto text-center"
                                    value={editableNotes[row.stagiaire.id]?.note || ''}
                                    onChange={(e) =>
                                      handleNoteChange(row.stagiaire.id, e.target.value)
                                    }
                                  />
                                </TableCell>
                                <TableCell className="text-center text-sm text-muted-foreground">
                                  {editableNotes[row.stagiaire.id]?.dateEvaluation
                                    ? formatDate(
                                        editableNotes[row.stagiaire.id].dateEvaluation
                                      )
                                    : formatDate(new Date().toISOString().split('T')[0])}
                                </TableCell>
                              </>
                            )}
                            <TableCell className="text-center">
                              <Badge variant="outline">{row.notes.length}</Badge>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>

                {isAddingNew && (
                  <div className="mt-4 flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsAddingNew(false);
                        setEditableNotes({});
                      }}
                    >
                      Annuler
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {moduleNotes.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Historique des évaluations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Stagiaire</TableHead>
                          <TableHead className="text-center">Note</TableHead>
                          <TableHead className="text-center">Coefficient</TableHead>
                          <TableHead className="text-center">Note pondérée</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {moduleNotes
                          .sort(
                            (a, b) =>
                              new Date(b.dateEvaluation).getTime() -
                              new Date(a.dateEvaluation).getTime()
                          )
                          .map((note) => {
                            const stagiaire = mockUsers.find((u) => u.id === note.stagiaireId);
                            return (
                              <TableRow key={note.id}>
                                <TableCell>{formatDate(note.dateEvaluation)}</TableCell>
                                <TableCell className="font-medium">
                                  {stagiaire
                                    ? `${stagiaire.prenom} ${stagiaire.nom}`
                                    : 'Inconnu'}
                                </TableCell>
                                <TableCell className="text-center">
                                  <span
                                    className={`font-semibold ${getNoteColor(note.note)}`}
                                  >
                                    {note.note.toFixed(2)}/20
                                  </span>
                                </TableCell>
                                <TableCell className="text-center">
                                  <Badge variant="outline">{note.coefficient}</Badge>
                                </TableCell>
                                <TableCell className="text-center font-medium">
                                  {(note.note * note.coefficient).toFixed(2)}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {!selectedModule && (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-muted-foreground">
                <p className="text-lg">Sélectionnez un module pour commencer</p>
                <p className="text-sm mt-2">
                  Vous pourrez ensuite saisir et gérer les notes des stagiaires
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </UserLayout>
  );
}
