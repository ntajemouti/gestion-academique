import { useEffect, useState, useMemo } from 'react';
import { UserLayout } from '@/components/UserLayout';
import { modulesApi, notesApi, usersApi } from '@/api/services';
import { ROUTE_PATHS, getNoteColor } from '@/lib/index';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Save, Plus, TrendingUp, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Module    { id: number; code: string; nom: string; coefficient: number; filiere?: { id: number; nom: string; color?: string } }
interface Stagiaire { id: number; prenom: string; nom: string; matricule: string; groupe?: { nom: string }; groupe_id?: number }
interface Note      { id: number; note: number; coefficient: number; date_evaluation: string; type_evaluation?: string; stagiaire_id: number; module_id: number }

export default function FormateurNotesStagiaires() {
  const { toast } = useToast();
  const [modules,     setModules]     = useState<Module[]>([]);
  const [stagiaires,  setStagiaires]  = useState<Stagiaire[]>([]);
  const [notes,       setNotes]       = useState<Note[]>([]);
  const [selModuleId, setSelModuleId] = useState('');
  const [loadingMods, setLoadingMods] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [isAdding,    setIsAdding]    = useState(false);
  const [saving,      setSaving]      = useState(false);
  const [newNotes,    setNewNotes]    = useState<Record<number, string>>({});
  const [evalDate,    setEvalDate]    = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    modulesApi.list()
      .then(({ data }) => setModules(Array.isArray(data) ? data : data.data ?? []))
      .catch(console.error)
      .finally(() => setLoadingMods(false));
  }, []);

  useEffect(() => {
    if (!selModuleId) { setStagiaires([]); setNotes([]); return; }
    const mod = modules.find(m => m.id === Number(selModuleId));
    if (!mod?.filiere?.id) return;

    setLoadingData(true);
    Promise.all([
      usersApi.stagiaires({ filiere_id: mod.filiere.id }),
      notesApi.list({ module_id: selModuleId, per_page: 500 }),
    ]).then(([stgRes, notesRes]) => {
      setStagiaires(Array.isArray(stgRes.data) ? stgRes.data : stgRes.data.data ?? []);
      setNotes(notesRes.data?.data ?? notesRes.data ?? []);
    }).catch(console.error)
      .finally(() => setLoadingData(false));
  }, [selModuleId]);

  const selectedModule = modules.find(m => m.id === Number(selModuleId));

  const getMoyenne = (stagId: number) => {
    const sNotes = notes.filter(n => n.stagiaire_id === stagId);
    if (!sNotes.length) return null;
    const totalP = sNotes.reduce((s, n) => s + n.note * n.coefficient, 0);
    const totalC = sNotes.reduce((s, n) => s + n.coefficient, 0);
    return totalC > 0 ? totalP / totalC : 0;
  };

  const globalMoyenne = useMemo(() => {
    if (!notes.length) return 0;
    const totalP = notes.reduce((s, n) => s + n.note * n.coefficient, 0);
    const totalC = notes.reduce((s, n) => s + n.coefficient, 0);
    return totalC > 0 ? totalP / totalC : 0;
  }, [notes]);

  const handleSave = async () => {
    const entries = Object.entries(newNotes).filter(([, v]) => v !== '');
    if (!entries.length || !selectedModule) {
      toast({ title: 'Aucune note à enregistrer', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const created: Note[] = [];
      for (const [stagId, noteVal] of entries) {
        const n = parseFloat(noteVal);
        if (isNaN(n) || n < 0 || n > 20) continue;
        const { data } = await notesApi.create({
          stagiaire_id:    Number(stagId),
          module_id:       selectedModule.id,
          note:            n,
          date_evaluation: evalDate,
          type_evaluation: 'Contrôle',
        });
        created.push(data?.data ?? data);
      }
      setNotes(prev => [...prev, ...created]);
      setNewNotes({});
      setIsAdding(false);
      toast({ title: `${created.length} note(s) enregistrée(s) avec succès` });
    } catch (err: any) {
      toast({ title: 'Erreur', description: err.response?.data?.message ?? 'Erreur lors de la sauvegarde.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteNote = async (noteId: number) => {
    try {
      await notesApi.delete(noteId);
      setNotes(prev => prev.filter(n => n.id !== noteId));
      toast({ title: 'Note supprimée' });
    } catch (err: any) {
      toast({ title: 'Erreur', description: err.response?.data?.message ?? 'Impossible de supprimer.', variant: 'destructive' });
    }
  };

  return (
    <UserLayout currentPath={ROUTE_PATHS.FORMATEUR_NOTES_STAGIAIRES}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Notes des Stagiaires</h1>
          <p className="text-muted-foreground mt-1">Saisie et gestion des notes d'évaluation</p>
        </div>

        {/* Module selector */}
        <Card>
          <CardHeader><CardTitle className="text-lg">Sélectionner un module</CardTitle></CardHeader>
          <CardContent>
            {loadingMods ? (
              <div className="flex items-center gap-2 text-muted-foreground text-sm"><Loader2 className="h-4 w-4 animate-spin" />Chargement…</div>
            ) : (
              <Select value={selModuleId} onValueChange={v => { setSelModuleId(v); setIsAdding(false); setNewNotes({}); }}>
                <SelectTrigger className="w-full md:w-96"><SelectValue placeholder="Choisir un module..." /></SelectTrigger>
                <SelectContent>
                  {modules.map(m => (
                    <SelectItem key={m.id} value={String(m.id)}>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono text-xs" style={{ borderColor: m.filiere?.color }}>{m.code}</Badge>
                        <span>{m.nom}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </CardContent>
        </Card>

        {selectedModule && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-primary/10"><TrendingUp className="w-6 h-6 text-primary" /></div>
                    <div>
                      <p className="text-sm text-muted-foreground">Moyenne générale</p>
                      <p className="text-2xl font-bold">{globalMoyenne.toFixed(2)}/20</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-accent/10"><Save className="w-6 h-6 text-accent" /></div>
                    <div>
                      <p className="text-sm text-muted-foreground">Coefficient</p>
                      <p className="text-2xl font-bold">{selectedModule.coefficient}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-green-100"><Plus className="w-6 h-6 text-green-600" /></div>
                    <div>
                      <p className="text-sm text-muted-foreground">Stagiaires</p>
                      <p className="text-2xl font-bold">{stagiaires.length}</p>
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
                    {!isAdding && (
                      <Button onClick={() => setIsAdding(true)} variant="outline" size="sm">
                        <Plus className="w-4 h-4 mr-2" />Nouvelle évaluation
                      </Button>
                    )}
                    {isAdding && Object.values(newNotes).some(v => v !== '') && (
                      <Button onClick={handleSave} size="sm" disabled={saving}>
                        {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        <Save className="w-4 h-4 mr-2" />Enregistrer
                      </Button>
                    )}
                    {isAdding && (
                      <Button onClick={() => { setIsAdding(false); setNewNotes({}); }} variant="ghost" size="sm">Annuler</Button>
                    )}
                  </div>
                </div>
                {isAdding && (
                  <div className="flex items-center gap-3 mt-2">
                    <Label className="text-sm">Date d'évaluation:</Label>
                    <Input type="date" value={evalDate} onChange={e => setEvalDate(e.target.value)} className="w-44" />
                  </div>
                )}
              </CardHeader>
              <CardContent>
                {loadingData ? (
                  <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
                ) : (
                  <div className="rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Matricule</TableHead>
                          <TableHead>Stagiaire</TableHead>
                          <TableHead>Groupe</TableHead>
                          <TableHead className="text-center">Moyenne actuelle</TableHead>
                          {isAdding && <TableHead className="text-center">Nouvelle note (/20)</TableHead>}
                          <TableHead className="text-center">Nb évaluations</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {stagiaires.length === 0 ? (
                          <TableRow><TableCell colSpan={isAdding ? 6 : 5} className="text-center py-8 text-muted-foreground">Aucun stagiaire trouvé</TableCell></TableRow>
                        ) : (
                          stagiaires.map(s => {
                            const moyenne = getMoyenne(s.id);
                            const count   = notes.filter(n => n.stagiaire_id === s.id).length;
                            return (
                              <TableRow key={s.id}>
                                <TableCell><Badge variant="outline" className="font-mono text-xs">{s.matricule}</Badge></TableCell>
                                <TableCell className="font-medium">{s.prenom} {s.nom}</TableCell>
                                <TableCell><Badge variant="secondary">{s.groupe?.nom ?? '—'}</Badge></TableCell>
                                <TableCell className="text-center">
                                  {moyenne !== null
                                    ? <span className={`font-semibold ${getNoteColor(moyenne)}`}>{moyenne.toFixed(2)}/20</span>
                                    : <span className="text-muted-foreground">—</span>}
                                </TableCell>
                                {isAdding && (
                                  <TableCell className="text-center">
                                    <Input
                                      type="number" min="0" max="20" step="0.5" placeholder="Note"
                                      className="w-24 mx-auto text-center"
                                      value={newNotes[s.id] ?? ''}
                                      onChange={e => setNewNotes(prev => ({ ...prev, [s.id]: e.target.value }))}
                                    />
                                  </TableCell>
                                )}
                                <TableCell className="text-center"><Badge variant="outline">{count}</Badge></TableCell>
                              </TableRow>
                            );
                          })
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Notes history */}
            {notes.length > 0 && (
              <Card>
                <CardHeader><CardTitle>Historique des évaluations</CardTitle></CardHeader>
                <CardContent>
                  <div className="rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Stagiaire</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead className="text-center">Note</TableHead>
                          <TableHead className="text-center">Coefficient</TableHead>
                          <TableHead className="text-center">Pondérée</TableHead>
                          <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {[...notes].sort((a, b) => new Date(b.date_evaluation).getTime() - new Date(a.date_evaluation).getTime()).map(n => {
                          const s = stagiaires.find(x => x.id === n.stagiaire_id);
                          return (
                            <TableRow key={n.id}>
                              <TableCell>{new Date(n.date_evaluation).toLocaleDateString('fr-FR')}</TableCell>
                              <TableCell className="font-medium">{s ? `${s.prenom} ${s.nom}` : `ID:${n.stagiaire_id}`}</TableCell>
                              <TableCell className="text-sm text-muted-foreground">{n.type_evaluation || 'Contrôle'}</TableCell>
                              <TableCell className="text-center">
                                <span className={`font-semibold ${getNoteColor(n.note)}`}>{n.note.toFixed(2)}/20</span>
                              </TableCell>
                              <TableCell className="text-center"><Badge variant="outline">{n.coefficient}</Badge></TableCell>
                              <TableCell className="text-center font-medium">{(n.note * n.coefficient).toFixed(2)}</TableCell>
                              <TableCell className="text-right">
                                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleDeleteNote(n.id)}>
                                  Supprimer
                                </Button>
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

        {!selectedModule && !loadingMods && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <p className="text-lg">Sélectionnez un module pour commencer</p>
              <p className="text-sm mt-2">Vous pourrez ensuite saisir et gérer les notes des stagiaires</p>
            </CardContent>
          </Card>
        )}
      </div>
    </UserLayout>
  );
}
