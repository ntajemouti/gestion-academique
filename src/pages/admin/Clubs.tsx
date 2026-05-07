import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { DataTable, StatusBadge } from '@/components/DataTable';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Code, Shield, Brain, Palette, Rocket, Users, Plus, Grid, List, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { ROUTE_PATHS } from '@/lib/index';
import api from '@/api/client';
import { useToast } from '@/hooks/use-toast';

const iconMap: Record<string, any> = { Code, Shield, Brain, Palette, Rocket };

interface Club {
  id: number;
  nom: string;
  description: string;
  responsable_id: number | null;
  responsable?: { id: number; prenom: string; nom: string };
  capacite_max: number;
  nombre_membres: number;
  membres_count?: number;
  statut: string;
  icon: string;
  membres?: any[];
}

interface Formateur { id: number; prenom: string; nom: string; }

const emptyForm = { nom: '', description: '', responsable_id: '', capacite_max: '', icon: 'Code', statut: 'Actif' };

export default function AdminClubs() {
  const { toast } = useToast();
  const [clubs, setClubs]               = useState<Club[]>([]);
  const [formateurs, setFormateurs]     = useState<Formateur[]>([]);
  const [loading, setLoading]           = useState(true);
  const [viewMode, setViewMode]         = useState<'table' | 'grid'>('table');
  const [isAddModalOpen, setIsAddModalOpen]   = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  const [saving, setSaving]             = useState(false);
  const [formData, setFormData]         = useState(emptyForm);

  const fetchClubs = () => {
    setLoading(true);
    api.get('/clubs')
      .then(r => setClubs(Array.isArray(r.data) ? r.data : r.data.data ?? []))
      .catch(() => toast({ title: 'Erreur', description: 'Impossible de charger les clubs.', variant: 'destructive' }))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchClubs();
    api.get('/users/formateurs')
      .then(r => setFormateurs(Array.isArray(r.data) ? r.data : r.data.data ?? []));
  }, []);

  const membresCount = (c: Club) => c.nombre_membres ?? c.membres_count ?? 0;

  const handleAdd = () => { setFormData(emptyForm); setIsAddModalOpen(true); };

  const handleEdit = (club: Club) => {
    setSelectedClub(club);
    setFormData({
      nom: club.nom,
      description: club.description ?? '',
      responsable_id: club.responsable_id?.toString() ?? '',
      capacite_max: club.capacite_max?.toString() ?? '',
      icon: club.icon ?? 'Code',
      statut: club.statut ?? 'Actif',
    });
    setIsEditModalOpen(true);
  };

  const handleView = (club: Club) => {
    api.get(`/clubs/${club.id}`).then(r => { setSelectedClub(r.data); setIsViewModalOpen(true); });
  };

  const handleDelete = async (club: Club) => {
    if (!confirm(`Supprimer le club "${club.nom}" ?`)) return;
    try {
      await api.delete(`/clubs/${club.id}`);
      toast({ title: 'Club supprimé.' });
      fetchClubs();
    } catch {
      toast({ title: 'Erreur', description: 'Suppression impossible.', variant: 'destructive' });
    }
  };

  const handleSubmitAdd = async () => {
    setSaving(true);
    try {
      await api.post('/clubs', {
        nom: formData.nom,
        description: formData.description,
        responsable_id: formData.responsable_id || null,
        capacite_max: parseInt(formData.capacite_max),
        icon: formData.icon,
        statut: formData.statut,
      });
      toast({ title: 'Club créé avec succès.' });
      setIsAddModalOpen(false);
      fetchClubs();
    } catch {
      toast({ title: 'Erreur', description: 'Création impossible.', variant: 'destructive' });
    } finally { setSaving(false); }
  };

  const handleSubmitEdit = async () => {
    if (!selectedClub) return;
    setSaving(true);
    try {
      await api.put(`/clubs/${selectedClub.id}`, {
        nom: formData.nom,
        description: formData.description,
        responsable_id: formData.responsable_id || null,
        capacite_max: parseInt(formData.capacite_max),
        icon: formData.icon,
        statut: formData.statut,
      });
      toast({ title: 'Club modifié avec succès.' });
      setIsEditModalOpen(false);
      fetchClubs();
    } catch {
      toast({ title: 'Erreur', description: 'Modification impossible.', variant: 'destructive' });
    } finally { setSaving(false); }
  };

  const responsableName = (club: Club) =>
    club.responsable ? `${club.responsable.prenom} ${club.responsable.nom}` : '—';

  const columns = [
    { key: 'nom',         label: 'Nom du club' },
    { key: 'description', label: 'Description' },
    { key: 'responsable', label: 'Responsable' },
    { key: 'membres',     label: 'Membres' },
    { key: 'statut',      label: 'Statut' },
  ];

  const tableData = clubs.map(c => ({
    ...c,
    responsable: responsableName(c),
    membres: `${membresCount(c)} / ${c.capacite_max}`,
  }));

  const ClubForm = () => (
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <Label>Nom du club</Label>
        <Input value={formData.nom} onChange={e => setFormData({ ...formData, nom: e.target.value })} placeholder="Ex: Club Développement" />
      </div>
      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Description du club" rows={3} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Responsable</Label>
          <Select value={formData.responsable_id} onValueChange={v => setFormData({ ...formData, responsable_id: v })}>
            <SelectTrigger><SelectValue placeholder="Sélectionner un formateur" /></SelectTrigger>
            <SelectContent>
              {formateurs.map(f => (
                <SelectItem key={f.id} value={f.id.toString()}>{f.prenom} {f.nom}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Capacité maximale</Label>
          <Input type="number" value={formData.capacite_max} onChange={e => setFormData({ ...formData, capacite_max: e.target.value })} placeholder="Ex: 30" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Icône</Label>
          <Select value={formData.icon} onValueChange={v => setFormData({ ...formData, icon: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Code">Code (Développement)</SelectItem>
              <SelectItem value="Shield">Shield (Cybersécurité)</SelectItem>
              <SelectItem value="Brain">Brain (IA & Data)</SelectItem>
              <SelectItem value="Palette">Palette (Design)</SelectItem>
              <SelectItem value="Rocket">Rocket (Entrepreneuriat)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Statut</Label>
          <Select value={formData.statut} onValueChange={v => setFormData({ ...formData, statut: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Actif">Actif</SelectItem>
              <SelectItem value="Inactif">Inactif</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );

  return (
    <AdminLayout currentPath={ROUTE_PATHS.ADMIN_CLUBS}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Gestion des Clubs</h1>
            <p className="text-muted-foreground mt-1">
              {clubs.length} club{clubs.length !== 1 ? 's' : ''} enregistré{clubs.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant={viewMode === 'table' ? 'default' : 'outline'} size="icon" onClick={() => setViewMode('table')}><List className="h-4 w-4" /></Button>
            <Button variant={viewMode === 'grid'  ? 'default' : 'outline'} size="icon" onClick={() => setViewMode('grid')}><Grid className="h-4 w-4" /></Button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : viewMode === 'table' ? (
          <DataTable columns={columns} data={tableData} onAdd={handleAdd} onEdit={handleEdit} onDelete={handleDelete} onView={handleView} title="" addLabel="+ Ajouter un club" />
        ) : (
          <div>
            <div className="flex justify-end mb-4">
              <Button onClick={handleAdd}><Plus className="h-4 w-4 mr-2" />Ajouter un club</Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {clubs.map((club, index) => {
                const IconComponent = iconMap[club.icon] || Code;
                const count = membresCount(club);
                const progress = club.capacite_max > 0 ? (count / club.capacite_max) * 100 : 0;
                return (
                  <motion.div key={club.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
                    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleView(club)}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-3 rounded-xl bg-primary/10">
                              <IconComponent className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                              <CardTitle className="text-lg">{club.nom}</CardTitle>
                              <CardDescription className="text-sm mt-1">{responsableName(club)}</CardDescription>
                            </div>
                          </div>
                          <StatusBadge status={club.statut} />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{club.description}</p>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Membres</span>
                            <span className="font-medium">{count} / {club.capacite_max}</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div className="bg-primary h-2 rounded-full" style={{ width: `${Math.min(progress, 100)}%` }} />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>Ajouter un club</DialogTitle></DialogHeader>
            <ClubForm />
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>Annuler</Button>
              <Button onClick={handleSubmitAdd} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Ajouter
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>Modifier le club</DialogTitle></DialogHeader>
            <ClubForm />
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>Annuler</Button>
              <Button onClick={handleSubmitEdit} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Enregistrer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>Détails du club</DialogTitle></DialogHeader>
            {selectedClub && (() => {
              const IconComponent = iconMap[selectedClub.icon] || Code;
              const count = membresCount(selectedClub);
              return (
                <div className="space-y-6 py-4">
                  <div className="flex items-start gap-4">
                    <div className="p-4 rounded-xl bg-primary/10">
                      <IconComponent className="h-8 w-8 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold">{selectedClub.nom}</h3>
                      <p className="text-muted-foreground mt-1">{selectedClub.description}</p>
                    </div>
                    <StatusBadge status={selectedClub.statut} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><p className="text-sm text-muted-foreground">Responsable</p><p className="font-medium">{responsableName(selectedClub)}</p></div>
                    <div><p className="text-sm text-muted-foreground">Capacité</p><p className="font-medium">{count} / {selectedClub.capacite_max} membres</p></div>
                  </div>
                  {selectedClub.membres && selectedClub.membres.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-semibold flex items-center gap-2"><Users className="h-4 w-4" />Membres ({selectedClub.membres.length})</h4>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {selectedClub.membres.map((m: any) => (
                          <div key={m.id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-sm font-medium text-primary">{m.prenom?.charAt(0)}</span>
                            </div>
                            <span className="text-sm">{m.prenom} {m.nom}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" onClick={() => { setIsViewModalOpen(false); handleEdit(selectedClub); }}>Modifier</Button>
                    <Button variant="destructive" size="sm" onClick={() => { setIsViewModalOpen(false); handleDelete(selectedClub); }}>Supprimer</Button>
                  </div>
                </div>
              );
            })()}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsViewModalOpen(false)}>Fermer</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
