import { motion } from 'framer-motion';
import { GraduationCap, BookOpen, Users, Star, Mail, Phone, MapPin, ArrowRight, CheckCircle } from 'lucide-react';
import { PublicLayout } from '@/components/PublicLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { LogIn, UserPlus } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { ROUTE_PATHS } from '@/lib/index';
import { api } from '@/lib/api';

// ── Scroll helper — works with HashRouter (href="#x" doesn't work in HashRouter) ──
function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export default function Home() {
  const [filieres, setFilieres] = useState<any[]>([]);
  const [clubs, setClubs]       = useState<any[]>([]);

  // ── Real-time stats from the backend ──────────────────────────
  const [stats, setStats] = useState({ stagiaires: 0, formateurs: 0, filieres: 0, clubs: 0 });

  useEffect(() => {
    // Load public lists
    api.get('/filieres').then((data: any) => setFilieres(Array.isArray(data) ? data : [])).catch(() => {});
    api.get('/clubs').then((data: any)    => setClubs(Array.isArray(data)    ? data : [])).catch(() => {});

    // ── Live counts from the dedicated public /stats endpoint ──
    // Works for everyone (no token needed) and reflects DB changes immediately.
    const fetchStats = () => {
      api.get('/stats')
        .then((data: any) => {
          setStats({
            stagiaires: data.stagiaires ?? 0,
            formateurs: data.formateurs ?? 0,
            filieres:   data.filieres   ?? 0,
            clubs:      data.clubs      ?? 0,
          });
        })
        .catch(() => {}); // fail silently — UI keeps last known values
    };

    fetchStats(); // immediate on mount

    // Poll every 30 s so the numbers update while the page is open
    // (reflects admin adding/removing users without a full reload)
    const interval = setInterval(fetchStats, 30_000);
    return () => clearInterval(interval); // cleanup on unmount
  }, []);

  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedClub, setSelectedClub] = useState('');

  const handleClubSignup = (clubName: string) => {
    if (isAuthenticated) {
      navigate(ROUTE_PATHS.STAGIAIRE_CLUBS);
    } else {
      setSelectedClub(clubName);
      setDialogOpen(true);
    }
  };

  return (
    <PublicLayout>
      <section id="hero" className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="/images/background.png"
            alt="Campus MyISTA"
            className="w-full h-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-transparent to-background/70" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto"
          >
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center">
                <GraduationCap className="w-10 h-10 text-primary-foreground" />
              </div>
              <h1 className="text-5xl md:text-6xl font-bold text-primary">MyISTA</h1>
            </div>

            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Bienvenue sur MyISTA Services
            </h2>

            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Gérez vos parcours académiques et administratifs en toute simplicité
            </p>

            {/* ✅ FIXED: onClick + scrollTo instead of href="#..." — works with HashRouter */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="text-lg px-8" onClick={() => scrollTo('filieres')}>
                Découvrir les Filières
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8" onClick={() => scrollTo('clubs')}>
                Rejoindre un Club
                <Star className="ml-2 w-5 h-5" />
              </Button>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="mt-12"
            >
              <img
                src="/images/Stagiaires.png"
                alt="Étudiants MyISTA"
                className="rounded-2xl shadow-2xl mx-auto max-w-3xl w-full"
              />
            </motion.div>
          </motion.div>
        </div>
      </section>

      <section id="filieres" className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <Badge className="mb-4" variant="secondary">
              <BookOpen className="w-4 h-4 mr-2" />
              Nos Formations
            </Badge>
            <h2 className="text-4xl font-bold mb-4">Filières de Formation</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Découvrez nos programmes de formation professionnelle adaptés aux besoins du marché
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {filieres.map((filiere, index) => (
              <motion.div
                key={filiere.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow duration-200">
                  <CardHeader>
                    <div
                      className="w-12 h-12 rounded-xl mb-4 flex items-center justify-center"
                      style={{ backgroundColor: `${filiere.color}20` }}
                    >
                      <BookOpen className="w-6 h-6" style={{ color: filiere.color }} />
                    </div>
                    <CardTitle className="text-xl">{filiere.nom}</CardTitle>
                    <Badge
                      variant="secondary"
                      className="w-fit font-mono text-xs"
                      style={{ backgroundColor: `${filiere.color}15`, color: filiere.color }}
                    >
                      {filiere.code}
                    </Badge>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="mb-4">{filiere.description}</CardDescription>
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span>Durée: {filiere.duree} ans</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span>{filiere.niveau}</span>
                      </div>
                    </div>
                    <Button
                      variant="outline" className="w-full" onClick={() => navigate(`/filiere/${filiere.id}`)}>
                      En savoir plus
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="clubs" className="py-24">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <Badge className="mb-4" variant="secondary">
              <Star className="w-4 h-4 mr-2" />
              Vie Étudiante
            </Badge>
            <h2 className="text-4xl font-bold mb-4">Clubs Étudiants</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Rejoignez nos clubs pour développer vos compétences et élargir votre réseau
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {clubs.map((club, index) => {
              const IconComponent = club.icon === 'Code' ? BookOpen : club.icon === 'Shield' ? Star : club.icon === 'Brain' ? GraduationCap : club.icon === 'Palette' ? Star : Star;
              // ✅ FIXED: API returns snake_case — nombre_membres, capacite_max
              const membres  = club.nombre_membres ?? club.membres_count ?? 0;
              const capacite = club.capacite_max ?? 0;
              const progress = capacite > 0 ? Math.min((membres / capacite) * 100, 100) : 0;

              return (
                <motion.div
                  key={club.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                >
                  <Card className="h-full hover:shadow-lg transition-all duration-200 hover:scale-[1.02]">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                          <IconComponent className="w-6 h-6 text-primary" />
                        </div>
                        <Badge variant="secondary">
                          {membres} membres
                        </Badge>
                      </div>
                      <CardTitle className="text-xl mt-4">{club.nom}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="mb-4">{club.description}</CardDescription>
                      <div className="mb-4">
                        <div className="flex justify-between text-sm text-muted-foreground mb-2">
                          <span>Capacité</span>
                          <span>{membres}/{capacite}</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                      <Button className="w-full" onClick={() => handleClubSignup(club.nom)} disabled={membres >= capacite}>
                        {membres >= capacite ? 'Complet' : "S'inscrire"}
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <section id="about" className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <Badge className="mb-4" variant="secondary">
                <GraduationCap className="w-4 h-4 mr-2" />
                À Propos
              </Badge>
              <h2 className="text-4xl font-bold mb-6">MyISTA Services</h2>
              <p className="text-lg text-muted-foreground mb-6">
                MyISTA est un institut de formation professionnelle de référence, offrant des programmes de qualité dans les domaines du digital, de l'infrastructure, de la data science et du design.
              </p>
              <p className="text-lg text-muted-foreground mb-8">
                Notre mission est de former les talents de demain en leur offrant un environnement d'apprentissage moderne, des formateurs experts et un accompagnement personnalisé tout au long de leur parcours.
              </p>

              {/* ✅ FIXED: Real numbers from API — update automatically when DB changes */}
              <div className="grid grid-cols-2 gap-6">
                {[
                  { value: stats.stagiaires, label: 'Stagiaires' },
                  { value: stats.formateurs, label: 'Formateurs' },
                  { value: stats.filieres,   label: 'Filières'   },
                  { value: stats.clubs,      label: 'Clubs'      },
                ].map(({ value, label }) => (
                  <div key={label} className="text-center p-6 bg-card rounded-xl shadow-sm">
                    <div className="text-4xl font-bold text-primary mb-2">
                      {value > 0 ? value.toLocaleString('fr-FR') : (
                        <span className="inline-block w-10 h-9 bg-muted animate-pulse rounded" />
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">{label}</div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <img
                src="/images/Formation.png"
                alt="Formation MyISTA"
                className="rounded-2xl shadow-2xl w-full"
              />
            </motion.div>
          </div>
        </div>
      </section>

      <section id="contact" className="py-24">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <Badge className="mb-4" variant="secondary">
              <Mail className="w-4 h-4 mr-2" />
              Contact
            </Badge>
            <h2 className="text-4xl font-bold mb-4">Contactez-nous</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Notre équipe est à votre disposition pour répondre à toutes vos questions
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1, duration: 0.5 }}
            >
              <Card className="text-center h-full">
                <CardHeader>
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Mail className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle>Email</CardTitle>
                </CardHeader>
                <CardContent>
                  {/* ✅ FIXED: correct email */}
                  <a href="mailto:ista.bouznika2020@gmail.com" className="text-primary hover:underline break-all">
                    ista.bouznika2020@gmail.com
                  </a>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <Card className="text-center h-full">
                <CardHeader>
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Phone className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle>Téléphone</CardTitle>
                </CardHeader>
                <CardContent>
                  {/* ✅ FIXED: correct phone */}
                  <a href="tel:0537743577" className="text-primary hover:underline">
                    05377-43577
                  </a>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <Card className="text-center h-full">
                <CardHeader>
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <MapPin className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle>Adresse</CardTitle>
                </CardHeader>
                <CardContent>
                  {/* ✅ FIXED: correct address */}
                  <p className="text-muted-foreground">
                    Quartier Industriel<br />
                    Bouznika, Maroc
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">Rejoindre {selectedClub}</DialogTitle>
            <DialogDescription className="text-center">
              Vous avez besoin d'un compte MyISTA pour rejoindre un club.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 mt-2">
            <Button asChild className="w-full gap-2">
              <Link to={ROUTE_PATHS.LOGIN} onClick={() => setDialogOpen(false)}>
                <LogIn className="w-4 h-4" /> Se connecter
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full gap-2">
              <Link to={ROUTE_PATHS.SIGNUP} onClick={() => setDialogOpen(false)}>
                <UserPlus className="w-4 h-4" /> Créer un compte
              </Link>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </PublicLayout>
  );
}