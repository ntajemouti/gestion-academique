import { useState, useEffect, useMemo } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { DataTable } from '@/components/DataTable';
import { getMention, getNoteColor, ROUTE_PATHS } from '@/lib/index';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Award, CheckCircle, Loader2, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import api from '@/api/client';

// ── API helpers ────────────────────────────────────────────────────────────────
const notesApi = {
  list:   ()                     => api.get('/notes'),
  create: (data: object)         => api.post('/notes', data),
  update: (id: number, data: object) => api.put(`/notes/${id}`, data),
  delete: (id: number)           => api.delete(`/notes/${id}`),
};

// ── Types ──────────────────────────────────────────────────────────────────────
interface Filiere  { id: number; nom: string; code: string; color?: string }
interface Module   { id: number; nom: string; code: string; coefficient: number; filiere_id: number; formateur_id?: number; filiere?: Filiere }
interface Groupe   { id: number; nom: string; filiere_id: number }
interface Stagiaire { id: number; prenom: string; nom: string; matricule: string; groupe_id?: number }
interface Formateur { id: number; prenom: string; nom: string }
interface Note {
  id: number;
  note: number;
  coefficient: number;
  date_evaluation: string;
  stagiaire_id: number;
  module_id: number;
  formateur_id: number;
  stagiaire?: Stagiaire;
  module?: Module;
  formateur?: Formateur;
}

// ── Helpers ────────────────────────────────────────────────────────────────────
const fmt = (n: number) => n.toFixed(2);
const calculateMoyenne = (notes: Note[]) => {
  if (notes.length === 0) return 0;
  const totalCoeff = notes.reduce((s, n) => s + n.coefficient, 0);
  if (totalCoeff === 0) return 0;
  return notes.reduce((s, n) => s + n.note * n.coefficient, 0) / totalCoeff;
};

// ── Component ──────────────────────────────────────────────────────────────────
export default function AdminNotes() {
  const { toast } = useToast();

  // Reference data
  const [filieres,   setFilieres]   = useState<Filiere[]>([]);
  const [modules,    setModules]    = useState<Module[]>([]);
  const [groupes,    setGroupes]    = useState<Groupe[]>([]);
  const [stagiaires, setStagiaires] = useState<Stagiaire[]>([]);
  const [formateurs, setFormateurs] = useState<Formateur[]>([]);

  // Notes
  const [notes,   setNotes]   = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);

  // Filters
  const [selFiliere, setSelFiliere] = useState('all');
  const [selModule,  setSelModule]  = useState('all');
  const [selGroupe,  setSelGroupe]  = useState('all');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing,     setEditing]     = useState<Note | null>(null);
  const emptyForm = {
    stagiaire_id:    '',
    module_id:       '',
    note:            '',
    coefficient:     '',
    date_evaluation: new Date().toISOString().split('T')[0],
    formateur_id:    '',
  };
  const [formData, setFormData] = useState(emptyForm);

  // ── Fetch all data ───────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [notesRes, filRes, modRes, grpRes, stgRes, fmtRes] = await Promise.all([
          notesApi.list(),
          api.get('/filieres'),
          api.get('/modules'),
          api.get('/groupes'),
          api.get('/users/stagiaires'),   
          api.get('/users/formateurs'),
        ]);
        setStagiaires(stgRes.data ?? []);
        setFormateurs(fmtRes.data ?? []);
      } catch (err: any) {
        toast({
          title: 'Erreur de chargement',
          description: err.response?.data?.message || 'Impossible de charger les données.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  // ── Derived data ─────────────────────────────────────────────────────────────
  const filteredNotes = useMemo(() => notes.filter((n) => {
    const mod = modules.find((m) => m.id === n.module_id);
    const stg = stagiaires.find((s) => s.id === n.stagiaire_id);
    if (selFiliere !== 'all' && mod?.filiere_id !== Number(selFiliere)) return false;
    if (selModule  !== 'all' && n.module_id    !== Number(selModule))   return false;
    if (selGroupe  !== 'all' && stg?.groupe_id  !== Number(selGroupe))  return false;
    return true;
  }), [notes, selFiliere, selModule, selGroupe, modules, stagiaires]);

  const availableModules = useMemo(() =>
    selFiliere === 'all' ? modules : modules.filter((m) => m.filiere_id === Number(selFiliere)),
    [selFiliere, modules]);

  const availableGroupes = useMemo(() =>
    selFiliere === 'all' ? groupes : groupes.filter((g) => g.filiere_id === Number(selFiliere)),
    [selFiliere, groupes]);

  const stats = useMemo(() => {
    const moyenne = calculateMoyenne(filteredNotes);
    const tauxReussite = filteredNotes.length > 0
      ? (filteredNotes.filter((n) => n.note >= 10).length / filteredNotes.length) * 100
      : 0;
    const modulesValides = new Set(filteredNotes.filter((n) => n.note >= 10).map((n) => n.module_id)).size;
    return { moyenne: fmt(moyenne), mention: getMention(moyenne), tauxReussite: tauxReussite.toFixed(1), modulesValides };
  }, [filteredNotes]);

  // ── Handlers ──────────────────────────────────────────────────────────────────
  const openAdd = () => {
    setEditing(null);
    setFormData(emptyForm);
    setIsModalOpen(true);
  };

  const openEdit = (row: Note) => {
    setEditing(row);
    setFormData({
      stagiaire_id:    String(row.stagiaire_id),
      module_id:       String(row.module_id),
      note:            String(row.note),
      coefficient:     String(row.coefficient),
      date_evaluation: row.date_evaluation?.split('T')[0] ?? '',
      formateur_id:    String(row.formateur_id),
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (row: Note) => {
    try {
      await notesApi.delete(row.id);
      setNotes((prev) => prev.filter((n) => n.id !== row.id));
      toast({ title: 'Note supprimée' });
    } catch (err: any) {
      toast({ title: 'Erreur', description: err.response?.data?.message || 'Impossible de supprimer.', variant: 'destructive' });
    }
  };

  const handleSubmit = async () => {
    if (!formData.stagiaire_id || !formData.module_id || !formData.note || !formData.date_evaluation) {
      toast({ title: 'Champs manquants', description: 'Veuillez remplir tous les champs obligatoires.', variant: 'destructive' });
      return;
    }
    setSaving(true);
    const payload = {
      stagiaire_id:    Number(formData.stagiaire_id),
      module_id:       Number(formData.module_id),
      formateur_id:    formData.formateur_id ? Number(formData.formateur_id) : undefined,
      note:            parseFloat(formData.note),
      coefficient:     parseInt(formData.coefficient),
      date_evaluation: formData.date_evaluation,
    };
    try {
      if (editing) {
        const res = await notesApi.update(editing.id, payload);
        const updated = res.data?.data ?? res.data;
        setNotes((prev) => prev.map((n) => (n.id === editing.id ? updated : n)));
        toast({ title: 'Note modifiée' });
      } else {
        const res = await notesApi.create(payload);
        const created = res.data?.data ?? res.data;
        setNotes((prev) => [...prev, created]);
        toast({ title: 'Note ajoutée' });
      }
      setIsModalOpen(false);
    } catch (err: any) {
      const errors = err.response?.data?.errors;
      const msg = errors ? Object.values(errors).flat().join(' ') : err.response?.data?.message || 'Erreur.';
      toast({ title: 'Erreur', description: msg, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  // ── Table columns ─────────────────────────────────────────────────────────────
  const columns = [
    {
      key: 'stagiaire',
      label: 'Stagiaire',
      render: (row: Note) => {
        const s = row.stagiaire ?? stagiaires.find((u) => u.id === row.stagiaire_id);
        return (
          <div>
            <div className="font-medium">{s?.prenom} {s?.nom}</div>
            <div className="text-xs text-muted-foreground font-mono">{s?.matricule}</div>
          </div>
        );
      },
    },
    {
      key: 'module',
      label: 'Module',
      render: (row: Note) => {
        const m = row.module ?? modules.find((x) => x.id === row.module_id);
        const f = m?.filiere ?? filieres.find((x) => x.id === m?.filiere_id);
        return (
          <div>
            <div className="font-medium">{m?.nom}</div>
            <span
              className="font-mono text-xs px-2 py-0.5 rounded"
              style={{ backgroundColor: `${f?.color ?? '#64748b'}20`, color: f?.color ?? '#64748b' }}
            >
              {m?.code}
            </span>
          </div>
        );
      },
    },
    {
      key: 'note',
      label: 'Note',
      render: (row: Note) => (
        <div className="text-center">
          <div className={`text-lg font-bold ${getNoteColor(row.note)}`}>{row.note.toFixed(1)}</div>
          <div className="text-xs text-muted-foreground">/20</div>
        </div>
      ),
    },
    {
      key: 'coefficient',
      label: 'Coef.',
      render: (row: Note) => (
        <div className="text-center">
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-muted text-sm font-semibold">
            {row.coefficient}
          </span>
        </div>
      ),
    },
    {
      key: 'note_ponderee',
      label: 'Note pondérée',
      render: (row: Note) => (
        <div className="text-center font-semibold">{(row.note * row.coefficient).toFixed(2)}</div>
      ),
    },
    {
      key: 'date_evaluation',
      label: 'Date évaluation',
      render: (row: Note) => (
        <div className="text-sm">
          {row.date_evaluation
            ? new Date(row.date_evaluation).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
            : '—'}
        </div>
      ),
    },
    {
      key: 'formateur',
      label: 'Formateur',
      render: (row: Note) => {
        const f = row.formateur ?? formateurs.find((x) => x.id === row.formateur_id);
        return <div className="text-sm">{f ? `${f.prenom} ${f.nom}` : '—'}</div>;
      },
    },
  ];

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <AdminLayout currentPath={ROUTE_PATHS.ADMIN_NOTES}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Gestion des Notes</h1>
            <p className="text-muted-foreground mt-1">Suivi et gestion des évaluations des stagiaires</p>
          </div>
          <Button onClick={openAdd} disabled={loading}>
            <Plus className="h-4 w-4 mr-2" />
            Ajouter une note
          </Button>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { title: 'Moyenne générale', value: stats.moyenne, sub: '/20',          icon: <TrendingUp className="h-4 w-4 text-muted-foreground" /> },
            { title: 'Mention',          value: stats.mention,  sub: 'Basée sur la moyenne', icon: <Award className="h-4 w-4 text-muted-foreground" /> },
            { title: 'Taux de réussite', value: `${stats.tauxReussite}%`, sub: 'Notes ≥ 10/20', icon: <CheckCircle className="h-4 w-4 text-muted-foreground" /> },
            { title: 'Modules validés',  value: stats.modulesValides, sub: 'Avec note ≥ 10', icon: <CheckCircle className="h-4 w-4 text-muted-foreground" /> },
          ].map((s) => (
            <Card key={s.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{s.title}</CardTitle>
                {s.icon}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{s.value}</div>
                <p className="text-xs text-muted-foreground mt-1">{s.sub}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <CardTitle>Filtres</CardTitle>
              <div className="flex flex-col md:flex-row gap-3">
                <Select value={selFiliere} onValueChange={(v) => { setSelFiliere(v); setSelModule('all'); setSelGroupe('all'); }}>
                  <SelectTrigger className="w-[200px]"><SelectValue placeholder="Toutes les filières" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les filières</SelectItem>
                    {filieres.map((f) => <SelectItem key={f.id} value={String(f.id)}>{f.nom}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={selModule} onValueChange={setSelModule}>
                  <SelectTrigger className="w-[200px]"><SelectValue placeholder="Tous les modules" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les modules</SelectItem>
                    {availableModules.map((m) => <SelectItem key={m.id} value={String(m.id)}>{m.nom}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={selGroupe} onValueChange={setSelGroupe}>
                  <SelectTrigger className="w-[200px]"><SelectValue placeholder="Tous les groupes" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les groupes</SelectItem>
                    {availableGroupes.map((g) => <SelectItem key={g.id} value={String(g.id)}>{g.nom}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={filteredNotes}
            onEdit={openEdit}
            onDelete={handleDelete}
            title="Liste des notes"
            subtitle={`${filteredNotes.length} note(s) enregistrée(s)`}
          />
        )}
      </div>

      {/* ── Add / Edit Modal ── */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? 'Modifier la note' : 'Ajouter une note'}</DialogTitle>
            <DialogDescription>
              {editing ? 'Modifiez les informations de la note' : 'Remplissez les informations de la nouvelle note'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Stagiaire */}
            <div className="space-y-2">
              <Label>Stagiaire</Label>
              <Select value={formData.stagiaire_id} onValueChange={(v) => setFormData({ ...formData, stagiaire_id: v })}>
                <SelectTrigger><SelectValue placeholder="Sélectionner un stagiaire" /></SelectTrigger>
                <SelectContent>
                  {stagiaires.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {s.prenom} {s.nom} ({s.matricule})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Module */}
            <div className="space-y-2">
              <Label>Module</Label>
              <Select
                value={formData.module_id}
                onValueChange={(v) => {
                  const mod = modules.find((m) => m.id === Number(v));
                  setFormData({
                    ...formData,
                    module_id:    v,
                    coefficient:  mod?.coefficient?.toString() ?? '',
                    formateur_id: mod?.formateur_id ? String(mod.formateur_id) : formData.formateur_id,
                  });
                }}
              >
                <SelectTrigger><SelectValue placeholder="Sélectionner un module" /></SelectTrigger>
                <SelectContent>
                  {modules.map((m) => (
                    <SelectItem key={m.id} value={String(m.id)}>{m.nom} ({m.code})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Note */}
            <div className="space-y-2">
              <Label>Note (/20)</Label>
              <Input
                type="number" step="0.5" min="0" max="20"
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                placeholder="Ex: 15.5"
              />
            </div>

            {/* Coefficient */}
            <div className="space-y-2">
              <Label>Coefficient</Label>
              <Input
                type="number" min="1"
                value={formData.coefficient}
                onChange={(e) => setFormData({ ...formData, coefficient: e.target.value })}
                placeholder="Ex: 3"
                disabled={!!formData.module_id}
              />
            </div>

            {/* Formateur */}
            <div className="space-y-2">
              <Label>Formateur</Label>
              <Select value={formData.formateur_id} onValueChange={(v) => setFormData({ ...formData, formateur_id: v })}>
                <SelectTrigger><SelectValue placeholder="Sélectionner un formateur" /></SelectTrigger>
                <SelectContent>
                  {formateurs.map((f) => (
                    <SelectItem key={f.id} value={String(f.id)}>{f.prenom} {f.nom}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date */}
            <div className="space-y-2">
              <Label>Date d'évaluation</Label>
              <Input
                type="date"
                value={formData.date_evaluation}
                onChange={(e) => setFormData({ ...formData, date_evaluation: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Annuler</Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editing ? 'Modifier' : 'Ajouter'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
