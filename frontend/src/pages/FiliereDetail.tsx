import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, BookOpen, CheckCircle, GraduationCap, Users, Clock, Award, Loader2 } from 'lucide-react';
import { PublicLayout } from '@/components/PublicLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { api } from '@/lib/api';

interface Module {
  id: number;
  code: string;
  nom: string;
  heures_par_semaine: number;
  coefficient: number;
  formateur?: { prenom: string; nom: string; specialite?: string };
}

interface Groupe {
  id: number;
  nom: string;
  niveau: string;
  annee: string;
  statut: string;
}

interface Filiere {
  id: number;
  code: string;
  nom: string;
  description: string;
  duree: number;
  color: string;
  statut: string;
  modules?: Module[];
  groupes?: Groupe[];
}

export default function FiliereDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [filiere, setFiliere] = useState<Filiere | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api.get(`/filieres/${id}`)
      .then((data: any) => setFiliere(data))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <PublicLayout>
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    </PublicLayout>
  );

  if (notFound || !filiere) return (
    <PublicLayout>
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Filière introuvable</h2>
          <Button onClick={() => navigate('/')}>Retour à l'accueil</Button>
        </div>
      </div>
    </PublicLayout>
  );

  const accentColor = filiere.color || '#2563eb';
  const modules  = filiere.modules  ?? [];
  const groupes  = filiere.groupes  ?? [];
  const totalHeures = modules.reduce((sum, m) => sum + (m.heures_par_semaine ?? 0), 0);

  return (
    <PublicLayout>
      {/* Hero */}
      <section className="py-20 relative overflow-hidden" style={{ backgroundColor: `${accentColor}12` }}>
        <div className="container mx-auto px-4">
          <Button variant="ghost" className="mb-6" onClick={() => navigate('/')}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Retour aux filières
          </Button>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${accentColor}25` }}>
                <BookOpen className="w-8 h-8" style={{ color: accentColor }} />
              </div>
              <div>
                <Badge style={{ backgroundColor: `${accentColor}20`, color: accentColor }} className="mb-2">
                  {filiere.code}
                </Badge>
                <h1 className="text-4xl font-bold text-foreground">{filiere.nom}</h1>
              </div>
            </div>

            <p className="text-xl text-muted-foreground max-w-2xl mb-8">{filiere.description}</p>

            {/* Key stats */}
            <div className="flex flex-wrap gap-6">
              <div className="flex items-center gap-2 text-foreground">
                <CheckCircle className="w-5 h-5" style={{ color: accentColor }} />
                <span className="font-medium">Durée: {filiere.duree} an{filiere.duree > 1 ? 's' : ''}</span>
              </div>
              <div className="flex items-center gap-2 text-foreground">
                <BookOpen className="w-5 h-5" style={{ color: accentColor }} />
                <span className="font-medium">{modules.length} module{modules.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="flex items-center gap-2 text-foreground">
                <Clock className="w-5 h-5" style={{ color: accentColor }} />
                <span className="font-medium">{totalHeures}h / semaine</span>
              </div>
              <div className="flex items-center gap-2 text-foreground">
                <Users className="w-5 h-5" style={{ color: accentColor }} />
                <span className="font-medium">{groupes.length} groupe{groupes.length !== 1 ? 's' : ''}</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Tabs */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <Tabs defaultValue="modules">
            <TabsList className="mb-8">
              <TabsTrigger value="modules">Modules ({modules.length})</TabsTrigger>
              <TabsTrigger value="groupes">Groupes ({groupes.length})</TabsTrigger>
              <TabsTrigger value="infos">Informations</TabsTrigger>
            </TabsList>

            {/* Modules tab */}
            <TabsContent value="modules">
              {modules.length === 0 ? (
                <p className="text-center text-muted-foreground py-12">Aucun module enregistré pour cette filière.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {modules.map((module, index) => (
                    <motion.div key={module.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
                      <Card className="hover:shadow-md transition-shadow">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <Badge variant="outline" className="mb-2 text-xs">{module.code}</Badge>
                              <CardTitle className="text-base">{module.nom}</CardTitle>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium" style={{ color: accentColor }}>Coeff. {module.coefficient}</p>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" /> {module.heures_par_semaine}h/semaine
                            </span>
                            {module.formateur && (
                              <span className="flex items-center gap-1">
                                <GraduationCap className="w-3.5 h-3.5" />
                                {module.formateur.prenom} {module.formateur.nom}
                              </span>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Groupes tab */}
            <TabsContent value="groupes">
              {groupes.length === 0 ? (
                <p className="text-center text-muted-foreground py-12">Aucun groupe pour cette filière.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {groupes.map((groupe, index) => (
                    <motion.div key={groupe.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
                      <Card className="text-center hover:shadow-md transition-shadow">
                        <CardHeader>
                          <div className="w-12 h-12 rounded-full mx-auto flex items-center justify-center mb-2" style={{ backgroundColor: `${accentColor}20` }}>
                            <Users className="w-6 h-6" style={{ color: accentColor }} />
                          </div>
                          <CardTitle className="text-lg">{groupe.nom}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <Badge variant="secondary">{groupe.niveau}</Badge>
                          <p className="text-sm text-muted-foreground">{groupe.annee}</p>
                          <Badge variant={groupe.statut === 'Actif' ? 'default' : 'secondary'} className="text-xs">
                            {groupe.statut}
                          </Badge>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Infos tab */}
            <TabsContent value="infos">
              <Card>
                <CardContent className="py-8 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Award className="w-5 h-5" style={{ color: accentColor }} /> Détails de la formation
                      </h3>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-muted-foreground">Code filière</span>
                          <span className="font-medium">{filiere.code}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-muted-foreground">Durée</span>
                          <span className="font-medium">{filiere.duree} an{filiere.duree > 1 ? 's' : ''}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-muted-foreground">Nombre de modules</span>
                          <span className="font-medium">{modules.length}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-muted-foreground">Volume horaire hebdo.</span>
                          <span className="font-medium">{totalHeures}h</span>
                        </div>
                        <div className="flex justify-between py-2">
                          <span className="text-muted-foreground">Statut</span>
                          <Badge variant={filiere.statut === 'Actif' ? 'default' : 'secondary'}>{filiere.statut}</Badge>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">À propos</h3>
                      <p className="text-muted-foreground leading-relaxed">{filiere.description}</p>
                      <div className="pt-4">
                        <Button style={{ backgroundColor: accentColor }} className="text-white w-full" onClick={() => navigate('/signup')}>
                          S'inscrire dans cette filière
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </PublicLayout>
  );
}
