import { useState } from 'react';
import { UserLayout } from '@/components/UserLayout';
import { useAuth } from '@/hooks/useAuth';
import { mockClubs, mockUsers } from '@/data/index';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Code, Shield, Brain, Palette, Rocket, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Code,
  Shield,
  Brain,
  Palette,
  Rocket,
};

const categories = [
  { value: 'all', label: 'Tous les clubs' },
  { value: 'tech', label: 'Technologie' },
  { value: 'creative', label: 'Créatif' },
  { value: 'business', label: 'Business' },
];

export default function StagiaireClubs() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [membershipState, setMembershipState] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    mockClubs.forEach((club) => {
      initial[club.id] = club.membres.includes(user?.id || '');
    });
    return initial;
  });

  const handleToggleMembership = (clubId: string, clubName: string, isCurrentlyMember: boolean) => {
    setMembershipState((prev) => ({
      ...prev,
      [clubId]: !isCurrentlyMember,
    }));

    toast({
      title: isCurrentlyMember ? 'Club quitté' : 'Inscription réussie',
      description: isCurrentlyMember
        ? `Vous avez quitté le club ${clubName}`
        : `Vous êtes maintenant membre du club ${clubName}`,
    });
  };

  const filteredClubs = mockClubs.filter((club) => {
    if (selectedCategory === 'all') return true;
    if (selectedCategory === 'tech') return ['Code', 'Shield', 'Brain'].includes(club.icon);
    if (selectedCategory === 'creative') return club.icon === 'Palette';
    if (selectedCategory === 'business') return club.icon === 'Rocket';
    return true;
  });

  return (
    <UserLayout>
      <div className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Clubs Étudiants</h1>
            <p className="text-muted-foreground mt-1">
              Rejoignez des clubs pour développer vos compétences et votre réseau
            </p>
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Catégorie" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClubs.map((club) => {
            const responsable = mockUsers.find((u) => u.id === club.responsableId);
            const isMember = membershipState[club.id];
            const progressPercentage = (club.nombreMembres / club.capaciteMax) * 100;
            const IconComponent = iconMap[club.icon];

            return (
              <Card
                key={club.id}
                className={`transition-all duration-200 hover:shadow-md ${
                  isMember ? 'border-green-500 border-2' : ''
                }`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-xl bg-primary/10">
                        {IconComponent ? (
                          <IconComponent className="w-6 h-6 text-primary" />
                        ) : (
                          <Users className="w-6 h-6 text-primary" />
                        )}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{club.nom}</CardTitle>
                        {isMember && (
                          <Badge className="mt-1 bg-green-100 text-green-800 hover:bg-green-100">
                            Membre
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <CardDescription className="mt-3">{club.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Membres</span>
                      <span className="font-semibold">
                        {club.nombreMembres} / {club.capaciteMax}
                      </span>
                    </div>
                    <Progress value={progressPercentage} className="h-2" />
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="w-4 h-4" />
                    <span>
                      Responsable: {responsable?.prenom} {responsable?.nom}
                    </span>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full"
                    variant={isMember ? 'outline' : 'default'}
                    onClick={() => handleToggleMembership(club.id, club.nom, isMember)}
                    disabled={!isMember && club.nombreMembres >= club.capaciteMax}
                  >
                    {isMember ? 'Quitter le club' : 'Rejoindre le club'}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>

        {filteredClubs.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Aucun club trouvé dans cette catégorie</p>
          </div>
        )}
      </div>
    </UserLayout>
  );
}
