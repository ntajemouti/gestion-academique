import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { DataTable, StatusBadge } from '@/components/DataTable';
import { getStatusBadgeColor, ROUTE_PATHS } from '@/lib/index';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Check, X, Eye, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import api from '@/api/client';

// ── API helpers ────────────────────────────────────────────────────────────────
const demandesApi = {
  list:    ()                              => api.get('/demandes'),
  approve: (id: number)                   => api.patch(`/demandes/${id}/approve`),
  reject:  (id: number)                   => api.patch(`/demandes/${id}/reject`),
  // fallback if your backend uses PUT with a statut field instead:
  updateStatut: (id: number, statut: string) => api.put(`/demandes/${id}`, { statut }),
};

// ── Types ──────────────────────────────────────────────────────────────────────
type DemandeStatut = 'En attente' | 'Approuvée' | 'Rejetée';
type FilterTab     = 'Toutes' | DemandeStatut;

interface User {
  id: number;
  prenom: string;
  nom: string;
  role: string;
}

interface Demande {
  id: number;
  reference: string;
  type: string;
  description: string;
  statut: DemandeStatut;
  fichier?: string;
  created_at: string;
  user_id: number;
  user?: User;
}

// ── Component ──────────────────────────────────────────────────────────────────
export default function AdminDemandes() {
  const { toast } = useToast();

  const [demandes,    setDemandes]    = useState<Demande[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [processing,  setProcessing]  = useState<number | null>(null); // id being processed
  const [filterStatus, setFilterStatus] = useState<FilterTab>('Toutes');
  const [selectedDemande, setSelectedDemande] = useState<Demande | null>(null);
  const [viewModalOpen,   setViewModalOpen]   = useState(false);

  // ── Fetch ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const demandesRes = await demandesApi.list();
        setDemandes(demandesRes.data?.data ?? demandesRes.data ?? []);
      } catch (err: any) {
        toast({
          title: 'Erreur de chargement',
          description: err.response?.data?.message || 'Impossible de charger les demandes.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  // ── Helpers ──────────────────────────────────────────────────────────────────
  
  const filteredDemandes = filterStatus === 'Toutes'
    ? demandes
    : demandes.filter((d) => d.statut === filterStatus);

  const counts = {
    all:       demandes.length,
    waiting:   demandes.filter((d) => d.statut === 'En attente').length,
    approved:  demandes.filter((d) => d.statut === 'Approuvée').length,
    rejected:  demandes.filter((d) => d.statut === 'Rejetée').length,
  };

  // ── Status change ─────────────────────────────────────────────────────────────
  const changeStatut = async (demande: Demande, statut: DemandeStatut) => {
    setProcessing(demande.id);
    try {
      // Try dedicated approve/reject endpoints first, fallback to updateStatut
      let res;
      if (statut === 'Approuvée') {
        res = await demandesApi.approve(demande.id).catch(() =>
          demandesApi.updateStatut(demande.id, statut));
      } else {
        res = await demandesApi.reject(demande.id).catch(() =>
          demandesApi.updateStatut(demande.id, statut));
      }
      const updated: Demande = res.data?.data ?? res.data ?? { ...demande, statut };
      setDemandes((prev) => prev.map((d) => (d.id === demande.id ? updated : d)));
      // Also update selectedDemande if the modal is open
      if (selectedDemande?.id === demande.id) setSelectedDemande(updated);
      toast({ title: statut === 'Approuvée' ? 'Demande approuvée' : 'Demande rejetée' });
    } catch (err: any) {
      toast({
        title: 'Erreur',
        description: err.response?.data?.message || 'Impossible de traiter la demande.',
        variant: 'destructive',
      });
    } finally {
      setProcessing(null);
    }
  };

  // ── Table columns ─────────────────────────────────────────────────────────────
  const columns = [
    {
      key: 'reference',
      label: 'Référence',
      render: (row: Demande) => (
        <span className="font-mono text-sm font-medium">{row.reference}</span>
      ),
    },
    {
      key: 'user',
      label: 'Demandeur',
      render: (row: Demande) => {
        const u = row.u;
        return (
          <div>
            <div className="font-medium">{u ? `${u.prenom} ${u.nom}` : '—'}</div>
            <div className="text-sm text-muted-foreground">{u?.role ?? ''}</div>
          </div>
        );
      },
    },
    {
      key: 'type',
      label: 'Type de demande',
      render: (row: Demande) => <span className="text-sm">{row.type}</span>,
    },
    {
      key: 'created_at',
      label: 'Date soumission',
      render: (row: Demande) => (
        <span className="text-sm text-muted-foreground">
          {row.created_at
            ? new Date(row.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
            : '—'}
        </span>
      ),
    },
    {
      key: 'statut',
      label: 'Statut',
      render: (row: Demande) => <StatusBadge status={row.statut} />,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row: Demande) => (
        <div className="flex items-center gap-1">
          {row.statut === 'En attente' && (
            <>
              <Button
                size="sm" variant="ghost"
                className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                disabled={processing === row.id}
                onClick={() => changeStatut(row, 'Approuvée')}
              >
                {processing === row.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              </Button>
              <Button
                size="sm" variant="ghost"
                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                disabled={processing === row.id}
                onClick={() => changeStatut(row, 'Rejetée')}
              >
                <X className="h-4 w-4" />
              </Button>
            </>
          )}
          <Button
            size="sm" variant="ghost"
            className="h-8 w-8 p-0 text-primary hover:text-primary/80"
            onClick={() => { setSelectedDemande(row); setViewModalOpen(true); }}
          >
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <AdminLayout currentPath={ROUTE_PATHS.ADMIN_DEMANDES}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gestion des Demandes</h1>
            <p className="text-muted-foreground mt-2">Gérez les demandes des stagiaires et formateurs</p>
          </div>
          <Badge variant="secondary" className="text-lg px-4 py-2">
            {filteredDemandes.length} demande{filteredDemandes.length > 1 ? 's' : ''}
          </Badge>
        </div>

        {/* Tabs */}
        <Tabs value={filterStatus} onValueChange={(v) => setFilterStatus(v as FilterTab)}>
          <TabsList className="grid w-full max-w-lg grid-cols-4">
            <TabsTrigger value="Toutes">Toutes ({counts.all})</TabsTrigger>
            <TabsTrigger value="En attente">En attente ({counts.waiting})</TabsTrigger>
            <TabsTrigger value="Approuvée">Approuvées ({counts.approved})</TabsTrigger>
            <TabsTrigger value="Rejetée">Rejetées ({counts.rejected})</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <DataTable columns={columns} data={filteredDemandes} title="" subtitle="" />
        )}
      </div>

      {/* ── View Modal ── */}
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Détails de la demande</DialogTitle>
            <DialogDescription>Informations complètes sur la demande</DialogDescription>
          </DialogHeader>
          {selectedDemande && (() => {
            const u = getUser(selectedDemande);
            return (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Référence</p>
                    <p className="font-mono text-sm font-medium mt-1">{selectedDemande.reference}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Statut</p>
                    <div className="mt-1">
                      <Badge className={getStatusBadgeColor(selectedDemande.statut)}>
                        {selectedDemande.statut}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Demandeur</p>
                    <p className="font-medium mt-1">{u ? `${u.prenom} ${u.nom}` : '—'}</p>
                    <p className="text-sm text-muted-foreground">{u?.role}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Date de soumission</p>
                    <p className="mt-1">
                      {selectedDemande.created_at
                        ? new Date(selectedDemande.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
                        : '—'}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-muted-foreground">Type de demande</p>
                  <p className="mt-1">{selectedDemande.type}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-muted-foreground">Description</p>
                  <p className="mt-1 text-sm leading-relaxed">{selectedDemande.description}</p>
                </div>

                {selectedDemande.fichier && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Fichier joint</p>
                    <a
                      href={selectedDemande.fichier}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 text-sm text-primary hover:underline"
                    >
                      {selectedDemande.fichier}
                    </a>
                  </div>
                )}

                {selectedDemande.statut === 'En attente' && (
                  <div className="flex gap-3 pt-4 border-t">
                    <Button
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      disabled={processing === selectedDemande.id}
                      onClick={() => changeStatut(selectedDemande, 'Approuvée')}
                    >
                      {processing === selectedDemande.id
                        ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        : <Check className="h-4 w-4 mr-2" />}
                      Approuver
                    </Button>
                    <Button
                      variant="destructive"
                      className="flex-1"
                      disabled={processing === selectedDemande.id}
                      onClick={() => changeStatut(selectedDemande, 'Rejetée')}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Rejeter
                    </Button>
                  </div>
                )}
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}