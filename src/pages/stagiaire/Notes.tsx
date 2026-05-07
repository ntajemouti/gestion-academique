import { useMemo } from 'react';
import { UserLayout } from '@/components/UserLayout';
import { useAuth } from '@/hooks/useAuth';
import {
  mockNotes,
  mockModules,
  mockFilieres,
  mockUsers,
} from '@/data/index';
import {
  formatDate,
  calculateNotePonderee,
  calculateMoyenne,
  getMention,
  getNoteColor,
  ROUTE_PATHS,
} from '@/lib/index';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ClipboardList, TrendingUp, Award, CheckCircle } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

export default function StagiaireNotes() {
  const { user } = useAuth();

  const userNotes = useMemo(() => {
    if (!user) return [];
    return mockNotes.filter((note) => note.stagiaireId === user.id);
  }, [user]);

  const notesWithDetails = useMemo(() => {
    return userNotes.map((note) => {
      const module = mockModules.find((m) => m.id === note.moduleId);
      const filiere = mockFilieres.find((f) => f.id === module?.filiereId);
      const formateur = mockUsers.find((u) => u.id === note.formateurId);
      return {
        ...note,
        moduleName: module?.nom || 'Module inconnu',
        moduleCode: module?.code || '',
        filiereName: filiere?.nom || '',
        formateurName: formateur
          ? `${formateur.prenom} ${formateur.nom}`
          : '',
        notePonderee: calculateNotePonderee(note.note, note.coefficient),
      };
    });
  }, [userNotes]);

  const moyenne = useMemo(() => {
    return calculateMoyenne(userNotes);
  }, [userNotes]);

  const mention = useMemo(() => {
    return getMention(moyenne);
  }, [moyenne]);

  const modulesValides = useMemo(() => {
    return userNotes.filter((note) => note.note >= 10).length;
  }, [userNotes]);

  const chartData = useMemo(() => {
    return notesWithDetails.map((note) => ({
      module: note.moduleCode,
      note: note.note,
    }));
  }, [notesWithDetails]);

  const getBarColor = (note: number): string => {
    if (note >= 12) return '#16a34a';
    if (note >= 10) return '#eab308';
    return '#dc2626';
  };

  const getMentionColor = (mention: string): string => {
    switch (mention) {
      case 'Très Bien':
        return 'bg-green-100 text-green-800';
      case 'Bien':
        return 'bg-blue-100 text-blue-800';
      case 'Assez Bien':
        return 'bg-yellow-100 text-yellow-800';
      case 'Passable':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-red-100 text-red-800';
    }
  };

  return (
    <UserLayout currentPath={ROUTE_PATHS.STAGIAIRE_NOTES}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Mes Notes</h1>
            <p className="text-muted-foreground mt-1">
              Consultez vos résultats académiques
            </p>
          </div>
          <Badge variant="outline" className="text-sm px-3 py-1">
            Année 2025-2026
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Moyenne Générale
              </CardTitle>
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-primary">
                {moyenne.toFixed(2)}
                <span className="text-xl text-muted-foreground">/20</span>
              </div>
              <Badge className={`mt-3 ${getMentionColor(mention)}`}>
                {mention}
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Modules Validés
              </CardTitle>
              <div className="h-10 w-10 rounded-xl bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-foreground">
                {modulesValides}
                <span className="text-xl text-muted-foreground">
                  /{userNotes.length}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                Note minimale: 10/20
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Évaluations
              </CardTitle>
              <div className="h-10 w-10 rounded-xl bg-purple-100 flex items-center justify-center">
                <ClipboardList className="h-5 w-5 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-foreground">
                {userNotes.length}
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                Modules évalués
              </p>
            </CardContent>
          </Card>
        </div>

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
                <XAxis
                  dataKey="module"
                  tick={{ fill: '#64748b', fontSize: 12 }}
                />
                <YAxis
                  domain={[0, 20]}
                  tick={{ fill: '#64748b', fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => [`${value}/20`, 'Note']}
                />
                <Bar dataKey="note" radius={[8, 8, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getBarColor(entry.note)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="flex items-center justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-green-600" />
                <span className="text-xs text-muted-foreground">
                  Excellent (≥12)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-yellow-600" />
                <span className="text-xs text-muted-foreground">
                  Passable (10-12)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-red-600" />
                <span className="text-xs text-muted-foreground">
                  Insuffisant (&lt;10)
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

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
                    <TableHead className="font-semibold text-center">
                      Note
                    </TableHead>
                    <TableHead className="font-semibold text-center">
                      Coefficient
                    </TableHead>
                    <TableHead className="font-semibold text-center">
                      Note Pondérée
                    </TableHead>
                    <TableHead className="font-semibold">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {notesWithDetails.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-center text-muted-foreground py-8"
                      >
                        Aucune note disponible
                      </TableCell>
                    </TableRow>
                  ) : (
                    notesWithDetails.map((note, index) => (
                      <TableRow
                        key={note.id}
                        className={index % 2 === 0 ? 'bg-muted/5' : ''}
                      >
                        <TableCell>
                          <div>
                            <div className="font-medium text-foreground">
                              {note.moduleName}
                            </div>
                            <div className="text-xs text-muted-foreground font-mono">
                              {note.moduleCode}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <span
                            className={`text-lg font-bold ${getNoteColor(note.note)}`}
                          >
                            {note.note.toFixed(1)}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            /20
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="font-mono">
                            x{note.coefficient}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="font-semibold text-foreground">
                            {note.notePonderee.toFixed(2)}
                          </span>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(note.dateEvaluation)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </UserLayout>
  );
}
