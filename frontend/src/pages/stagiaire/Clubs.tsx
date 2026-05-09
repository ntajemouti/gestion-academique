import { useEffect, useState } from 'react';
import { UserLayout } from '@/components/UserLayout';
import { clubsApi } from '@/api/services';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Code, Shield, Brain, Palette, Rocket, Users, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = { Code, Shield, Brain, Palette, Rocket };

interface Club {
  id: number;
  nom: string;
  description: string;
  icon: string;
  capacite_max: number;
  membres_count: number;
  statut: string;
  is_member: boolean;
  responsable?: { id: number; prenom: string; nom: string };
}

export default function StagiaireClubs() {
  const { toast } = useToast();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const load = async () => {
    try {
      const { data } = await clubsApi.list({ statut: 'Actif' });
      setClubs(Array.isArray(data) ? data : data.data ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleToggle = async (club: Club) => {
    setActionLoading(club.id);
    try {
      if (club.is_member) {
        await clubsApi.leave(club.id);
        toast({ title: 'Club quitté', description: `Vous avez quitté le club ${club.nom}` });
      } else {
        await clubsApi.join(club.id);
        toast({ title: 'Inscription réussie', description: `Vous êtes maintenant membre du club ${club.nom}` });
      }
      await load();
    } catch (err: any) {
      toast({ title: 'Erreur', description: err.response?.data?.message ?? 'Une erreur est survenue.', variant: 'destructive' });
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <UserLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Clubs Étudiants</h1>
          <p className="text-muted-foreground mt-1">Rejoignez des clubs pour développer vos compétences et votre réseau</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
        ) : clubs.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Aucun club disponible pour le moment</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {clubs.map(club => {
              const IconComponent = iconMap[club.icon] ?? Users;
              const progress = (club.membres_count / club.capacite_max) * 100;
              return (
                <Card key={club.id} className={`transition-all duration-200 hover:shadow-md ${club.is_member ? 'border-green-500 border-2' : ''}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-3 rounded-xl bg-primary/10">
                          <IconComponent className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{club.nom}</CardTitle>
                          {club.is_member && <Badge className="mt-1 bg-green-100 text-green-800 hover:bg-green-100">Membre</Badge>}
                        </div>
                      </div>
                    </div>
                    <CardDescription className="mt-3">{club.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Membres</span>
                        <span className="font-semibold">{club.membres_count} / {club.capacite_max}</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>
                    {club.responsable && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="w-4 h-4" />
                        <span>Responsable: {club.responsable.prenom} {club.responsable.nom}</span>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter>
                    <Button
                      className="w-full"
                      variant={club.is_member ? 'outline' : 'default'}
                      onClick={() => handleToggle(club)}
                      disabled={actionLoading === club.id || (!club.is_member && club.membres_count >= club.capacite_max)}
                    >
                      {actionLoading === club.id && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      {club.is_member ? 'Quitter le club' : 'Rejoindre le club'}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </UserLayout>
  );
}
