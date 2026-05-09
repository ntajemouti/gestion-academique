import { useEffect, useState, useMemo } from 'react';
import { UserLayout } from '@/components/UserLayout';
import { useAuth } from '@/hooks/useAuth';
import { modulesApi, absencesApi, usersApi } from '@/api/services';
import { ROUTE_PATHS } from '@/lib/index';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Calendar, Users, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Module    { id: number; code: string; nom: string; coefficient: number; filiere?: { id: number; nom: string; color?: string } }
interface Stagiaire { id: number; prenom: string; nom: string; matricule: string; groupe_id?: number; groupe?: { nom: string } }
interface Absence   {
  id: number; date: string; justifiee: boolean; motif?: string | null;
  stagiaire_id: number;
  stagiaire?: { id: number; prenom: string; nom: string; matricule: string };
}

export default function FormateurAbsencesStagiaires() {
  const { user }   = useAuth();
  const { toast }  = useToast();

  const [modules,       setModules]       = useState<Module[]>([]);
  const [stagiaires,    setStagiaires]    = useState<Stagiaire[]>([]);
  const [absences,      setAbsences]      = useState<Absence[]>([]);
  const [selModuleId,   setSelModuleId]   = useState('');
  const [loadingMods,   setLoadingMods]   = useState(true);
  const [loadingStg,    setLoadingStg]    = useState(false);
  const [loadingAbs,    setLoadingAbs]    = useState(false);
  const [isModalOpen,   setIsModalOpen]   = useState(false);
  const [saving,        setSaving]        = useState(false);

  const emptyForm = { stagiaireId: '', date: new Date().toISOString().split('T')[0], justifiee: false, motif: '' };
  const [form, setForm] = useState(emptyForm);

  // Load formateur's modules
  useEffect(() => {
    modulesApi.list()
      .then(({ data }) => setModules(Array.isArray(data) ? data : data.data ?? []))
      .catch(console.error)
      .finally(() => setLoadingMods(false));
  }, []);

  // When module changes, load stagiaires + absences
  useEffect(() => {
    if (!selModuleId) { setStagiaires([]); setAbsences([]); return; }
    const mod = modules.find(m => m.id === Number(selModuleId));
    if (!mod?.filiere?.id) return;

    setLoadingStg(true);
    setLoadingAbs(true);

    usersApi.stagiaires({ filiere_id: mod.filiere.id })
      .then(({ data }) => setStagiaires(Array.isArray(data) ? data : data.data ?? []))
      .catch(console.error)
      .finally(() => setLoadingStg(false));

    absencesApi.list({ module_id: selModuleId, per_page: 500 })
      .then(({ data }) => setAbsences(data.data ?? data ?? []))
      .catch(console.error)
      .finally(() => setLoadingAbs(false));
  }, [selModuleId]);

  const selectedModule = modules.find(m => m.id === Number(selModuleId));
  const total         = absences.length;
  const justifiees    = absences.filter(a => a.justifiee).length;
  const nonJustif     = total - justifiees;

  const countFor = (stagId: number) => absences.filter(a => a.stagiaire_id === stagId).length;
  const recentFor = (stagId: number) => absences.filter(a => a.stagiaire_id === stagId).slice(0, 3);

  const handleAdd = async () => {
    if (!form.stagiaireId || !selModuleId) {
      toast({ title: 'Erreur', description: 'Stagiaire et module requis.', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const { data } = await absencesApi.create({
        stagiaire_id: Number(form.stagiaireId),
        module_id:    Number(selModuleId),
        date:         form.date,
        justifiee:    form.justifiee,
        motif:        form.motif || null,
      });
      const created = data?.data ?? data;
      setAbsences(prev => [created, ...prev]);
      toast({ title: 'Absence enregistrée avec succès' });
      setIsModalOpen(false);
      setForm(emptyForm);
    } catch (err: any) {
      toast({ title: 'Erreur', description: err.response?.data?.message ?? 'Une erreur est survenue.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <UserLayout currentPath={ROUTE_PATHS.FORMATEUR_ABSENCES_STAGIAIRES}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Absences des Stagiaires</h1>
          <p className="text-muted-foreground mt-2">Suivi et gestion des absences dans vos modules</p>
        </div>

        {/* Module selector */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Calendar className="h-5 w-5" />Sélectionner un module</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingMods ? (
              <div className="flex items-center gap-2 text-muted-foreground text-sm"><Loader2 className="h-4 w-4 animate-spin" />Chargement…</div>
            ) : (
              <Select value={selModuleId} onValueChange={setSelModuleId}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Choisir un module" /></SelectTrigger>
                <SelectContent>
                  {modules.map(m => (
                    <SelectItem key={m.id} value={String(m.id)}>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono text-xs" style={{ borderColor: m.filiere?.color, color: m.filiere?.color }}>{m.code}</Badge>
                        <span>{m.nom}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </CardContent>
        </Card>

        {selModuleId && (
          <>
            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-3">
              {[
                { label: 'Total Absences', value: total, color: 'text-foreground' },
                { label: 'Justifiées', value: justifiees, color: 'text-green-600' },
                { label: 'Non Justifiées', value: nonJustif, color: 'text-red-600' },
              ].map(s => (
                <Card key={s.label}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{s.label}</CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent><div className={`text-2xl font-bold ${s.color}`}>{s.value}</div></CardContent>
                </Card>
              ))}
            </div>

            {/* Stagiaires table */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Liste des Stagiaires — {selectedModule?.nom}
                  </CardTitle>
                  <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <DialogTrigger asChild>
                      <Button><Plus className="h-4 w-4 mr-2" />Ajouter une absence</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                      <DialogHeader>
                        <DialogTitle>Enregistrer une absence</DialogTitle>
                        <DialogDescription>Ajouter une nouvelle absence pour un stagiaire</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label>Stagiaire *</Label>
                          <Select value={form.stagiaireId} onValueChange={v => setForm({ ...form, stagiaireId: v })}>
                            <SelectTrigger><SelectValue placeholder="Sélectionner un stagiaire" /></SelectTrigger>
                            <SelectContent>
                              {stagiaires.map(s => (
                                <SelectItem key={s.id} value={String(s.id)}>{s.prenom} {s.nom} ({s.matricule})</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Date *</Label>
                          <Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch id="justifiee" checked={form.justifiee} onCheckedChange={v => setForm({ ...form, justifiee: v })} />
                          <Label htmlFor="justifiee" className="cursor-pointer">Absence justifiée</Label>
                        </div>
                        {form.justifiee && (
                          <div className="space-y-2">
                            <Label>Motif</Label>
                            <Textarea placeholder="Raison de l'absence..." value={form.motif} onChange={e => setForm({ ...form, motif: e.target.value })} rows={3} />
                          </div>
                        )}
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsModalOpen(false)}>Annuler</Button>
                        <Button onClick={handleAdd} disabled={saving}>
                          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Enregistrer
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {(loadingStg || loadingAbs) ? (
                  <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
                ) : (
                  <div className="rounded-md border overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="px-4 py-3 text-left text-sm font-semibold">Matricule</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold">Nom Complet</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold">Groupe</th>
                          <th className="px-4 py-3 text-center text-sm font-semibold">Absences</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold">Dernières</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stagiaires.length === 0 ? (
                          <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Aucun stagiaire trouvé</td></tr>
                        ) : (
                          stagiaires.map(s => {
                            const count = countFor(s.id);
                            const recent = recentFor(s.id);
                            return (
                              <tr key={s.id} className="border-b hover:bg-muted/50 transition-colors">
                                <td className="px-4 py-3"><Badge variant="outline" className="font-mono text-xs">{s.matricule}</Badge></td>
                                <td className="px-4 py-3 font-medium">{s.prenom} {s.nom}</td>
                                <td className="px-4 py-3 text-sm text-muted-foreground">{s.groupe?.nom ?? '—'}</td>
                                <td className="px-4 py-3 text-center">
                                  {count > 0 ? <Badge variant="destructive" className="font-semibold">{count}</Badge> : <span className="text-sm text-muted-foreground">0</span>}
                                </td>
                                <td className="px-4 py-3">
                                  {recent.length > 0 ? (
                                    <div className="flex flex-wrap gap-1">
                                      {recent.map(a => (
                                        <Badge key={a.id} variant="outline" className="text-xs" style={{ backgroundColor: a.justifiee ? '#dcfce7' : '#fee2e2', borderColor: a.justifiee ? '#16a34a' : '#dc2626', color: a.justifiee ? '#16a34a' : '#dc2626' }}>
                                          {new Date(a.date).toLocaleDateString('fr-FR')}
                                        </Badge>
                                      ))}
                                    </div>
                                  ) : <span className="text-sm text-muted-foreground">Aucune absence</span>}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {!selModuleId && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">Sélectionnez un module</p>
              <p className="text-sm">Choisissez un module pour voir les absences des stagiaires</p>
            </CardContent>
          </Card>
        )}
      </div>
    </UserLayout>
  );
}
