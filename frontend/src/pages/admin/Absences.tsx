import { useState } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { DataTable, StatusBadge } from '@/components/DataTable';
import { mockAbsences, mockUsers, mockModules, mockGroupes } from '@/data/index';
import { Absence, formatDate, ROUTE_PATHS } from '@/lib/index';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Plus, Users, CheckCircle, XCircle } from 'lucide-react';

export default function AdminAbsences() {
  const [absences, setAbsences] = useState<Absence[]>(mockAbsences);
  const [selectedGroupe, setSelectedGroupe] = useState<string>('all');
  const [selectedModule, setSelectedModule] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    stagiaireId: '',
    moduleId: '',
    date: '',
    justifiee: false,
    motif: '',
  });

  const stagiaires = mockUsers.filter((u) => u.role === 'Stagiaire');
  const formateurs = mockUsers.filter((u) => u.role === 'Formateur');

  const filteredAbsences = absences.filter((abs) => {
    const stagiaire = stagiaires.find((s) => s.id === abs.stagiaireId);
    const module = mockModules.find((m) => m.id === abs.moduleId);
    
    if (selectedGroupe !== 'all' && stagiaire?.groupeId !== selectedGroupe) return false;
    if (selectedModule !== 'all' && abs.moduleId !== selectedModule) return false;
    
    return true;
  });

  const totalAbsences = filteredAbsences.length;
  const absencesJustifiees = filteredAbsences.filter((a) => a.justifiee).length;
  const absencesNonJustifiees = totalAbsences - absencesJustifiees;

  const handleAddAbsence = () => {
    if (!formData.stagiaireId || !formData.moduleId || !formData.date) return;

    const stagiaire = stagiaires.find((s) => s.id === formData.stagiaireId);
    const module = mockModules.find((m) => m.id === formData.moduleId);
    if (!stagiaire || !module) return;

    const newAbsence: Absence = {
      id: `abs-${absences.length + 1}`,
      stagiaireId: formData.stagiaireId,
      moduleId: formData.moduleId,
      date: formData.date,
      justifiee: formData.justifiee,
      motif: formData.motif || undefined,
      formateurId: module.formateurId,
    };

    setAbsences([...absences, newAbsence]);
    setIsAddModalOpen(false);
    setFormData({
      stagiaireId: '',
      moduleId: '',
      date: '',
      justifiee: false,
      motif: '',
    });
  };

  const columns = [
    {
      key: 'date',
      label: 'Date',
      render: (row: Absence) => (
        <span className="font-medium">{formatDate(row.date)}</span>
      ),
    },
    {
      key: 'stagiaire',
      label: 'Stagiaire',
      render: (row: Absence) => {
        const stagiaire = stagiaires.find((s) => s.id === row.stagiaireId);
        return (
          <div>
            <div className="font-medium">{stagiaire?.prenom} {stagiaire?.nom}</div>
            <div className="text-sm text-muted-foreground font-mono">{stagiaire?.matricule}</div>
          </div>
        );
      },
    },
    {
      key: 'groupe',
      label: 'Groupe',
      render: (row: Absence) => {
        const stagiaire = stagiaires.find((s) => s.id === row.stagiaireId);
        const groupe = mockGroupes.find((g) => g.id === stagiaire?.groupeId);
        return <span className="text-sm">{groupe?.nom || '-'}</span>;
      },
    },
    {
      key: 'module',
      label: 'Module',
      render: (row: Absence) => {
        const module = mockModules.find((m) => m.id === row.moduleId);
        return (
          <div>
            <div className="font-medium">{module?.nom}</div>
            <div className="text-sm text-muted-foreground font-mono">{module?.code}</div>
          </div>
        );
      },
    },
    {
      key: 'formateur',
      label: 'Formateur',
      render: (row: Absence) => {
        const formateur = formateurs.find((f) => f.id === row.formateurId);
        return <span className="text-sm">{formateur?.prenom} {formateur?.nom}</span>;
      },
    },
    {
      key: 'justifiee',
      label: 'Justifiée',
      render: (row: Absence) => (
        <StatusBadge status={row.justifiee ? 'Oui' : 'Non'} />
      ),
    },
    {
      key: 'motif',
      label: 'Notes',
      render: (row: Absence) => (
        <span className="text-sm text-muted-foreground">{row.motif || '-'}</span>
      ),
    },
  ];

  return (
    <AdminLayout currentPath={ROUTE_PATHS.ADMIN_ABSENCES}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Gestion des Absences</h1>
            <p className="text-muted-foreground mt-1">Suivi et gestion des absences des stagiaires</p>
          </div>
          <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Ajouter une absence
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Nouvelle absence</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="stagiaire">Stagiaire</Label>
                  <Select
                    value={formData.stagiaireId}
                    onValueChange={(value) => setFormData({ ...formData, stagiaireId: value })}
                  >
                    <SelectTrigger id="stagiaire">
                      <SelectValue placeholder="Sélectionner un stagiaire" />
                    </SelectTrigger>
                    <SelectContent>
                      {stagiaires.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.prenom} {s.nom} ({s.matricule})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="module">Module</Label>
                  <Select
                    value={formData.moduleId}
                    onValueChange={(value) => setFormData({ ...formData, moduleId: value })}
                  >
                    <SelectTrigger id="module">
                      <SelectValue placeholder="Sélectionner un module" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockModules.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.nom} ({m.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="justifiee">Absence justifiée</Label>
                  <Switch
                    id="justifiee"
                    checked={formData.justifiee}
                    onCheckedChange={(checked) => setFormData({ ...formData, justifiee: checked })}
                  />
                </div>
                {formData.justifiee && (
                  <div className="space-y-2">
                    <Label htmlFor="motif">Motif</Label>
                    <Textarea
                      id="motif"
                      placeholder="Raison de l'absence..."
                      value={formData.motif}
                      onChange={(e) => setFormData({ ...formData, motif: e.target.value })}
                      rows={3}
                    />
                  </div>
                )}
                <Button onClick={handleAddAbsence} className="w-full">
                  Enregistrer l'absence
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total absences</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalAbsences}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Justifiées</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{absencesJustifiees}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Non justifiées</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{absencesNonJustifiees}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Label htmlFor="groupe-filter" className="text-sm font-medium">Filtrer par groupe</Label>
                <Select value={selectedGroupe} onValueChange={setSelectedGroupe}>
                  <SelectTrigger id="groupe-filter" className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les groupes</SelectItem>
                    {mockGroupes.map((g) => (
                      <SelectItem key={g.id} value={g.id}>
                        {g.nom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <Label htmlFor="module-filter" className="text-sm font-medium">Filtrer par module</Label>
                <Select value={selectedModule} onValueChange={setSelectedModule}>
                  <SelectTrigger id="module-filter" className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les modules</SelectItem>
                    {mockModules.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.nom} ({m.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={columns}
              data={filteredAbsences}
              title="Liste des absences"
              subtitle={`${filteredAbsences.length} absence(s) enregistrée(s)`}
            />
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}