import { useEffect, useState } from 'react';
import { UserLayout } from '@/components/UserLayout';
import { demandesApi } from '@/api/services';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Plus, FileText, Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Demande {
  id: number;
  reference: string;
  type: string;
  description: string;
  statut: 'En attente' | 'Approuvée' | 'Rejetée';
  created_at: string;
  fichier?: string | null;
  motif_rejet?: string | null;
}

const TYPES = ['Attestation de présence', 'Certificat de scolarité', 'Relevé de notes', 'Autre'];

export default function StagiaireDemandes() {
  const { toast } = useToast();
  const [demandes, setDemandes] = useState<Demande[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({ type: '', description: '', fichier: null as File | null });

  const load = async () => {
    try {
      const { data } = await demandesApi.list({ per_page: 100 });
      setDemandes(data.data ?? data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.type || !formData.description) {
      toast({ title: 'Erreur', description: 'Veuillez remplir tous les champs obligatoires', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('type', formData.type);
      fd.append('description', formData.description);
      if (formData.fichier) fd.append('fichier', formData.fichier);
      await demandesApi.create(fd);
      toast({ title: 'Demande créée', description: 'Votre demande a été soumise avec succès' });
      setIsModalOpen(false);
      setFormData({ type: '', description: '', fichier: null });
      await load();
    } catch (err: any) {
      toast({ title: 'Erreur', description: err.response?.data?.message ?? 'Une erreur est survenue.', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const statusIcon = (statut: Demande['statut']) => ({
    'En attente': <Clock className="w-4 h-4" />,
    'Approuvée': <CheckCircle className="w-4 h-4" />,
    'Rejetée': <XCircle className="w-4 h-4" />,
  }[statut]);

  const statusVariant = (statut: Demande['statut']): 'default' | 'secondary' | 'destructive' => ({
    'En attente': 'secondary' as const,
    'Approuvée': 'default' as const,
    'Rejetée': 'destructive' as const,
  }[statut]);

  return (
    <UserLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Mes Demandes</h1>
            <p className="text-muted-foreground mt-1">Gérez vos demandes administratives</p>
          </div>
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="w-4 h-4" />Nouvelle demande</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader><DialogTitle>Nouvelle demande</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Type de demande *</Label>
                  <Select value={formData.type || 'none'} onValueChange={v => setFormData({ ...formData, type: v === 'none' ? '' : v })}>
                    <SelectTrigger><SelectValue placeholder="Sélectionnez un type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sélectionnez un type</SelectItem>
                      {TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Description *</Label>
                  <Textarea
                    placeholder="Décrivez votre demande en détail..."
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    rows={4} required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Pièce jointe (optionnel)</Label>
                  <Input type="file" onChange={e => setFormData({ ...formData, fichier: e.target.files?.[0] || null })} />
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Annuler</Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Soumettre la demande
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="p-6">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
          ) : demandes.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Aucune demande pour le moment</p>
              <p className="text-sm text-muted-foreground mt-1">Cliquez sur "Nouvelle demande" pour créer votre première demande</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold">Référence</th>
                    <th className="text-left py-3 px-4 font-semibold">Type</th>
                    <th className="text-left py-3 px-4 font-semibold">Date</th>
                    <th className="text-left py-3 px-4 font-semibold">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {demandes.map(d => (
                    <tr key={d.id} className="border-b hover:bg-muted/5">
                      <td className="py-3 px-4"><span className="font-mono text-sm">{d.reference}</span></td>
                      <td className="py-3 px-4 text-sm">{d.type}</td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">
                        {new Date(d.created_at).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={statusVariant(d.statut)} className="gap-1">
                          {statusIcon(d.statut)}{d.statut}
                        </Badge>
                        {d.motif_rejet && <p className="text-xs text-red-600 mt-1">{d.motif_rejet}</p>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </UserLayout>
  );
}
