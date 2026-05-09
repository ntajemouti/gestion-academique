import { useEffect, useMemo, useState } from 'react';
import { UserLayout } from '@/components/UserLayout';
import { useAuth } from '@/hooks/useAuth';
import { notesApi } from '@/api/services';
import { ROUTE_PATHS, getNoteColor } from '@/lib/index';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ClipboardList, TrendingUp, Award, CheckCircle, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface Note {
  id: number;
  note: number;
  coefficient: number;
  date_evaluation: string;
  type_evaluation: string;
  commentaire: string | null;
  module: { id: number; code: string; nom: string; coefficient: number } | null;
  formateur: { id: number; prenom: string; nom: string } | null;
}

function getMention(m: number) {
  if (m >= 16) return 'Très Bien';
  if (m >= 14) return 'Bien';
  if (m >= 12) return 'Assez Bien';
  if (m >= 10) return 'Passable';
  return 'Insuffisant';
}

function getMentionColor(mention: string) {
  const map: Record<string, string> = {
    'Très Bien': 'bg-green-100 text-green-800',
    'Bien': 'bg-blue-100 text-blue-800',
    'Assez Bien': 'bg-yellow-100 text-yellow-800',
    'Passable': 'bg-orange-100 text-orange-800',
    'Insuffisant': 'bg-red-100 text-red-800',
  };
  return map[mention] || 'bg-gray-100';
}

export default function StagiaireNotes() {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await notesApi.list({ per_page: 200 });
        setNotes(data.data ?? data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const moyenne = useMemo(() => {
    if (notes.length === 0) return 0;
    const totalPondere = notes.reduce((sum, n) => sum + n.note * n.coefficient, 0);
    const totalCoeff = notes.reduce((sum, n) => sum + n.coefficient, 0);
    return totalCoeff > 0 ? totalPondere / totalCoeff : 0;
  }, [notes]);

  const mention = getMention(moyenne);
  const modulesValides = notes.filter(n => n.note >= 10).length;
  const chartData = notes.map(n => ({ module: n.module?.code ?? '?', note: n.note }));

  return (
    <UserLayout currentPath={ROUTE_PATHS.STAGIAIRE_NOTES}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Mes Notes</h1>
            <p className="text-muted-foreground mt-1">Consultez vos résultats académiques</p>
          </div>
          <Badge variant="outline" className="text-sm px-3 py-1">Année 2025-2026</Badge>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Moyenne Générale</CardTitle>
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-primary" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-primary">
                    {moyenne.toFixed(2)}<span className="text-xl text-muted-foreground">/20</span>
                  </div>
                  <Badge className={`mt-3 ${getMentionColor(mention)}`}>{mention}</Badge>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Modules Validés</CardTitle>
                  <div className="h-10 w-10 rounded-xl bg-green-100 flex items-center justify-center">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-foreground">
                    {modulesValides}<span className="text-xl text-muted-foreground">/{notes.length}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">Note minimale: 10/20</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Évaluations</CardTitle>
                  <div className="h-10 w-10 rounded-xl bg-purple-100 flex items-center justify-center">
                    <ClipboardList className="h-5 w-5 text-purple-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-foreground">{notes.length}</div>
                  <p className="text-xs text-muted-foreground mt-3">Modules évalués</p>
                </CardContent>
              </Card>
            </div>

            {chartData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-primary" />
                    Répartition des Notes par Module
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="module" tick={{ fill: '#64748b', fontSize: 12 }} />
                      <YAxis domain={[0, 20]} tick={{ fill: '#64748b', fontSize: 12 }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                        formatter={(value: number) => [`${value}/20`, 'Note']}
                      />
                      <Bar dataKey="note" radius={[8, 8, 0, 0]}>
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.note >= 12 ? '#16a34a' : entry.note >= 10 ? '#eab308' : '#dc2626'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardList className="h-5 w-5 text-primary" />
                  Détail des Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border border-border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="font-semibold">Module</TableHead>
                        <TableHead className="font-semibold text-center">Note</TableHead>
                        <TableHead className="font-semibold text-center">Coefficient</TableHead>
                        <TableHead className="font-semibold text-center">Note Pondérée</TableHead>
                        <TableHead className="font-semibold">Type</TableHead>
                        <TableHead className="font-semibold">Formateur</TableHead>
                        <TableHead className="font-semibold">Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {notes.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-muted-foreground py-8">Aucune note disponible</TableCell>
                        </TableRow>
                      ) : (
                        notes.map((note, index) => (
                          <TableRow key={note.id} className={index % 2 === 0 ? 'bg-muted/5' : ''}>
                            <TableCell>
                              <div>
                                <div className="font-medium text-foreground">{note.module?.nom ?? '—'}</div>
                                <div className="text-xs text-muted-foreground font-mono">{note.module?.code}</div>
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <span className={`text-lg font-bold ${getNoteColor(note.note)}`}>{note.note.toFixed(1)}</span>
                              <span className="text-sm text-muted-foreground">/20</span>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="outline" className="font-mono">x{note.coefficient}</Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <span className="font-semibold">{(note.note * note.coefficient).toFixed(2)}</span>
                            </TableCell>
                            <TableCell className="text-sm">{note.type_evaluation || '—'}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {note.formateur ? `${note.formateur.prenom} ${note.formateur.nom}` : '—'}
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                              {new Date(note.date_evaluation).toLocaleDateString('fr-FR')}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </UserLayout>
  );
}
