import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { DataTable, StatusBadge } from '@/components/DataTable';
import { groupesApi, filieresApi, usersApi } from '@/api/services';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Groupe {
  id: number;
  nom: string;
  filiere_id: number | null;
  niveau: string;
  annee: string;
  statut: 'Actif' | 'Inactif';
  filiere?: { id: number; nom: string };
  formateur_referent?: { id: number; prenom: string; nom: string };
  formateur_referent_id: number | null;
  stagiaires_count?: number;
}

interface Filiere  { id: number; nom: string }
interface Formateur { id: number; prenom: string; nom: string }

const DEFAULT_FORM = {
  nom: '',
  filiere_id: '',
  niveau: '',
  formateur_referent_id: '',
  annee: '2025-2026',
  statut: 'Actif' as 'Actif' | 'Inactif',
};

export default function AdminGroupes() {
  const [groupes, setGroupes]       = useState<Groupe[]>([]);
  const [filieres, setFilieres]     = useState<Filiere[]>([]);
  const [formateurs, setFormateurs] = useState<Formateur[]>([]);
  const [isLoading, setIsLoading]   = useState(true);
  const [isSaving, setIsSaving]     = useState(false);
  const [isModalOpen, setIsModalOpen]     = useState(false);
  const [editingGroupe, setEditingGroupe] = useState<Groupe | null>(null);
  const [formData, setFormData]           = useState(DEFAULT_FORM);
  const { toast } = useToast();

  // ── Load data ─────────────────────────────────────────────
  const loadAll = async () => {
    try {
      setIsLoading(true);
      const [grpRes, filRes, forRes] = await Promise.all([
        groupesApi.list(),
        filieresApi.list(),
        usersApi.formateurs(),
      ]);
      setGroupes(Array.isArray(grpRes.data) ? grpRes.data : grpRes.data.data ?? []);
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
    setEditingGroupe(null);
    setFormData(DEFAULT_FORM);
    setIsModalOpen(true);
  };

  const handleEdit = (row: Groupe) => {
    setEditingGroupe(row);
    setFormData({
      nom:                   row.nom,
      filiere_id:            row.filiere_id ? String(row.filiere_id) : '',
      niveau:                row.niveau,
      formateur_referent_id: row.formateur_referent_id ? String(row.formateur_referent_id) : '',
      annee:                 row.annee,
      statut:                row.statut,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (row: Groupe) => {
    try {
      await groupesApi.delete(row.id);
      setGroupes(groupes.filter(g => g.id !== row.id));
      toast({ title: 'Groupe supprimé', description: `${row.nom} a été supprimé.` });
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.response?.data?.message || 'Impossible de supprimer le groupe.',
        variant: 'destructive',
      });
    }
  };

  const handleSubmit = async () => {
    if (!formData.nom || !formData.filiere_id || !formData.niveau || !formData.formateur_referent_id) {
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
        filiere_id:            Number(formData.filiere_id),
        formateur_referent_id: Number(formData.formateur_referent_id),
      };

      if (editingGroupe) {
        const { data } = await groupesApi.update(editingGroupe.id, payload);
        setGroupes(groupes.map(g => g.id === editingGroupe.id ? data : g));
        toast({ title: 'Groupe modifié', description: `${formData.nom} a été modifié.` });
      } else {
        const { data } = await groupesApi.create(payload);
        setGroupes([...groupes, data]);
        toast({ title: 'Groupe ajouté', description: `${formData.nom} a été ajouté.` });
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
      key: 'nom',
      label: 'Nom du groupe',
      render: (row: Groupe) => <span className="font-medium">{row.nom}</span>,
    },
    {
      key: 'filiere',
      label: 'Filière',
      render: (row: Groupe) => row.filiere?.nom ?? '-',
    },
    {
      key: 'niveau',
      label: 'Niveau/Année',
      render: (row: Groupe) => <span>{row.niveau} — {row.annee}</span>,
    },
    {
      key: 'stagiaires_count',
      label: 'Stagiaires',
      render: (row: Groupe) => (
        <Badge variant="secondary">{row.stagiaires_count ?? 0}</Badge>
      ),
    },
    {
      key: 'formateur_referent',
      label: 'Formateur référent',
      render: (row: Groupe) =>
        row.formateur_referent
          ? `${row.formateur_referent.prenom} ${row.formateur_referent.nom}`
          : '-',
    },
    {
      key: 'statut',
      label: 'Statut',
      render: (row: Groupe) => <StatusBadge status={row.statut} />,
    },
  ];

  // ── Render ────────────────────────────────────────────────
  return (
    <AdminLayout currentPath="/admin/groupes">
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Gestion des Groupes</h1>
            <p className="text-muted-foreground mt-2">Gérez les groupes de stagiaires par filière et niveau</p>
          </div>
          <Button onClick={handleAdd} className="gap-2">
            <Plus className="w-4 h-4" />
            Ajouter un groupe
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={groupes}
            onAdd={handleAdd}
            onEdit={handleEdit}
            onDelete={handleDelete}
            title="Groupes"
            subtitle={`${groupes.length} groupes au total`}
            addLabel="Ajouter un groupe"
          />
        )}

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingGroupe ? 'Modifier le groupe' : 'Ajouter un groupe'}</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="nom">Nom du groupe *</Label>
                <Input
                  id="nom"
                  value={formData.nom}
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                  placeholder="Ex: DEV-101-A"
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
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une filière" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sélectionner une filière</SelectItem>
                    {filieres.map(f => (
                      <SelectItem key={f.id} value={String(f.id)}>{f.nom}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="niveau">Niveau *</Label>
                <Select
                  value={formData.niveau || 'none'}
                  onValueChange={(value) =>
                    setFormData({ ...formData, niveau: value === 'none' ? '' : value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un niveau" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sélectionner un niveau</SelectItem>
                    <SelectItem value="1ère année">1ère année</SelectItem>
                    <SelectItem value="2ème année">2ème année</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="annee">Année scolaire</Label>
                <Input
                  id="annee"
                  value={formData.annee}
                  onChange={(e) => setFormData({ ...formData, annee: e.target.value })}
                  placeholder="Ex: 2025-2026"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="formateur">Formateur référent *</Label>
                <Select
                  value={formData.formateur_referent_id || 'none'}
                  onValueChange={(value) =>
                    setFormData({ ...formData, formateur_referent_id: value === 'none' ? '' : value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un formateur" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sélectionner un formateur</SelectItem>
                    {formateurs.map(f => (
                      <SelectItem key={f.id} value={String(f.id)}>
                        {f.prenom} {f.nom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="statut">Statut</Label>
                <select
                  id="statut"
                  className="w-full border rounded-md px-3 py-2 text-sm"
                  value={formData.statut}
                  onChange={(e) =>
                    setFormData({ ...formData, statut: e.target.value as 'Actif' | 'Inactif' })
                  }
                >
                  <option value="Actif">Actif</option>
                  <option value="Inactif">Inactif</option>
                </select>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsModalOpen(false)} disabled={isSaving}>
                Annuler
              </Button>
              <Button onClick={handleSubmit} disabled={isSaving}>
                {isSaving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {editingGroupe ? 'Modifier' : 'Ajouter'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}