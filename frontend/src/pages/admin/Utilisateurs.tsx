import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { DataTable, StatusBadge } from '@/components/DataTable';
import { User, UserRole, ROUTE_PATHS } from '@/lib/index';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Plus, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import api from '@/api/client';

// ── API helpers ────────────────────────────────────────────────────────────────
const usersApi = {
  list: () => api.get('/users'),
  create: (data: object) => api.post('/users', data),
  update: (id: number, data: object) => api.put(`/users/${id}`, data),
  delete: (id: number) => api.delete(`/users/${id}`),
};

const filieresApi = {
  list: () => api.get('/filieres'),
};

const groupesApi = {
  list: () => api.get('/groupes'),
};

// ── Types ──────────────────────────────────────────────────────────────────────
interface ApiUser {
  id: number;
  matricule: string;
  prenom: string;
  nom: string;
  email: string;
  role: UserRole;
  statut: string;
  specialite?: string;
  groupe_id?: number;
  filiere_id?: number;
  groupe?: { id: number; nom: string };
  filiere?: { id: number; nom: string };
}

interface Filiere {
  id: number;
  nom: string;
}

interface Groupe {
  id: number;
  nom: string;
  filiere_id: number;
}

const getRoleBadgeColor = (role: UserRole): string => {
  switch (role) {
    case 'Administrateur': return 'bg-purple-100 text-purple-800';
    case 'Formateur':      return 'bg-green-100 text-green-800';
    case 'Stagiaire':      return 'bg-blue-100 text-blue-800';
    default:               return 'bg-gray-100 text-gray-800';
  }
};

// ── Component ──────────────────────────────────────────────────────────────────
export default function AdminUtilisateurs() {
  const { toast } = useToast();

  const [users, setUsers]       = useState<ApiUser[]>([]);
  const [filieres, setFilieres] = useState<Filiere[]>([]);
  const [groupes, setGroupes]   = useState<Groupe[]>([]);
  const [loading, setLoading]   = useState(true);

  const [selectedTab, setSelectedTab]           = useState<string>('tous');
  const [isAddDialogOpen, setIsAddDialogOpen]   = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser]         = useState<ApiUser | null>(null);
  const [saving, setSaving]                     = useState(false);

  const emptyForm = {
    prenom: '',
    nom: '',
    email: '',
    role: 'Stagiaire' as UserRole,
    filiere_id: '',
    groupe_id: '',
    specialite: '',
    password: '',
  };
  const [formData, setFormData] = useState(emptyForm);

  // ── Fetch all data on mount ──────────────────────────────────────────────────
  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [usersRes, filieresRes, groupesRes] = await Promise.all([
          usersApi.list(),
          filieresApi.list(),
          groupesApi.list(),
        ]);
        setUsers(usersRes.data?.data ?? usersRes.data);
        setFilieres(filieresRes.data?.data ?? filieresRes.data);
        setGroupes(groupesRes.data?.data ?? groupesRes.data);
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

  // ── Filtering by tab ─────────────────────────────────────────────────────────
  const filteredUsers = (() => {
    switch (selectedTab) {
      case 'stagiaires':      return users.filter((u) => u.role === 'Stagiaire');
      case 'formateurs':      return users.filter((u) => u.role === 'Formateur');
      case 'administrateurs': return users.filter((u) => u.role === 'Administrateur');
      default:                return users;
    }
  })();

  // ── Table columns ────────────────────────────────────────────────────────────
  const columns = [
    {
      key: 'matricule',
      label: 'Matricule',
      render: (row: ApiUser) => (
        <span className="font-mono text-sm font-medium">{row.matricule}</span>
      ),
    },
    {
      key: 'nom',
      label: 'Nom complet',
      render: (row: ApiUser) => (
        <div className="font-medium">{row.prenom} {row.nom}</div>
      ),
    },
    {
      key: 'email',
      label: 'Email',
      render: (row: ApiUser) => (
        <span className="text-sm text-muted-foreground">{row.email}</span>
      ),
    },
    {
      key: 'role',
      label: 'Rôle',
      render: (row: ApiUser) => (
        <Badge className={getRoleBadgeColor(row.role)}>{row.role}</Badge>
      ),
    },
    {
      key: 'groupe',
      label: 'Groupe / Filière / Spécialité',
      render: (row: ApiUser) => {
        if (row.role === 'Stagiaire' && row.groupe) {
          return <span className="text-sm">{row.groupe.nom} — {row.filiere?.nom ?? ''}</span>;
        }
        if (row.role === 'Formateur' && row.specialite) {
          return <span className="text-sm">{row.specialite}</span>;
        }
        return <span className="text-sm text-muted-foreground">—</span>;
      },
    },
    {
      key: 'statut',
      label: 'Statut',
      render: (row: ApiUser) => <StatusBadge status={row.statut} />,
    },
  ];

  // ── Handlers ──────────────────────────────────────────────────────────────────
  const handleAdd = () => {
    setFormData(emptyForm);
    setIsAddDialogOpen(true);
  };

  const handleEdit = (user: ApiUser) => {
    setSelectedUser(user);
    setFormData({
      prenom:     user.prenom,
      nom:        user.nom,
      email:      user.email,
      role:       user.role,
      filiere_id: user.filiere_id ? String(user.filiere_id) : '',
      groupe_id:  user.groupe_id  ? String(user.groupe_id)  : '',
      specialite: user.specialite ?? '',
      password:   '',
    });
    setIsEditDialogOpen(true);
  };

  const handleView = (user: ApiUser) => {
    setSelectedUser(user);
    setIsViewDialogOpen(true);
  };

  const handleDelete = async (user: ApiUser) => {
    try {
      await usersApi.delete(user.id);
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
      toast({ title: 'Utilisateur supprimé', description: `${user.prenom} ${user.nom} supprimé.` });
    } catch (err: any) {
      toast({
        title: 'Erreur',
        description: err.response?.data?.message || 'Impossible de supprimer.',
        variant: 'destructive',
      });
    }
  };

  const buildPayload = () => ({
    prenom:     formData.prenom,
    nom:        formData.nom,
    email:      formData.email,
    role:       formData.role,
    password:   formData.password || undefined,
    password_confirmation: formData.password || undefined,
    filiere_id: formData.role === 'Stagiaire' && formData.filiere_id ? Number(formData.filiere_id) : null,
    groupe_id:  formData.role === 'Stagiaire' && formData.groupe_id  ? Number(formData.groupe_id)  : null,
    specialite: formData.role === 'Formateur' ? formData.specialite : null,
  });

  const handleSubmitAdd = async () => {
    setSaving(true);
    try {
      const res = await usersApi.create(buildPayload());
      const newUser = res.data?.data ?? res.data;
      setUsers((prev) => [...prev, newUser]);
      setIsAddDialogOpen(false);
      toast({ title: 'Utilisateur ajouté', description: `${formData.prenom} ${formData.nom} créé.` });
    } catch (err: any) {
      const errors = err.response?.data?.errors;
      const msg = errors
        ? Object.values(errors).flat().join(' ')
        : err.response?.data?.message || 'Erreur lors de la création.';
      toast({ title: 'Erreur', description: msg, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitEdit = async () => {
    if (!selectedUser) return;
    setSaving(true);
    try {
      const res = await usersApi.update(selectedUser.id, buildPayload());
      const updated = res.data?.data ?? res.data;
      setUsers((prev) => prev.map((u) => (u.id === selectedUser.id ? updated : u)));
      setIsEditDialogOpen(false);
      toast({ title: 'Utilisateur modifié', description: `${formData.prenom} ${formData.nom} mis à jour.` });
    } catch (err: any) {
      const errors = err.response?.data?.errors;
      const msg = errors
        ? Object.values(errors).flat().join(' ')
        : err.response?.data?.message || 'Erreur lors de la modification.';
      toast({ title: 'Erreur', description: msg, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  // ── Filtered groupes for selected filiere ────────────────────────────────────
  const filteredGroupes = groupes.filter(
    (g) => String(g.filiere_id) === formData.filiere_id,
  );

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <AdminLayout currentPath={ROUTE_PATHS.ADMIN_UTILISATEURS}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gestion des Utilisateurs</h1>
            <p className="text-muted-foreground mt-2">
              Gérez les comptes des stagiaires, formateurs et administrateurs
            </p>
          </div>
          <Button onClick={handleAdd} className="gap-2">
            <Plus className="h-4 w-4" />
            Ajouter un utilisateur
          </Button>
        </div>

        {/* Loader */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="grid w-full max-w-md grid-cols-4">
              <TabsTrigger value="tous">Tous ({users.length})</TabsTrigger>
              <TabsTrigger value="stagiaires">
                Stagiaires ({users.filter(Boolean).filter((u) => u.role === 'Stagiaire').length})
              </TabsTrigger>
              <TabsTrigger value="formateurs">
                Formateurs ({users.filter(Boolean).filter((u) => u.role === 'Formateur').length})
              </TabsTrigger>
              <TabsTrigger value="administrateurs">
                Admins ({users.filter(Boolean).filter((u) => u.role === 'Administrateur').length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={selectedTab} className="mt-6">
              <DataTable
                columns={columns}
                data={filteredUsers}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onView={handleView}
                title=""
              />
            </TabsContent>
          </Tabs>
        )}

        {/* ── Add Dialog ── */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Ajouter un utilisateur</DialogTitle>
              <DialogDescription>
                Remplissez les informations pour créer un nouveau compte utilisateur.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Prénom</Label>
                  <Input
                    value={formData.prenom}
                    onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                    placeholder="Prénom"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nom</Label>
                  <Input
                    value={formData.nom}
                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                    placeholder="Nom"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@myista.ma"
                />
              </div>
              <div className="space-y-2">
                <Label>Rôle</Label>
                <Select
                  value={formData.role}
                  onValueChange={(v) =>
                    setFormData({ ...formData, role: v as UserRole, filiere_id: '', groupe_id: '', specialite: '' })
                  }
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Stagiaire">Stagiaire</SelectItem>
                    <SelectItem value="Formateur">Formateur</SelectItem>
                    <SelectItem value="Administrateur">Administrateur</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.role === 'Stagiaire' && (
                <>
                  <div className="space-y-2">
                    <Label>Filière</Label>
                    <Select
                      value={formData.filiere_id}
                      onValueChange={(v) => setFormData({ ...formData, filiere_id: v, groupe_id: '' })}
                    >
                      <SelectTrigger><SelectValue placeholder="Sélectionner une filière" /></SelectTrigger>
                      <SelectContent>
                        {filieres.map((f) => (
                          <SelectItem key={f.id} value={String(f.id)}>{f.nom}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Groupe</Label>
                    <Select
                      value={formData.groupe_id}
                      onValueChange={(v) => setFormData({ ...formData, groupe_id: v })}
                      disabled={!formData.filiere_id}
                    >
                      <SelectTrigger><SelectValue placeholder="Sélectionner un groupe" /></SelectTrigger>
                      <SelectContent>
                        {filteredGroupes.map((g) => (
                          <SelectItem key={g.id} value={String(g.id)}>{g.nom}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              {formData.role === 'Formateur' && (
                <div className="space-y-2">
                  <Label>Spécialité</Label>
                  <Input
                    value={formData.specialite}
                    onChange={(e) => setFormData({ ...formData, specialite: e.target.value })}
                    placeholder="Ex: Développement Web"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label>Mot de passe</Label>
                <Input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Mot de passe"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Annuler</Button>
              <Button onClick={handleSubmitAdd} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Ajouter
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ── Edit Dialog ── */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Modifier l'utilisateur</DialogTitle>
              <DialogDescription>Modifiez les informations de l'utilisateur.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Prénom</Label>
                  <Input
                    value={formData.prenom}
                    onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nom</Label>
                  <Input
                    value={formData.nom}
                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Rôle</Label>
                <Select
                  value={formData.role}
                  onValueChange={(v) =>
                    setFormData({ ...formData, role: v as UserRole, filiere_id: '', groupe_id: '', specialite: '' })
                  }
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Stagiaire">Stagiaire</SelectItem>
                    <SelectItem value="Formateur">Formateur</SelectItem>
                    <SelectItem value="Administrateur">Administrateur</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.role === 'Stagiaire' && (
                <>
                  <div className="space-y-2">
                    <Label>Filière</Label>
                    <Select
                      value={formData.filiere_id}
                      onValueChange={(v) => setFormData({ ...formData, filiere_id: v, groupe_id: '' })}
                    >
                      <SelectTrigger><SelectValue placeholder="Sélectionner une filière" /></SelectTrigger>
                      <SelectContent>
                        {filieres.map((f) => (
                          <SelectItem key={f.id} value={String(f.id)}>{f.nom}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Groupe</Label>
                    <Select
                      value={formData.groupe_id}
                      onValueChange={(v) => setFormData({ ...formData, groupe_id: v })}
                      disabled={!formData.filiere_id}
                    >
                      <SelectTrigger><SelectValue placeholder="Sélectionner un groupe" /></SelectTrigger>
                      <SelectContent>
                        {filteredGroupes.map((g) => (
                          <SelectItem key={g.id} value={String(g.id)}>{g.nom}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              {formData.role === 'Formateur' && (
                <div className="space-y-2">
                  <Label>Spécialité</Label>
                  <Input
                    value={formData.specialite}
                    onChange={(e) => setFormData({ ...formData, specialite: e.target.value })}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label>Nouveau mot de passe <span className="text-muted-foreground text-xs">(laisser vide pour ne pas changer)</span></Label>
                <Input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Annuler</Button>
              <Button onClick={handleSubmitEdit} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Enregistrer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ── View Dialog ── */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Détails de l'utilisateur</DialogTitle>
            </DialogHeader>
            {selectedUser && (
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Matricule</Label>
                    <p className="font-mono font-medium">{selectedUser.matricule}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Statut</Label>
                    <div className="mt-1"><StatusBadge status={selectedUser.statut} /></div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Prénom</Label>
                    <p className="font-medium">{selectedUser.prenom}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Nom</Label>
                    <p className="font-medium">{selectedUser.nom}</p>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Email</Label>
                  <p className="font-medium">{selectedUser.email}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Rôle</Label>
                  <div className="mt-1">
                    <Badge className={getRoleBadgeColor(selectedUser.role)}>{selectedUser.role}</Badge>
                  </div>
                </div>
                {selectedUser.role === 'Stagiaire' && selectedUser.groupe && (
                  <div>
                    <Label className="text-muted-foreground">Groupe / Filière</Label>
                    <p className="font-medium">
                      {selectedUser.groupe.nom} — {selectedUser.filiere?.nom ?? ''}
                    </p>
                  </div>
                )}
                {selectedUser.role === 'Formateur' && selectedUser.specialite && (
                  <div>
                    <Label className="text-muted-foreground">Spécialité</Label>
                    <p className="font-medium">{selectedUser.specialite}</p>
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
              <Button onClick={() => setIsViewDialogOpen(false)}>Fermer</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}