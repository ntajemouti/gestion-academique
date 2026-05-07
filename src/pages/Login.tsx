import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { GraduationCap, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';   // ← single source of truth
import { ROUTE_PATHS } from '@/lib/index';

const loginSchema = z.object({
  email:    z.string().email('Email invalide'),
  password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const { login, user, loading } = useAuth();
  const { toast }   = useToast();
  const navigate    = useNavigate();   // ← navigation lives HERE, inside the router tree

  // Already authenticated → redirect to the right dashboard
  useEffect(() => {
    if (!loading && user) {
      switch (user.role) {
        case 'Administrateur': navigate(ROUTE_PATHS.ADMIN_DASHBOARD,     { replace: true }); break;
        case 'Formateur':      navigate(ROUTE_PATHS.FORMATEUR_DASHBOARD, { replace: true }); break;
        default:               navigate(ROUTE_PATHS.STAGIAIRE_DASHBOARD, { replace: true }); break;
      }
    }
  }, [loading, user, navigate]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginFormData) => {
    const result = await login(data.email, data.password);

    if (result.success && result.user) {
      toast({
        title:       'Connexion réussie',
        description: `Bienvenue ${result.user.prenom} !`,
      });

      // Navigate based on role — happens here, not inside AuthContext
      switch (result.user.role) {
        case 'Administrateur': navigate(ROUTE_PATHS.ADMIN_DASHBOARD);      break;
        case 'Formateur':      navigate(ROUTE_PATHS.FORMATEUR_DASHBOARD);  break;
        default:               navigate(ROUTE_PATHS.STAGIAIRE_DASHBOARD);  break;
      }
    } else {
      toast({
        title:       'Erreur de connexion',
        description: result.message ?? 'Email ou mot de passe incorrect.',
        variant:     'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl grid md:grid-cols-2 bg-card rounded-2xl shadow-lg overflow-hidden">

        {/* Left panel */}
        <div className="hidden md:flex flex-col justify-center items-center p-12 bg-gradient-to-br from-primary via-primary/90 to-accent text-primary-foreground">
          <div className="flex items-center gap-3 mb-6">
            <GraduationCap className="w-16 h-16" />
            <span className="text-4xl font-bold">MyISTA</span>
          </div>
          <h2 className="text-2xl font-semibold mb-3 text-center">
            Institut Supérieur de Technologie Appliquée
          </h2>
          <p className="text-primary-foreground/90 text-center text-lg">
            Gérez vos parcours académiques et administratifs en toute simplicité
          </p>
        </div>

        {/* Right panel */}
        <div className="p-8 md:p-12">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Connexion</h1>
            <p className="text-muted-foreground">Accédez à votre espace personnel</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="votre.email@example.com"
                {...register('email')}
                className="h-11"
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  {...register('password')}
                  className="h-11 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full h-11 text-base" disabled={isSubmitting}>
              {isSubmitting ? 'Connexion...' : 'Se connecter'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-muted-foreground">
              Pas encore inscrit ?{' '}
              <Link
                to={ROUTE_PATHS.SIGNUP}
                className="text-primary hover:text-accent font-medium transition-colors"
              >
                S'inscrire
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}