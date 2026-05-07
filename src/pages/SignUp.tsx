import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { GraduationCap, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { ROUTE_PATHS } from '@/lib/index';

const signupSchema = z.object({
  prenom: z.string().min(2, 'Le prénom doit contenir au moins 2 caractères'),
  nom: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  email: z.string().email('Email invalide'),
  password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
  confirmPassword: z.string(),
  role: z.enum(['Stagiaire', 'Formateur', 'Administrateur'], {
    required_error: 'Veuillez sélectionner un rôle',
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword'],
});

type SignupFormData = z.infer<typeof signupSchema>;

export default function SignUp() {
  const { signup, user, loading } = useAuth();
  const { toast }        = useToast();
  const navigate         = useNavigate();
  const [showPassword, setShowPassword]               = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Already authenticated → redirect to dashboard
  useEffect(() => {
    if (!loading && user) {
      switch (user.role) {
        case 'Administrateur': navigate(ROUTE_PATHS.ADMIN_DASHBOARD,     { replace: true }); break;
        case 'Formateur':      navigate(ROUTE_PATHS.FORMATEUR_DASHBOARD, { replace: true }); break;
        default:               navigate(ROUTE_PATHS.STAGIAIRE_DASHBOARD, { replace: true }); break;
      }
    }
  }, [loading, user, navigate]);

  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } =
    useForm<SignupFormData>({ resolver: zodResolver(signupSchema) });

  const onSubmit = async (data: SignupFormData) => {
    const success = await signup({
      prenom: data.prenom,
      nom: data.nom,
      email: data.email,
      password: data.password,
      password_confirmation: data.confirmPassword,
      role: data.role,
    });

    if (success) {
      toast({ title: 'Inscription réussie', description: 'Votre compte a été créé avec succès.' });
      // Navigate based on the role they signed up with
      switch (data.role) {
        case 'Administrateur': navigate(ROUTE_PATHS.ADMIN_DASHBOARD);     break;
        case 'Formateur':      navigate(ROUTE_PATHS.FORMATEUR_DASHBOARD); break;
        default:               navigate(ROUTE_PATHS.STAGIAIRE_DASHBOARD); break;
      }
    } else {
      toast({
        title: 'Erreur',
        description: 'Un compte avec cet email existe déjà.',
        variant: 'destructive',
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
      <div className="w-full max-w-5xl grid md:grid-cols-2 gap-0 bg-card rounded-2xl shadow-lg overflow-hidden">

        {/* Left panel */}
        <div className="bg-gradient-to-br from-primary via-primary/90 to-accent p-12 flex flex-col justify-center items-center text-primary-foreground">
          <div className="flex items-center gap-3 mb-6">
            <GraduationCap className="w-12 h-12" />
            <span className="text-3xl font-bold">MyISTA</span>
          </div>
          <h2 className="text-2xl font-semibold mb-3 text-center">Institut de Formation</h2>
          <p className="text-primary-foreground/90 text-center max-w-sm">
            Rejoignez notre plateforme de gestion académique et administrative
          </p>
        </div>

        {/* Right panel */}
        <div className="p-12">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Inscription</h1>
            <p className="text-muted-foreground">Créez votre compte pour commencer</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="prenom">Prénom</Label>
                <Input id="prenom" placeholder="Votre prénom" {...register('prenom')}
                  className={errors.prenom ? 'border-destructive' : ''} />
                {errors.prenom && <p className="text-sm text-destructive">{errors.prenom.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="nom">Nom</Label>
                <Input id="nom" placeholder="Votre nom" {...register('nom')}
                  className={errors.nom ? 'border-destructive' : ''} />
                {errors.nom && <p className="text-sm text-destructive">{errors.nom.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="votre.email@exemple.com" {...register('email')}
                className={errors.email ? 'border-destructive' : ''} />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <div className="relative">
                <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="••••••••"
                  {...register('password')} className={errors.password ? 'border-destructive pr-10' : 'pr-10'} />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
              <div className="relative">
                <Input id="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} placeholder="••••••••"
                  {...register('confirmPassword')} className={errors.confirmPassword ? 'border-destructive pr-10' : 'pr-10'} />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Rôle</Label>
              <Select onValueChange={(v) => setValue('role', v as 'Stagiaire' | 'Formateur' | 'Administrateur')}>
                <SelectTrigger className={errors.role ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Sélectionnez votre rôle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Stagiaire">Stagiaire</SelectItem>
                  <SelectItem value="Formateur">Formateur</SelectItem>
                  <SelectItem value="Administrateur">Administrateur</SelectItem>
                </SelectContent>
              </Select>
              {errors.role && <p className="text-sm text-destructive">{errors.role.message}</p>}
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
              {isSubmitting ? 'Inscription en cours...' : "S'inscrire"}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Vous avez déjà un compte ?{' '}
              <Link to={ROUTE_PATHS.LOGIN} className="text-primary hover:underline font-medium">
                Se connecter
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}