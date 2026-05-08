import { useState } from 'react';
import { UserLayout } from '@/components/UserLayout';
import { useAuth } from '@/hooks/useAuth';
import { mockDemandes, mockUsers } from '@/data/index';
import { Demande, formatDate, getStatusBadgeColor } from '@/lib/index';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Plus, FileText, Clock, CheckCircle, XCircle, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function StagiaireDemandes() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDemande, setSelectedDemande] = useState<Demande | null>(null);
  const [formData, setFormData] = useState({
    type: '' as Demande['type'] | '',
    description: '',
    fichier: null as File | null,
  });

  const userDemandes = mockDemandes.filter((d) => d.userId === user?.id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.type || !formData.description) {
      toast({
        title: 'Erreur',
        description: 'Veuillez remplir tous les champs obligatoires',
        variant: 'destructive',
      });
      return;
    }

    const newDemande: Demande = {
      id: `dem-${Date.now()}`,
      reference: `DEM-2026-${String(mockDemandes.length + 1).padStart(3, '0')}`,
      userId: user!.id,
      type: formData.type as Demande['type'],
      description: formData.description,
      dateCreation: new Date().toISOString().split('T')[0],
      statut: 'En attente',
      fichier: formData.fichier?.name,
    };

    mockDemandes.push(newDemande);
    toast({
      title: 'Demande créée',
      description: `Votre demande ${newDemande.reference} a été soumise avec succès`,
    });
    setIsModalOpen(false);
    setFormData({ type: '', description: '', fichier: null });
  };

  const getStatusIcon = (statut: Demande['statut']) => {
    switch (statut) {
      case 'En attente':
        return <Clock className="w-4 h-4" />;
      case 'Approuvée':
        return <CheckCircle className="w-4 h-4" />;
      case 'Rejetée':
        return <XCircle className="w-4 h-4" />;
    }
  };

  const getTimelineSteps = (demande: Demande) => {
    const steps = [
      {
        label: 'Demande soumise',
        date: demande.dateCreation,
        completed: true,
      },
      {
        label: 'En cours de traitement',
        date: demande.statut !== 'En attente' ? demande.dateCreation : null,
        completed: demande.statut !== 'En attente',
      },
      {
        label: demande.statut === 'Approuvée' ? 'Approuvée' : demande.statut === 'Rejetée' ? 'Rejetée' : 'En attente de décision',
        date: demande.statut !== 'En attente' ? demande.dateCreation : null,
        completed: demande.statut !== 'En attente',
      },
    ];
    return steps;
  };

  return (
    <UserLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Mes Demandes</h1>
            <p className="text-muted-foreground mt-1">
              Gérez vos demandes administratives
            </p>
          </div>
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Nouvelle demande
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Nouvelle demande</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Type de demande *</Label>
                  <Select
                    value={formData.type || 'none'}
                    onValueChange={(value) =>
                      setFormData({ ...formData, type: value === 'none' ? '' : (value as Demande['type']) })
                    }
                  >
                    <SelectTrigger id="type">
                      <SelectValue placeholder="Sélectionnez un type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sélectionnez un type</SelectItem>
                      <SelectItem value="Attestation de présence">Attestation de présence</SelectItem>
                      <SelectItem value="Certificat de scolarité">Certificat de scolarité</SelectItem>
                      <SelectItem value="Relevé de notes">Relevé de notes</SelectItem>
                      <SelectItem value="Autre">Autre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="Décrivez votre demande en détail..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fichier">Pièce jointe (optionnel)</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="fichier"
                      type="file"
                      onChange={(e) =>
                        setFormData({ ...formData, fichier: e.target.files?.[0] || null })
                      }
                      className="flex-1"
                    />
                    <Upload className="w-5 h-5 text-muted-foreground" />
                  </div>
                  {formData.fichier && (
                    <p className="text-sm text-muted-foreground">Fichier: {formData.fichier.name}</p>
                  )}
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                    Annuler
                  </Button>
                  <Button type="submit">Soumettre la demande</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="p-6">
          <div className="space-y-4">
            {userDemandes.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Aucune demande pour le moment</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Cliquez sur "Nouvelle demande" pour créer votre première demande
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-semibold text-foreground">Référence</th>
                      <th className="text-left py-3 px-4 font-semibold text-foreground">Type</th>
                      <th className="text-left py-3 px-4 font-semibold text-foreground">Date soumission</th>
                      <th className="text-left py-3 px-4 font-semibold text-foreground">Statut</th>
                      <th className="text-left py-3 px-4 font-semibold text-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userDemandes.map((demande) => (
                      <tr key={demande.id} className="border-b hover:bg-muted/5 transition-colors">
                        <td className="py-3 px-4">
                          <span className="font-mono text-sm">{demande.reference}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm">{demande.type}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm text-muted-foreground">{formatDate(demande.dateCreation)}</span>
                        </td>
                        <td className="py-3 px-4">
                          <Badge className={`${getStatusBadgeColor(demande.statut)} gap-1`}>
                            {getStatusIcon(demande.statut)}
                            {demande.statut}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedDemande(demande)}
                          >
                            Détails
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </Card>

        {selectedDemande && (
          <Dialog open={!!selectedDemande} onOpenChange={() => setSelectedDemande(null)}>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Détails de la demande {selectedDemande.reference}</DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Type</Label>
                    <p className="font-medium">{selectedDemande.type}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Date de soumission</Label>
                    <p className="font-medium">{formatDate(selectedDemande.dateCreation)}</p>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-muted-foreground">Description</Label>
                    <p className="mt-1">{selectedDemande.description}</p>
                  </div>
                  {selectedDemande.fichier && (
                    <div className="col-span-2">
                      <Label className="text-muted-foreground">Pièce jointe</Label>
                      <p className="text-sm text-primary mt-1">{selectedDemande.fichier}</p>
                    </div>
                  )}
                </div>

                <div>
                  <Label className="text-lg font-semibold mb-4 block">Suivi de la demande</Label>
                  <div className="space-y-4">
                    {getTimelineSteps(selectedDemande).map((step, index) => (
                      <div key={index} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              step.completed ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            {step.completed ? (
                              <CheckCircle className="w-4 h-4" />
                            ) : (
                              <Clock className="w-4 h-4" />
                            )}
                          </div>
                          {index < getTimelineSteps(selectedDemande).length - 1 && (
                            <div
                              className={`w-0.5 h-12 ${
                                step.completed ? 'bg-primary' : 'bg-muted'
                              }`}
                            />
                          )}
                        </div>
                        <div className="flex-1 pb-8">
                          <p className={`font-medium ${
                            step.completed ? 'text-foreground' : 'text-muted-foreground'
                          }`}>
                            {step.label}
                          </p>
                          {step.date && (
                            <p className="text-sm text-muted-foreground mt-1">{formatDate(step.date)}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </UserLayout>
  );
}