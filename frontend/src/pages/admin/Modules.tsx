import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { DataTable } from '@/components/DataTable';
import { modulesApi, filieresApi, usersApi } from '@/api/services';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Loader2, BookOpen } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// ── Types ──────────────────────────────────────────────────────────────────────
interface Module {
  id: number;
  code: string;
  nom: string;
  annee: 1 | 2;
  option_nom: string | null;
  filiere_id: number | null;
  formateur_id: number | null;
  heures_par_semaine: number;
  coefficient: number;
  filiere?: { id: number; nom: string; color?: string };
  formateur?: { id: number; prenom: string; nom: string };
}

interface Filiere { id: number; nom: string; color?: string }
interface Formateur { id: number; prenom: string; nom: string }

const EMPTY_FORM = {
  code: '',
  nom: '',
  filiere_id: '',
  annee: '1' as '1' | '2',
  option_nom: '',
  formateur_id: '',
  heures_par_semaine: '',
  coefficient: '',
};

// ── Component ──────────────────────────────────────────────────────────────────
export default function AdminModules() {
  const { toast } = useToast();

  const [modules,    setModules]    = useState<Module[]>([]);
  const [filieres,   setFilieres]   = useState<Filiere[]>([]);
  const [formateurs, setFormateurs] = useState<Formateur[]>([]);
  const [isLoading,  setIsLoading]  = useState(true);
  const [isSaving,   setIsSaving]   = useState(false);
  const [isModalOpen, setIsModalOpen]   = useState(false);
  const [editing,     setEditing]       = useState<Module | null>(null);
  const [formData,    setFormData]       = useState(EMPTY_FORM);

  // ── Load ────────────────────────────────────────────────────────────────────
  const loadAll = async () => {
    setIsLoading(true);
    try {
      const [modRes, filRes, forRes] = await Promise.all([
        modulesApi.list(),
        filieresApi.list(),
        usersApi.formateurs(),
      ]);
      setModules(Array.isArray(modRes.data)   ? modRes.data   : modRes.data?.data   ?? []);
      setFilieres(Array.isArray(filRes.data)  ? filRes.data   : filRes.data?.data   ?? []);
      setFormateurs(Array.isArray(forRes.data) ? forRes.data  : forRes.data?.data   ?? []);
    } catch (err: any) {
      toast({ title: 'Erreur de chargement', description: err.response?.data?.message ?? 'Impossible de charger.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, []);

  // ── Open modal ──────────────────────────────────────────────────────────────
  const openAdd = () => {
    setEditing(null);
    setFormData(EMPTY_FORM);
    setIsModalOpen(true);
  };

  const openEdit = (row: Module) => {
    setEditing(row);
    setFormData({
      code:               row.code,
      nom:                row.nom,
      filiere_id:         row.filiere_id ? String(row.filiere_id) : '',
      annee:              String(row.annee) as '1' | '2',
      option_nom:         row.option_nom ?? '',
      formateur_id:       row.formateur_id ? String(row.formateur_id) : '',
      heures_par_semaine: String(row.heures_par_semaine),
      coefficient:        String(row.coefficient),
    });
    setIsModalOpen(true);
  };

  // ── Delete ──────────────────────────────────────────────────────────────────
  const handleDelete = async (row: Module) => {
    try {
      await modulesApi.delete(row.id);
      setModules(prev => prev.filter(m => m.id !== row.id));
      toast({ title: 'Module supprimé', description: `${row.nom} a été supprimé.` });
    } catch (err: any) {
      toast({ title: 'Erreur', description: err.response?.data?.message ?? 'Impossible de supprimer.', variant: 'destructive' });
    }
  };

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    // Validation
    if (!formData.code.trim())       { toast({ title: 'Code requis',            variant: 'destructive' }); return; }
    if (!formData.nom.trim())        { toast({ title: 'Nom requis',             variant: 'destructive' }); return; }
    if (!formData.filiere_id)        { toast({ title: 'Filière requise',        variant: 'destructive' }); return; }
    if (!formData.formateur_id)      { toast({ title: 'Formateur requis',       variant: 'destructive' }); return; }
    if (!formData.heures_par_semaine){ toast({ title: 'Heures requises',        variant: 'destructive' }); return; }
    if (!formData.coefficient)       { toast({ title: 'Coefficient requis',     variant: 'destructive' }); return; }

    setIsSaving(true);
    try {
      const payload: Record<string, any> = {
        code:               formData.code.trim().toUpperCase(),
        nom:                formData.nom.trim(),
        filiere_id:         Number(formData.filiere_id),
        annee:              Number(formData.annee),       // ← required by backend
        option_nom:         formData.option_nom.trim() || null, // nullable
        formateur_id:       Number(formData.formateur_id),
        heures_par_semaine: Number(formData.heures_par_semaine),
        coefficient:        Number(formData.coefficient),
      };

      if (editing) {
        const { data } = await modulesApi.update(editing.id, payload);
        const updated   = data?.data ?? data;
        setModules(prev => prev.map(m => m.id === editing.id ? updated : m));
        toast({ title: 'Module modifié', description: `${payload.nom} mis à jour.` });
      } else {
        const { data } = await modulesApi.create(payload);
        const created   = data?.data ?? data;
        setModules(prev => [...prev, created]);
        toast({ title: 'Module ajouté', description: `${payload.nom} créé avec succès.` });
      }
      setIsModalOpen(false);
    } catch (err: any) {
      const errors = err.response?.data?.errors;
      const msg    = errors
        ? Object.values(errors).flat().join(' ')
        : err.response?.data?.message ?? 'Une erreur est survenue.';
      toast({ title: 'Erreur', description: msg, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  // ── Table columns ──────────────────────────────────────────────────────────
  const columns = [
    {
      key: 'code',
      label: 'Code',
      render: (row: Module) => (
        <span className="font-mono text-sm bg-muted px-2 py-1 rounded">{row.code}</span>
      ),
    },
    {
      key: 'nom',
      label: 'Nom du module',
      render: (row: Module) => <span className="font-medium">{row.nom}</span>,
    },
    {
      key: 'filiere',
      label: 'Filière',
      render: (row: Module) => row.filiere ? (
        <span
          className="inline-block px-2 py-0.5 rounded text-xs font-semibold text-white"
          style={{ backgroundColor: row.filiere.color ?? '#64748b' }}
        >
          {row.filiere.nom}
        </span>
      ) : <span className="text-muted-foreground">—</span>,
    },
    {
      key: 'annee',
      label: 'Année',
      render: (row: Module) => (
        <Badge variant="outline" className="text-xs">
          {row.annee === 1 ? '1ère année' : '2ème année'}
          {row.option_nom && ` · ${row.option_nom}`}
        </Badge>
      ),
    },
    {
      key: 'formateur',
      label: 'Formateur',
      render: (row: Module) => row.formateur
        ? `${row.formateur.prenom} ${row.formateur.nom}`
        : <span className="text-muted-foreground">—</span>,
    },
    {
      key: 'heures_par_semaine',
      label: 'H/sem',
      render: (row: Module) => `${row.heures_par_semaine}h`,
    },
    {
      key: 'coefficient',
      label: 'Coef.',
      render: (row: Module) => (
        <span className="inline-flex items-center px-2 py-1 rounded-md bg-primary/10 text-primary text-sm font-medium">
          {row.coefficient}
        </span>
      ),
    },
  ];

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <AdminLayout currentPath="/admin/modules">
      <div className="p-6 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Gestion des Modules</h1>
            <p className="text-muted-foreground mt-1">Gérez les modules de formation par filière et par année</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <BookOpen className="w-3.5 h-3.5" />
              {modules.length} modules
            </span>
            <Button onClick={openAdd} className="gap-2">
              <Plus className="w-4 h-4" />
              Ajouter un module
            </Button>
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={modules}
            onAdd={openAdd}
            onEdit={openEdit}
            onDelete={handleDelete}
            title="Liste des modules"
            addLabel="Ajouter un module"
          />
        )}
      </div>

      {/* ── Modal ─────────────────────────────────────────────────────────── */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editing ? `Modifier : ${editing.nom}` : 'Ajouter un module'}
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">

            {/* Code */}
            <div className="space-y-2">
              <Label htmlFor="code">Code du module <span className="text-destructive">*</span></Label>
              <Input
                id="code"
                placeholder="Ex: WEB101"
                value={formData.code}
                onChange={e => setFormData({ ...formData, code: e.target.value })}
                className="font-mono uppercase"
              />
            </div>

            {/* Nom */}
            <div className="space-y-2">
              <Label htmlFor="nom">Nom du module <span className="text-destructive">*</span></Label>
              <Input
                id="nom"
                placeholder="Ex: Développement Web Frontend"
                value={formData.nom}
                onChange={e => setFormData({ ...formData, nom: e.target.value })}
              />
            </div>

            {/* Filière */}
            <div className="space-y-2">
              <Label>Filière <span className="text-destructive">*</span></Label>
              <Select
                value={formData.filiere_id || '__none__'}
                onValueChange={v => setFormData({ ...formData, filiere_id: v === '__none__' ? '' : v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une filière" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__" disabled>Sélectionner une filière</SelectItem>
                  {filieres.map(f => (
                    <SelectItem key={f.id} value={String(f.id)}>{f.nom}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Année */}
            <div className="space-y-2">
              <Label>Année <span className="text-destructive">*</span></Label>
              <Select
                value={formData.annee}
                onValueChange={v => setFormData({ ...formData, annee: v as '1' | '2', option_nom: '' })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1ère année</SelectItem>
                  <SelectItem value="2">2ème année</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Option (only for 2ème année) */}
            {formData.annee === '2' && (
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="option_nom">
                  Option / Spécialité
                  <span className="text-muted-foreground text-xs ml-2">(laisser vide = tronc commun)</span>
                </Label>
                <Input
                  id="option_nom"
                  placeholder="Ex: Web Full Stack, Mobile Development…"
                  value={formData.option_nom}
                  onChange={e => setFormData({ ...formData, option_nom: e.target.value })}
                />
              </div>
            )}

            {/* Formateur */}
            <div className="space-y-2">
              <Label>Formateur <span className="text-destructive">*</span></Label>
              <Select
                value={formData.formateur_id || '__none__'}
                onValueChange={v => setFormData({ ...formData, formateur_id: v === '__none__' ? '' : v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un formateur" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__" disabled>Sélectionner un formateur</SelectItem>
                  {formateurs.map(f => (
                    <SelectItem key={f.id} value={String(f.id)}>
                      {f.prenom} {f.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Heures / semaine */}
            <div className="space-y-2">
              <Label htmlFor="heures">Heures / semaine <span className="text-destructive">*</span></Label>
              <Input
                id="heures"
                type="number"
                min="1"
                max="40"
                placeholder="Ex: 6"
                value={formData.heures_par_semaine}
                onChange={e => setFormData({ ...formData, heures_par_semaine: e.target.value })}
              />
            </div>

            {/* Coefficient */}
            <div className="space-y-2">
              <Label htmlFor="coef">Coefficient <span className="text-destructive">*</span></Label>
              <Input
                id="coef"
                type="number"
                min="0.5"
                max="10"
                step="0.5"
                placeholder="Ex: 3"
                value={formData.coefficient}
                onChange={e => setFormData({ ...formData, coefficient: e.target.value })}
              />
            </div>

          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)} disabled={isSaving}>
              Annuler
            </Button>
            <Button onClick={handleSubmit} disabled={isSaving}>
              {isSaving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {editing ? 'Enregistrer les modifications' : 'Ajouter le module'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
