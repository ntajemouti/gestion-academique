import { useEffect, useState } from 'react';
import { UserLayout } from '@/components/UserLayout';
import { demandesApi } from '@/api/services';
import { ROUTE_PATHS } from '@/lib/index';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  Plus, FileText, Clock, CheckCircle2, XCircle,
  Loader2, ClipboardList, AlertTriangle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type DemandeStatut = 'En attente' | 'Approuvée' | 'Rejetée';

interface Demande {
  id: number;
  reference: string;
  type: string;
  description: string;
  statut: DemandeStatut;
  created_at: string;
  motif_rejet?: string | null;
}

const TYPES_FORMATEUR = [
  'Attestation de travail',
  'Congé annuel',
  'Autorisation de sortie',
  'Demande de formation',
  'Modification de module',
  'Attestation de salaire',
  'Autre',
];

const STATUS_CONFIG: Record<DemandeStatut, { label: string; variant: 'default' | 'secondary' | 'destructive'; icon: React.ReactNode; cls: string }> = {
  'En attente': { label: 'En attente', variant: 'secondary', icon: <Clock className="w-3 h-3" />, cls: 'bg-yellow-100 text-yellow-800' },
  'Approuvée':  { label: 'Approuvée',  variant: 'default',   icon: <CheckCircle2 className="w-3 h-3" />, cls: 'bg-green-100 text-green-800' },
  'Rejetée':    { label: 'Rejetée',    variant: 'destructive', icon: <XCircle className="w-3 h-3" />, cls: 'bg-red-100 text-red-800' },
};

export default function FormateurDemandes() {
  const { toast }  = useToast();
  const [demandes,    setDemandes]    = useState<Demande[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting,  setSubmitting]  = useState(false);
  const [form, setForm] = useState({ type: '', description: '', fichier: null as File | null });

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await demandesApi.list({ per_page: 100 });
      setDemandes(data.data ?? data ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // ── Stats ────────────────────────────────────────────────
  const total       = demandes.length;
  const enAttente   = demandes.filter(d => d.statut === 'En attente').length;
  const approuvees  = demandes.filter(d => d.statut === 'Approuvée').length;
  const rejetees    = demandes.filter(d => d.statut === 'Rejetée').length;

  // ── Submit ───────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.type || !form.description.trim()) {
      toast({ title: 'Champs manquants', description: 'Le type et la description sont requis.', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('type', form.type);
      fd.append('description', form.description);
      if (form.fichier) fd.append('fichier', form.fichier);

      const { data } = await demandesApi.create(fd);
      const created  = data?.data ?? data;
      setDemandes(prev => [created, ...prev]);
      toast({ title: 'Demande soumise', description: `Référence : ${created.reference}` });
      setIsModalOpen(false);
      setForm({ type: '', description: '', fichier: null });
    } catch (err: any) {
      toast({
        title: 'Erreur',
        description: err.response?.data?.message ?? 'Impossible de soumettre la demande.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <UserLayout currentPath={ROUTE_PATHS.FORMATEUR_DEMANDES}>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Mes Demandes</h1>
            <p className="text-muted-foreground mt-1">Gérez vos demandes administratives</p>
          </div>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nouvelle demande
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total',       value: total,      icon: ClipboardList, cls: 'bg-muted/40',         iconCls: 'text-muted-foreground' },
            { label: 'En attente',  value: enAttente,  icon: Clock,         cls: 'bg-yellow-50',         iconCls: 'text-yellow-600' },
            { label: 'Approuvées',  value: approuvees, icon: CheckCircle2,  cls: 'bg-green-50',          iconCls: 'text-green-600' },
            { label: 'Rejetées',    value: rejetees,   icon: XCircle,       cls: 'bg-red-50',            iconCls: 'text-red-600' },
          ].map(s => {
            const Icon = s.icon;
            return (
              <Card key={s.label} className={`${s.cls} border-none`}>
                <CardContent className="pt-5 pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{s.label}</p>
                      <p className="text-3xl font-bold mt-1">{s.value}</p>
                    </div>
                    <Icon className={`w-8 h-8 ${s.iconCls} opacity-70`} />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Historique des demandes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : demandes.length === 0 ? (
              <div className="text-center py-14">
                <FileText className="w-14 h-14 text-muted-foreground mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium text-muted-foreground">Aucune demande</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Cliquez sur « Nouvelle demande » pour en créer une.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Référence</th>
                      <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Type</th>
                      <th className="text-left py-3 px-4 font-semibold text-muted-foreground hidden md:table-cell">Description</th>
                      <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Date</th>
                      <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {demandes.map((d, idx) => {
                      const cfg = STATUS_CONFIG[d.statut];
                      return (
                        <tr
                          key={d.id}
                          className={`border-b transition-colors hover:bg-muted/30 ${idx % 2 === 0 ? '' : 'bg-muted/10'}`}
                        >
                          <td className="py-3 px-4">
                            <span className="font-mono text-xs bg-muted px-2 py-1 rounded">{d.reference}</span>
                          </td>
                          <td className="py-3 px-4 font-medium">{d.type}</td>
                          <td className="py-3 px-4 text-muted-foreground max-w-xs truncate hidden md:table-cell">
                            {d.description}
                          </td>
                          <td className="py-3 px-4 text-muted-foreground">
                            {new Date(d.created_at).toLocaleDateString('fr-FR', {
                              day: '2-digit', month: 'short', year: 'numeric'
                            })}
                          </td>
                          <td className="py-3 px-4">
                            <div className="space-y-1">
                              <Badge className={`gap-1 ${cfg.cls} hover:${cfg.cls}`}>
                                {cfg.icon}
                                {cfg.label}
                              </Badge>
                              {d.statut === 'Rejetée' && d.motif_rejet && (
                                <div className="flex items-start gap-1 text-xs text-red-600">
                                  <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                  <span>{d.motif_rejet}</span>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── New demande modal ── */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary" />
              Nouvelle demande administrative
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="type">Type de demande <span className="text-destructive">*</span></Label>
              <Select
                value={form.type || '__none__'}
                onValueChange={v => setForm({ ...form, type: v === '__none__' ? '' : v })}
              >
                <SelectTrigger id="type">
                  <SelectValue placeholder="Sélectionnez un type…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__" disabled>Sélectionnez un type…</SelectItem>
                  {TYPES_FORMATEUR.map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description <span className="text-destructive">*</span></Label>
              <Textarea
                id="description"
                placeholder="Décrivez votre demande en détail…"
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                rows={4}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fichier">Pièce jointe <span className="text-muted-foreground text-xs">(optionnel)</span></Label>
              <Input
                id="fichier"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                onChange={e => setForm({ ...form, fichier: e.target.files?.[0] ?? null })}
              />
              <p className="text-xs text-muted-foreground">PDF, image ou document Word acceptés</p>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => { setIsModalOpen(false); setForm({ type: '', description: '', fichier: null }); }}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Soumettre la demande
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </UserLayout>
  );
}
