import { useState, useEffect, useMemo } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { DataTable } from '@/components/DataTable';
import { ROUTE_PATHS } from '@/lib/index';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Plus, Users, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import api from '@/api/client';

interface Absence {
  id: number;
  date: string;
  justifiee: boolean;
  motif?: string | null;
  stagiaire_id: number;
  module_id: number;
  formateur_id: number;
  groupe_id?: number | null;
  stagiaire?: { id: number; prenom: string; nom: string; matricule: string };
  module?: { id: number; code: string; nom: string };
  formateur?: { id: number; prenom: string; nom: string };
  groupe?: { id: number; nom: string } | null;
}

interface Stagiaire { id: number; prenom: string; nom: string; matricule: string; groupe_id?: number; groupe?: { nom: string } }
interface Module    { id: number; code: string; nom: string; formateur_id?: number }
interface Groupe    { id: number; nom: string }

export default function AdminAbsences() {
  const { toast } = useToast();
  const [absences,   setAbsences]   = useState<Absence[]>([]);
  const [stagiaires, setStagiaires] = useState<Stagiaire[]>([]);
  const [modules,    setModules]    = useState<Module[]>([]);
  const [groupes,    setGroupes]    = useState<Groupe[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);

  const [selGroupe, setSelGroupe] = useState('all');
  const [selModule, setSelModule] = useState('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing,     setEditing]     = useState<Absence | null>(null);
  const emptyForm = { stagiaire_id: '', module_id: '', date: new Date().toISOString().split('T')[0], justifiee: false, motif: '' };
  const [formData, setFormData] = useState(emptyForm);

  // ── Load all data ─────────────────────────────────────────
  const loadAll = async () => {
    setLoading(true);
    try {
      const [absRes, stgRes, modRes, grpRes] = await Promise.all([
        api.get('/absences', { params: { per_page: 500 } }),
        api.get('/users/stagiaires'),
        api.get('/modules'),
        api.get('/groupes'),
      ]);
      setAbsences(absRes.data?.data ?? absRes.data ?? []);
      setStagiaires(stgRes.data?.data ?? stgRes.data ?? []);
      setModules(modRes.data?.data ?? modRes.data ?? []);
      setGroupes(grpRes.data?.data ?? grpRes.data ?? []);
    } catch (err: any) {
      toast({ title: 'Erreur', description: err.response?.data?.message ?? 'Impossible de charger les données.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, []);

  // ── Filters ───────────────────────────────────────────────
  const filtered = useMemo(() => absences.filter(a => {
    if (selGroupe !== 'all' && String(a.groupe_id) !== selGroupe) return false;
    if (selModule !== 'all' && String(a.module_id) !== selModule) return false;
    return true;
  }), [absences, selGroupe, selModule]);

  const total          = filtered.length;
  const justifiees     = filtered.filter(a => a.justifiee).length;
  const nonJustifiees  = total - justifiees;

  // ── Handlers ──────────────────────────────────────────────
  const openAdd = () => { setEditing(null); setFormData(emptyForm); setIsModalOpen(true); };
  const openEdit = (row: Absence) => {
    setEditing(row);
    setFormData({ stagiaire_id: String(row.stagiaire_id), module_id: String(row.module_id), date: row.date?.split('T')[0] ?? '', justifiee: row.justifiee, motif: row.motif ?? '' });
    setIsModalOpen(true);
  };

  const handleDelete = async (row: Absence) => {
    try {
      await api.delete(`/absences/${row.id}`);
      setAbsences(prev => prev.filter(a => a.id !== row.id));
      toast({ title: 'Absence supprimée' });
    } catch (err: any) {
      toast({ title: 'Erreur', description: err.response?.data?.message ?? 'Impossible de supprimer.', variant: 'destructive' });
    }
  };

  const handleSubmit = async () => {
    if (!formData.stagiaire_id || !formData.module_id || !formData.date) {
      toast({ title: 'Champs manquants', description: 'Stagiaire, module et date sont requis.', variant: 'destructive' });
      return;
    }
    setSaving(true);
    const payload = {
      stagiaire_id: Number(formData.stagiaire_id),
      module_id:    Number(formData.module_id),
      date:         formData.date,
      justifiee:    formData.justifiee,
      motif:        formData.motif || null,
    };
    try {
      if (editing) {
        const res = await api.put(`/absences/${editing.id}`, { justifiee: payload.justifiee, motif: payload.motif });
        setAbsences(prev => prev.map(a => a.id === editing.id ? { ...a, ...res.data } : a));
        toast({ title: 'Absence modifiée' });
      } else {
        const res = await api.post('/absences', payload);
        const created = res.data?.data ?? res.data;
        setAbsences(prev => [created, ...prev]);
        toast({ title: 'Absence enregistrée' });
      }
      setIsModalOpen(false);
    } catch (err: any) {
      const errors = err.response?.data?.errors;
      const msg = errors ? Object.values(errors).flat().join(' ') : err.response?.data?.message ?? 'Erreur.';
      toast({ title: 'Erreur', description: msg, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  // ── Columns ───────────────────────────────────────────────
  const columns = [
    {
      key: 'date',
      label: 'Date',
      render: (row: Absence) => <span className="font-medium">{new Date(row.date).toLocaleDateString('fr-FR')}</span>,
    },
    {
      key: 'stagiaire',
      label: 'Stagiaire',
      render: (row: Absence) => {
        const s = row.stagiaire ?? stagiaires.find(x => x.id === row.stagiaire_id);
        return <div><div className="font-medium">{s?.prenom} {s?.nom}</div><div className="text-xs text-muted-foreground font-mono">{s?.matricule}</div></div>;
      },
    },
    {
      key: 'groupe',
      label: 'Groupe',
      render: (row: Absence) => {
        const g = row.groupe ?? groupes.find(x => x.id === row.groupe_id);
        return <span className="text-sm">{g?.nom ?? '—'}</span>;
      },
    },
    {
      key: 'module',
      label: 'Module',
      render: (row: Absence) => {
        const m = row.module ?? modules.find(x => x.id === row.module_id);
        return <div><div className="font-medium">{m?.nom}</div><div className="text-xs font-mono text-muted-foreground">{m?.code}</div></div>;
      },
    },
    {
      key: 'formateur',
      label: 'Formateur',
      render: (row: Absence) => row.formateur ? `${row.formateur.prenom} ${row.formateur.nom}` : '—',
    },
    {
      key: 'justifiee',
      label: 'Justifiée',
      render: (row: Absence) => (
        <Badge variant={row.justifiee ? 'default' : 'destructive'} className="gap-1">
          {row.justifiee ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
          {row.justifiee ? 'Oui' : 'Non'}
        </Badge>
      ),
    },
    {
      key: 'motif',
      label: 'Motif',
      render: (row: Absence) => <span className="text-sm text-muted-foreground">{row.motif || '—'}</span>,
    },
  ];

  return (
    <AdminLayout currentPath={ROUTE_PATHS.ADMIN_ABSENCES}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Gestion des Absences</h1>
            <p className="text-muted-foreground mt-1">Suivi et gestion des absences des stagiaires</p>
          </div>
          <Button onClick={openAdd} disabled={loading}>
            <Plus className="h-4 w-4 mr-2" />Ajouter une absence
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total absences</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{total}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Justifiées</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold text-green-600">{justifiees}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Non justifiées</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold text-red-600">{nonJustifiees}</div></CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex gap-4 flex-wrap">
          <div className="flex-1 min-w-[180px]">
            <Label className="text-sm font-medium mb-1 block">Filtrer par groupe</Label>
            <Select value={selGroupe} onValueChange={setSelGroupe}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les groupes</SelectItem>
                {groupes.map(g => <SelectItem key={g.id} value={String(g.id)}>{g.nom}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1 min-w-[180px]">
            <Label className="text-sm font-medium mb-1 block">Filtrer par module</Label>
            <Select value={selModule} onValueChange={setSelModule}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les modules</SelectItem>
                {modules.map(m => <SelectItem key={m.id} value={String(m.id)}>{m.nom} ({m.code})</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
        ) : (
          <DataTable
            columns={columns}
            data={filtered}
            onEdit={openEdit}
            onDelete={handleDelete}
            title="Liste des absences"
            subtitle={`${filtered.length} absence(s) enregistrée(s)`}
          />
        )}
      </div>

      {/* Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? 'Modifier l\'absence' : 'Nouvelle absence'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {!editing && (
              <>
                <div className="space-y-2">
                  <Label>Stagiaire *</Label>
                  <Select value={formData.stagiaire_id} onValueChange={v => setFormData({ ...formData, stagiaire_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Sélectionner un stagiaire" /></SelectTrigger>
                    <SelectContent>
                      {stagiaires.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.prenom} {s.nom} ({s.matricule})</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Module *</Label>
                  <Select value={formData.module_id} onValueChange={v => setFormData({ ...formData, module_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Sélectionner un module" /></SelectTrigger>
                    <SelectContent>
                      {modules.map(m => <SelectItem key={m.id} value={String(m.id)}>{m.nom} ({m.code})</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Date *</Label>
                  <Input type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
                </div>
              </>
            )}
            <div className="flex items-center justify-between">
              <Label>Absence justifiée</Label>
              <Switch checked={formData.justifiee} onCheckedChange={v => setFormData({ ...formData, justifiee: v })} />
            </div>
            {formData.justifiee && (
              <div className="space-y-2">
                <Label>Motif</Label>
                <Textarea placeholder="Raison de l'absence..." value={formData.motif} onChange={e => setFormData({ ...formData, motif: e.target.value })} rows={3} />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Annuler</Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editing ? 'Modifier' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
