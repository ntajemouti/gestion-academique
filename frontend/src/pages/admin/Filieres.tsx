import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { DataTable, StatusBadge } from '@/components/DataTable';
import { filieresApi } from '@/api/services';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { LayoutGrid, Table as TableIcon, Plus, GraduationCap, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Filiere {
  id: number;
  code: string;
  nom: string;
  description: string;
  duree: number;
  statut: 'Actif' | 'Inactif';
  color?: string;
  groupes_count?: number;
}

const DEFAULT_FORM = {
  code: '',
  nom: '',
  description: '',
  duree: 2,
  statut: 'Actif' as 'Actif' | 'Inactif',
  color: '#2563eb',
};

export default function AdminFilieres() {
  const [filieres, setFilieres]       = useState<Filiere[]>([]);
  const [isLoading, setIsLoading]     = useState(true);
  const [viewMode, setViewMode]       = useState<'table' | 'grid'>('table');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving]       = useState(false);
  const [editingFiliere, setEditingFiliere] = useState<Filiere | null>(null);
  const [formData, setFormData]       = useState(DEFAULT_FORM);
  const { toast } = useToast();

  // ── Load filieres from API ────────────────────────────────
  const loadFilieres = async () => {
    try {
      setIsLoading(true);
      const { data } = await filieresApi.list();
      // Handle both { data: [...] } and [...] response shapes
      setFilieres(Array.isArray(data) ? data : data.data ?? []);
    } catch (error: any) {
      toast({
        title: 'Erreur de chargement',
        description: error.response?.data?.message || 'Impossible de charger les filières.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFilieres();
  }, []);

  // ── Handlers ──────────────────────────────────────────────
  const handleAdd = () => {
    setEditingFiliere(null);
    setFormData(DEFAULT_FORM);
    setIsModalOpen(true);
  };

  const handleEdit = (filiere: Filiere) => {
    setEditingFiliere(filiere);
    setFormData({
      code:        filiere.code,
      nom:         filiere.nom,
      description: filiere.description,
      duree:       filiere.duree,
      statut:      filiere.statut,
      color:       filiere.color ?? '#2563eb',
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (filiere: Filiere) => {
    try {
      await filieresApi.delete(filiere.id);
      setFilieres(filieres.filter((f) => f.id !== filiere.id));
      toast({ title: 'Filière supprimée', description: `${filiere.nom} a été supprimée.` });
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.response?.data?.message || 'Impossible de supprimer la filière.',
        variant: 'destructive',
      });
    }
  };

  const handleSubmit = async () => {
    if (!formData.code || !formData.nom || !formData.description) {
      toast({
        title: 'Erreur',
        description: 'Veuillez remplir tous les champs obligatoires.',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      if (editingFiliere) {
        const { data } = await filieresApi.update(editingFiliere.id, formData);
        setFilieres(filieres.map((f) => (f.id === editingFiliere.id ? data : f)));
        toast({ title: 'Filière modifiée', description: `${formData.nom} a été modifiée.` });
      } else {
        const { data } = await filieresApi.create(formData);
        setFilieres([...filieres, data]);
        toast({ title: 'Filière ajoutée', description: `${formData.nom} a été ajoutée.` });
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

  // ── Table columns ─────────────────────────────────────────
  const columns = [
    {
      key: 'code',
      label: 'Code',
      render: (row: Filiere) => (
        <span className="font-mono text-sm bg-muted px-2 py-1 rounded">{row.code}</span>
      ),
    },
    {
      key: 'nom',
      label: 'Nom de la filière',
      render: (row: Filiere) => (
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: row.color ?? '#2563eb' }} />
          <span className="font-medium">{row.nom}</span>
        </div>
      ),
    },
    {
      key: 'description',
      label: 'Description',
      render: (row: Filiere) => (
        <span className="text-sm text-muted-foreground line-clamp-2">{row.description}</span>
      ),
    },
    {
      key: 'duree',
      label: 'Durée',
      render: (row: Filiere) => <span className="text-sm">{row.duree} années</span>,
    },
    {
      key: 'groupes_count',
      label: 'Groupes',
      render: (row: Filiere) => <Badge variant="secondary">{row.groupes_count ?? 0}</Badge>,
    },
    {
      key: 'statut',
      label: 'Statut',
      render: (row: Filiere) => <StatusBadge status={row.statut} />,
    },
  ];

  // ── Render ────────────────────────────────────────────────
  return (
    <AdminLayout currentPath="/admin/filieres">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gestion des Filières</h1>
            <p className="text-muted-foreground mt-1">Gérez les filières de formation de l'institut</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant={viewMode === 'table' ? 'default' : 'outline'} size="icon" onClick={() => setViewMode('table')}>
              <TableIcon className="h-4 w-4" />
            </Button>
            <Button variant={viewMode === 'grid' ? 'default' : 'outline'} size="icon" onClick={() => setViewMode('grid')}>
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : viewMode === 'table' ? (
          <DataTable
            columns={columns}
            data={filieres}
            onAdd={handleAdd}
            onEdit={handleEdit}
            onDelete={handleDelete}
            title="Liste des filières"
            subtitle={`${filieres.length} filières au total`}
            addLabel="Ajouter une filière"
          />
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-semibold">Liste des filières</h2>
                <Badge variant="secondary">{filieres.length}</Badge>
              </div>
              <Button onClick={handleAdd}>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter une filière
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filieres.map((filiere) => (
                <Card key={filiere.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center"
                          style={{ backgroundColor: `${filiere.color ?? '#2563eb'}20` }}
                        >
                          <GraduationCap className="h-6 w-6" style={{ color: filiere.color ?? '#2563eb' }} />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{filiere.nom}</CardTitle>
                          <span className="text-xs font-mono text-muted-foreground">{filiere.code}</span>
                        </div>
                      </div>
                      <StatusBadge status={filiere.statut} />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <CardDescription className="line-clamp-3">{filiere.description}</CardDescription>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Durée</span>
                      <span className="font-medium">{filiere.duree} années</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Groupes</span>
                      <Badge variant="secondary">{filiere.groupes_count ?? 0}</Badge>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => handleEdit(filiere)}>
                        Modifier
                      </Button>
                      <Button variant="destructive" size="sm" className="flex-1" onClick={() => handleDelete(filiere)}>
                        Supprimer
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* ── Add / Edit Modal ── */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingFiliere ? 'Modifier la filière' : 'Ajouter une filière'}</DialogTitle>
              <DialogDescription>
                {editingFiliere ? 'Modifiez les informations de la filière' : 'Remplissez les informations de la nouvelle filière'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Code *</Label>
                  <Input
                    id="code"
                    placeholder="Ex: DEV"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duree">Durée (années) *</Label>
                  <Input
                    id="duree"
                    type="number"
                    min="1"
                    max="5"
                    value={formData.duree}
                    onChange={(e) => setFormData({ ...formData, duree: parseInt(e.target.value) })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="nom">Nom de la filière *</Label>
                <Input
                  id="nom"
                  placeholder="Ex: Développement Digital"
                  value={formData.nom}
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Décrivez la filière..."
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="color">Couleur</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="color"
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-20 h-10"
                  />
                  <span className="text-sm text-muted-foreground">{formData.color}</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="statut">Statut</Label>
                <select
                  id="statut"
                  className="w-full border rounded-md px-3 py-2 text-sm"
                  value={formData.statut}
                  onChange={(e) => setFormData({ ...formData, statut: e.target.value as 'Actif' | 'Inactif' })}
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
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {editingFiliere ? 'Modifier' : 'Ajouter'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}