import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { DataTable } from '@/components/DataTable';
import { modulesApi, filieresApi, usersApi } from '@/api/services';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Module {
  id: number;
  code: string;
  nom: string;
  filiere_id: number | null;
  formateur_id: number | null;
  heures_par_semaine: number;
  coefficient: number;
  filiere?: { id: number; nom: string; color?: string };
  formateur?: { id: number; prenom: string; nom: string };
}

interface Filiere {
  id: number;
  nom: string;
  color?: string;
}

interface Formateur {
  id: number;
  prenom: string;
  nom: string;
}

const DEFAULT_FORM = {
  code: '',
  nom: '',
  filiere_id: '',
  formateur_id: '',
  heures_par_semaine: 0,
  coefficient: 0,
};

export default function AdminModules() {
  const [modules, setModules]       = useState<Module[]>([]);
  const [filieres, setFilieres]     = useState<Filiere[]>([]);
  const [formateurs, setFormateurs] = useState<Formateur[]>([]);
  const [isLoading, setIsLoading]   = useState(true);
  const [isSaving, setIsSaving]     = useState(false);
  const [isModalOpen, setIsModalOpen]     = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [formData, setFormData]           = useState(DEFAULT_FORM);
  const { toast } = useToast();

  // ── Load data ─────────────────────────────────────────────
  const loadAll = async () => {
    try {
      setIsLoading(true);
      const [modRes, filRes, forRes] = await Promise.all([
        modulesApi.list(),
        filieresApi.list(),
        usersApi.formateurs(),
      ]);
      setModules(Array.isArray(modRes.data) ? modRes.data : modRes.data.data ?? []);
      setFilieres(Array.isArray(filRes.data) ? filRes.data : filRes.data.data ?? []);
      setFormateurs(Array.isArray(forRes.data) ? forRes.data : forRes.data.data ?? []);
    } catch (error: any) {
      toast({
        title: 'Erreur de chargement',
        description: error.response?.data?.message || 'Impossible de charger les données.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, []);

  // ── Handlers ──────────────────────────────────────────────
  const handleAdd = () => {
    setEditingModule(null);
    setFormData(DEFAULT_FORM);
    setIsModalOpen(true);
  };

  const handleEdit = (row: Module) => {
    setEditingModule(row);
    setFormData({
      code:               row.code,
      nom:                row.nom,
      filiere_id:         row.filiere_id ? String(row.filiere_id) : '',
      formateur_id:       row.formateur_id ? String(row.formateur_id) : '',
      heures_par_semaine: row.heures_par_semaine,
      coefficient:        row.coefficient,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (row: Module) => {
    try {
      await modulesApi.delete(row.id);
      setModules(modules.filter(m => m.id !== row.id));
      toast({ title: 'Module supprimé', description: `${row.nom} a été supprimé.` });
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.response?.data?.message || 'Impossible de supprimer le module.',
        variant: 'destructive',
      });
    }
  };

  const handleSubmit = async () => {
    if (!formData.code || !formData.nom || !formData.filiere_id || !formData.formateur_id) {
      toast({
        title: 'Erreur',
        description: 'Veuillez remplir tous les champs obligatoires.',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        ...formData,
        filiere_id:   Number(formData.filiere_id),
        formateur_id: Number(formData.formateur_id),
      };

      if (editingModule) {
        const { data } = await modulesApi.update(editingModule.id, payload);
        setModules(modules.map(m => m.id === editingModule.id ? data : m));
        toast({ title: 'Module modifié', description: `${formData.nom} a été modifié.` });
      } else {
        const { data } = await modulesApi.create(payload);
        setModules([...modules, data]);
        toast({ title: 'Module ajouté', description: `${formData.nom} a été ajouté.` });
      }
      setIsModalOpen(false);
    } catch (error: any) {
      const errors = error.response?.data?.errors;
      const message = errors
        ? Object.values(errors).flat().join(' ')
        : error.response?.data?.message || 'Une erreur est survenue.';
      toast({ title: 'Erreur', description: message, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  // ── Columns ───────────────────────────────────────────────
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
      render: (row: Module) => (
        <span className="font-medium" style={{ color: row.filiere?.color || '#000' }}>
          {row.filiere?.nom || 'N/A'}
        </span>
      ),
    },
    {
      key: 'formateur',
      label: 'Formateur',
      render: (row: Module) =>
        row.formateur ? `${row.formateur.prenom} ${row.formateur.nom}` : 'N/A',
    },
    {
      key: 'heures_par_semaine',
      label: 'Heures/semaine',
      render: (row: Module) => `${row.heures_par_semaine}h`,
    },
    {
      key: 'coefficient',
      label: 'Coefficient',
      render: (row: Module) => (
        <span className="inline-flex items-center px-2 py-1 rounded-md bg-primary/10 text-primary text-sm font-medium">
          {row.coefficient}
        </span>
      ),
    },
  ];

  // ── Render ────────────────────────────────────────────────
  return (
    <AdminLayout currentPath="/admin/modules">
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Gestion des Modules</h1>
            <p className="text-muted-foreground mt-1">Gérez les modules de formation de l'institut</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
              {modules.length} modules
            </span>
            <Button onClick={handleAdd} className="gap-2">
              <Plus className="w-4 h-4" />
              Ajouter un module
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={modules}
            onAdd={handleAdd}
            onEdit={handleEdit}
            onDelete={handleDelete}
            title="Liste des modules"
            addLabel="Ajouter un module"
          />
        )}

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingModule ? 'Modifier le module' : 'Ajouter un module'}</DialogTitle>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="code">Code du module *</Label>
                <Input
                  id="code"
                  placeholder="Ex: WEB101"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="font-mono"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nom">Nom du module *</Label>
                <Input
                  id="nom"
                  placeholder="Ex: Développement Web Frontend"
                  value={formData.nom}
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="filiere">Filière *</Label>
                <Select
                  value={formData.filiere_id || 'none'}
                  onValueChange={(value) =>
                    setFormData({ ...formData, filiere_id: value === 'none' ? '' : value })
                  }
                >
                  <SelectTrigger id="filiere">
                    <SelectValue placeholder="Sélectionner une filière" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sélectionner une filière</SelectItem>
                    {filieres.map((f) => (
                      <SelectItem key={f.id} value={String(f.id)}>{f.nom}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="formateur">Formateur *</Label>
                <Select
                  value={formData.formateur_id || 'none'}
                  onValueChange={(value) =>
                    setFormData({ ...formData, formateur_id: value === 'none' ? '' : value })
                  }
                >
                  <SelectTrigger id="formateur">
                    <SelectValue placeholder="Sélectionner un formateur" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sélectionner un formateur</SelectItem>
                    {formateurs.map((f) => (
                      <SelectItem key={f.id} value={String(f.id)}>
                        {f.prenom} {f.nom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="heures">Heures par semaine *</Label>
                <Input
                  id="heures"
                  type="number"
                  min="0"
                  placeholder="Ex: 6"
                  value={formData.heures_par_semaine || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, heures_par_semaine: parseInt(e.target.value) || 0 })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="coefficient">Coefficient *</Label>
                <Input
                  id="coefficient"
                  type="number"
                  min="0"
                  placeholder="Ex: 3"
                  value={formData.coefficient || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, coefficient: parseInt(e.target.value) || 0 })
                  }
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsModalOpen(false)} disabled={isSaving}>
                Annuler
              </Button>
              <Button onClick={handleSubmit} disabled={isSaving}>
                {isSaving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {editingModule ? 'Modifier' : 'Ajouter'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
