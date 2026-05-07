import React, { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { ROUTE_PATHS } from '@/lib/index';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Calendar, Table as TableIcon, Pencil, Trash2, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import api from '@/api/client';

// ── Constants ──────────────────────────────────────────────────────────────────
const JOURS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'] as const;
type Jour = typeof JOURS[number];

const TIME_SLOTS = [
  '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00', '18:00',
];

const PALETTE = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
  '#8b5cf6', '#ec4899', '#14b8a6', '#f97316',
];

// ── Types ──────────────────────────────────────────────────────────────────────
interface Filiere   { id: number; nom: string; code: string; color?: string }
interface Groupe    { id: number; nom: string; filiere_id: number; filiere?: Filiere; stagiaires_count?: number }
interface Module    { id: number; nom: string; code: string; filiere_id: number; filiere?: Filiere }
interface Formateur { id: number; prenom: string; nom: string }
interface Creneau   {
  id: number;
  jour: Jour;
  heure_debut: string;
  heure_fin: string;
  salle: string;
  groupe_id: number;
  module_id: number;
  formateur_id: number;
  module?: Module;
  formateur?: Formateur;
}

// ── API helpers ────────────────────────────────────────────────────────────────
const creneauxApi = {
  list:   (groupeId: number)             => api.get(`/emplois-du-temps?groupe_id=${groupeId}`),
  create: (data: object)                 => api.post('/emplois-du-temps', data),
  update: (id: number, data: object)     => api.put(`/emplois-du-temps/${id}`, data),
  delete: (id: number)                   => api.delete(`/emplois-du-temps/${id}`),
};

// ── Component ──────────────────────────────────────────────────────────────────
export default function AdminEmploisDuTemps() {
  const { toast } = useToast();

  // Reference data
  const [groupes,      setGroupes]      = useState<Groupe[]>([]);
  const [modules,      setModules]      = useState<Module[]>([]);
  const [formateurs,   setFormateurs]   = useState<Formateur[]>([]);
  const [refLoading,   setRefLoading]   = useState(true);

  // Schedule data
  const [creneaux,     setCreneaux]     = useState<Creneau[]>([]);
  const [schedLoading, setSchedLoading] = useState(false);

  const [selectedGroupeId, setSelectedGroupeId] = useState<number | null>(null);
  const [viewMode,         setViewMode]          = useState<'grid' | 'table'>('grid');
  const [isModalOpen,      setIsModalOpen]       = useState(false);
  const [editing,          setEditing]           = useState<Creneau | null>(null);
  const [saving,           setSaving]            = useState(false);

  const emptyForm = {
    jour:         'Lundi' as Jour,
    heure_debut:  '08:00',
    heure_fin:    '10:00',
    module_id:    '',
    formateur_id: '',
    salle:        '',
  };
  const [formData, setFormData] = useState(emptyForm);

  // ── Load reference data once ─────────────────────────────────────────────────
  useEffect(() => {
    const fetchRef = async () => {
      setRefLoading(true);
      try {
        const [grpRes, modRes, fmtRes] = await Promise.all([
          api.get('/groupes'),
          api.get('/modules'),
          api.get('/users/formateurs'),   // ← correct scoped endpoint, no 403
        ]);

        const grps = grpRes.data?.data ?? grpRes.data ?? [];
        const mods = modRes.data?.data  ?? modRes.data  ?? [];

        setGroupes(grps);
        setModules(mods);
        setFormateurs(fmtRes.data ?? []);

        if (grps.length > 0) setSelectedGroupeId(grps[0].id);
      } catch (err: any) {
        toast({
          title: 'Erreur de chargement',
          description: err.response?.data?.message || 'Impossible de charger les données.',
          variant: 'destructive',
        });
      } finally {
        setRefLoading(false);
      }
    };
    fetchRef();
  }, []);

  // ── Load schedule when group changes ─────────────────────────────────────────
  useEffect(() => {
    if (!selectedGroupeId) return;
    const fetchSchedule = async () => {
      setSchedLoading(true);
      try {
        const res = await creneauxApi.list(selectedGroupeId);
        const raw = res.data?.data ?? res.data ?? {};
        // API returns { Lundi: [...], Mardi: [...], ... } — flatten to array
        const flat: Creneau[] = Array.isArray(raw)
          ? raw
          : (Object.values(raw) as Creneau[][]).flat();
        setCreneaux(flat);
      } catch (err: any) {
        toast({
          title: 'Erreur',
          description: err.response?.data?.message || "Impossible de charger l'emploi du temps.",
          variant: 'destructive',
        });
      } finally {
        setSchedLoading(false);
      }
    };
    fetchSchedule();
  }, [selectedGroupeId]);

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const selectedGroupe = groupes.find((g) => g.id === selectedGroupeId);

  const filiereColor = (filiereId?: number): string => {
    if (!filiereId) return '#64748b';
    return PALETTE[filiereId % PALETTE.length];
  };

  const getSlotCreneau = (jour: Jour, heure: string) =>
    creneaux.find((c) => c.jour === jour && c.heure_debut === heure);

  // ── Modal handlers ────────────────────────────────────────────────────────────
  const openAdd = () => {
    setEditing(null);
    setFormData(emptyForm);
    setIsModalOpen(true);
  };

  const openEdit = (c: Creneau) => {
    setEditing(c);
    setFormData({
      jour:         c.jour,
      heure_debut:  c.heure_debut,
      heure_fin:    c.heure_fin,
      module_id:    String(c.module_id),
      formateur_id: String(c.formateur_id),
      salle:        c.salle,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.module_id || !formData.formateur_id || !formData.salle) {
      toast({ title: 'Champs manquants', description: 'Veuillez remplir tous les champs.', variant: 'destructive' });
      return;
    }
    setSaving(true);
    const payload = {
      jour:         formData.jour,
      heure_debut:  formData.heure_debut,
      heure_fin:    formData.heure_fin,
      salle:        formData.salle,
      groupe_id:    selectedGroupeId,
      module_id:    Number(formData.module_id),
      formateur_id: Number(formData.formateur_id),
    };
    try {
      if (editing) {
        const res = await creneauxApi.update(editing.id, payload);
        const updated = res.data?.data ?? res.data;
        setCreneaux((prev) => prev.map((c) => (c.id === editing.id ? updated : c)));
        toast({ title: 'Créneau modifié', description: 'Le créneau a été mis à jour.' });
      } else {
        const res = await creneauxApi.create(payload);
        const created = res.data?.data ?? res.data;
        setCreneaux((prev) => [...prev, created]);
        toast({ title: 'Créneau ajouté', description: 'Le créneau a été créé.' });
      }
      setIsModalOpen(false);
    } catch (err: any) {
      const errors = err.response?.data?.errors;
      const msg = errors
        ? Object.values(errors).flat().join(' ')
        : err.response?.data?.message || "Erreur lors de l'enregistrement.";
      toast({ title: 'Erreur', description: msg, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await creneauxApi.delete(id);
      setCreneaux((prev) => prev.filter((c) => c.id !== id));
      toast({ title: 'Créneau supprimé' });
    } catch (err: any) {
      toast({
        title: 'Erreur',
        description: err.response?.data?.message || 'Impossible de supprimer.',
        variant: 'destructive',
      });
    }
  };

  // ── Grid view ─────────────────────────────────────────────────────────────────
  const renderGrid = () => (
    <div className="overflow-x-auto">
      <div className="min-w-[1100px]">
        <div className="grid grid-cols-7 gap-2">
          {/* Header row */}
          <div className="bg-muted p-3 rounded-lg font-semibold text-center text-sm">Horaire</div>
          {JOURS.map((jour) => (
            <div key={jour} className="bg-muted p-3 rounded-lg font-semibold text-center text-sm">
              {jour}
            </div>
          ))}

          {/* Time rows — React.Fragment with key fixes the "unique key" warning */}
          {TIME_SLOTS.slice(0, -1).map((heure, idx) => (
            <React.Fragment key={`row-${heure}`}>
              <div className="bg-muted/50 p-3 rounded-lg text-center text-xs font-medium text-muted-foreground">
                {heure} – {TIME_SLOTS[idx + 1]}
              </div>
              {JOURS.map((jour) => {
                const creneau = getSlotCreneau(jour, heure);
                const mod     = creneau ? modules.find((m) => m.id === creneau.module_id) : null;
                const color   = mod ? filiereColor(mod.filiere_id) : '#64748b';
                const fmt     = creneau ? formateurs.find((f) => f.id === creneau.formateur_id) : null;

                return (
                  <div
                    key={`${jour}-${heure}`}
                    className="border border-border rounded-lg p-1 min-h-[90px] hover:shadow-sm transition-shadow"
                  >
                    {creneau && mod ? (
                      <div
                        className="h-full rounded-md p-2 text-white relative group cursor-default"
                        style={{ backgroundColor: color }}
                      >
                        <p className="font-semibold text-xs">{mod.code}</p>
                        <p className="text-xs opacity-90 truncate">{mod.nom}</p>
                        {fmt && <p className="text-xs opacity-80">{fmt.prenom} {fmt.nom}</p>}
                        <p className="text-xs opacity-80">{creneau.salle}</p>
                        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                          <button
                            onClick={() => openEdit(creneau)}
                            className="bg-white/20 hover:bg-white/30 p-1 rounded"
                          >
                            <Pencil className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => handleDelete(creneau.id)}
                            className="bg-white/20 hover:bg-white/30 p-1 rounded"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="h-full flex items-center justify-center text-muted-foreground text-xs">
                        Libre
                      </div>
                    )}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );

  // ── Table view ────────────────────────────────────────────────────────────────
  const renderTable = () => (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="text-left p-3 font-semibold">Jour</th>
            <th className="text-left p-3 font-semibold">Horaire</th>
            <th className="text-left p-3 font-semibold">Module</th>
            <th className="text-left p-3 font-semibold">Formateur</th>
            <th className="text-left p-3 font-semibold">Salle</th>
            <th className="text-left p-3 font-semibold">Filière</th>
            <th className="text-right p-3 font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody>
          {creneaux.length === 0 ? (
            <tr>
              <td colSpan={7} className="text-center py-12 text-muted-foreground">
                Aucun créneau pour ce groupe.
              </td>
            </tr>
          ) : (
            creneaux.map((c, idx) => {
              const mod   = modules.find((m) => m.id === c.module_id);
              const fmt   = formateurs.find((f) => f.id === c.formateur_id);
              const color = mod ? filiereColor(mod.filiere_id) : '#64748b';
              return (
                <tr
                  key={c.id}
                  className={`border-b hover:bg-muted/40 transition-colors ${idx % 2 === 0 ? 'bg-muted/10' : ''}`}
                >
                  <td className="p-3">{c.jour}</td>
                  <td className="p-3">{c.heure_debut} – {c.heure_fin}</td>
                  <td className="p-3">
                    <p className="font-medium">{mod?.code ?? '—'}</p>
                    <p className="text-xs text-muted-foreground">{mod?.nom}</p>
                  </td>
                  <td className="p-3">{fmt ? `${fmt.prenom} ${fmt.nom}` : '—'}</td>
                  <td className="p-3">{c.salle}</td>
                  <td className="p-3">
                    <Badge style={{ backgroundColor: color, color: 'white' }}>
                      {mod?.filiere?.code ?? mod?.filiere_id ?? '—'}
                    </Badge>
                  </td>
                  <td className="p-3">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(c)}>
                        <Pencil className="h-4 w-4 text-muted-foreground" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(c.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <AdminLayout currentPath={ROUTE_PATHS.ADMIN_EMPLOIS_DU_TEMPS}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Gestion des Emplois du Temps</h1>
            <p className="text-muted-foreground mt-1">Planification et organisation des cours</p>
          </div>
          <Button onClick={openAdd} disabled={!selectedGroupeId || refLoading}>
            <Plus className="h-4 w-4 mr-2" />
            Ajouter un créneau
          </Button>
        </div>

        <div className="bg-card rounded-xl shadow-sm p-6 space-y-6">
          {/* Controls */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="w-64">
                <Label>Groupe</Label>
                {refLoading ? (
                  <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" /> Chargement…
                  </div>
                ) : (
                  <Select
                    value={selectedGroupeId ? String(selectedGroupeId) : ''}
                    onValueChange={(v) => setSelectedGroupeId(Number(v))}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {groupes.map((g) => (
                        <SelectItem key={g.id} value={String(g.id)}>
                          {g.nom}{g.filiere ? ` – ${g.filiere.nom}` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              {selectedGroupe?.filiere && (
                <Badge style={{ backgroundColor: filiereColor(selectedGroupe.filiere_id), color: 'white' }}>
                  {selectedGroupe.filiere.code}
                </Badge>
              )}
            </div>

            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'grid' | 'table')}>
              <TabsList>
                <TabsTrigger value="grid">
                  <Calendar className="h-4 w-4 mr-2" />Grille
                </TabsTrigger>
                <TabsTrigger value="table">
                  <TableIcon className="h-4 w-4 mr-2" />Tableau
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Schedule content */}
          {schedLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : viewMode === 'grid' ? renderGrid() : renderTable()}
        </div>
      </div>

      {/* ── Add / Edit Modal ── */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? 'Modifier le créneau' : 'Ajouter un créneau'}</DialogTitle>
            <DialogDescription>Planifiez un cours dans l'emploi du temps</DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4">
            {/* Jour */}
            <div className="space-y-2">
              <Label>Jour</Label>
              <Select
                value={formData.jour}
                onValueChange={(v) => setFormData({ ...formData, jour: v as Jour })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {JOURS.map((j) => <SelectItem key={j} value={j}>{j}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Groupe (read-only display) */}
            <div className="space-y-2">
              <Label>Groupe</Label>
              <div className="border rounded-md px-3 py-2 text-sm bg-muted/40">
                {selectedGroupe?.nom ?? '—'}
              </div>
            </div>

            {/* Heure début */}
            <div className="space-y-2">
              <Label>Heure de début</Label>
              <Select
                value={formData.heure_debut}
                onValueChange={(v) => setFormData({ ...formData, heure_debut: v })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TIME_SLOTS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Heure fin */}
            <div className="space-y-2">
              <Label>Heure de fin</Label>
              <Select
                value={formData.heure_fin}
                onValueChange={(v) => setFormData({ ...formData, heure_fin: v })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TIME_SLOTS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Module */}
            <div className="space-y-2">
              <Label>Module</Label>
              <Select
                value={formData.module_id}
                onValueChange={(v) => setFormData({ ...formData, module_id: v })}
              >
                <SelectTrigger><SelectValue placeholder="Sélectionner un module" /></SelectTrigger>
                <SelectContent>
                  {modules.map((m) => (
                    <SelectItem key={m.id} value={String(m.id)}>
                      {m.code} – {m.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Formateur */}
            <div className="space-y-2">
              <Label>Formateur</Label>
              <Select
                value={formData.formateur_id}
                onValueChange={(v) => setFormData({ ...formData, formateur_id: v })}
              >
                <SelectTrigger><SelectValue placeholder="Sélectionner un formateur" /></SelectTrigger>
                <SelectContent>
                  {formateurs.map((f) => (
                    <SelectItem key={f.id} value={String(f.id)}>
                      {f.prenom} {f.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Salle */}
            <div className="col-span-2 space-y-2">
              <Label>Salle</Label>
              <Input
                value={formData.salle}
                onChange={(e) => setFormData({ ...formData, salle: e.target.value })}
                placeholder="Ex: Salle A101"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Annuler</Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editing ? 'Modifier' : 'Ajouter'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}