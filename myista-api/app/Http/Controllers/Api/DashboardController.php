<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Absence;
use App\Models\Club;
use App\Models\Demande;
use App\Models\Filiere;
use App\Models\Groupe;
use App\Models\Module;
use App\Models\Note;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $auth = $request->user();

        return match($auth->role) {
            'Administrateur' => $this->adminStats(),
            'Formateur'      => $this->formateurStats($auth),
            'Stagiaire'      => $this->stagiaireStats($auth),
            default          => response()->json(['message' => 'Rôle inconnu.'], 400),
        };
    }

    // ─────────────────────────────────────────────────────────────────────
    // ADMIN — Matches what admin/Dashboard.tsx expects
    // The page calls GET /users, /filieres, /groupes, /modules, /demandes
    // separately, but also supports a single /dashboard call.
    // We return ALL fields so both approaches work.
    // ─────────────────────────────────────────────────────────────────────
    private function adminStats(): JsonResponse
    {
        $recentUsers = User::with(['filiere', 'groupe'])
                           ->orderByDesc('created_at')
                           ->limit(6)
                           ->get();

        return response()->json([
            // Counts — individual fields (matches DashboardStats interface in admin/Dashboard.tsx)
            'total_users'           => User::count(),
            'total_stagiaires'      => User::where('role', 'Stagiaire')->count(),
            'total_formateurs'      => User::where('role', 'Formateur')->count(),
            'total_administrateurs' => User::where('role', 'Administrateur')->count(),
            'total_filieres'        => Filiere::count(),
            'total_groupes'         => Groupe::count(),
            'total_modules'         => Module::count(),
            'demandes_en_attente'   => Demande::where('statut', 'En attente')->count(),

            // Nested structure (also used by other parts of the admin UI)
            'utilisateurs' => [
                'total'      => User::count(),
                'stagiaires' => User::where('role', 'Stagiaire')->count(),
                'formateurs' => User::where('role', 'Formateur')->count(),
                'admins'     => User::where('role', 'Administrateur')->count(),
                'actifs'     => User::where('statut', 'Actif')->count(),
            ],
            'clubs'    => Club::where('statut', 'Actif')->count(),
            'demandes' => [
                'total'      => Demande::count(),
                'en_attente' => Demande::where('statut', 'En attente')->count(),
                'approuvees' => Demande::where('statut', 'Approuvée')->count(),
                'rejetees'   => Demande::where('statut', 'Rejetée')->count(),
            ],
            'absences_semaine' => Absence::whereDate('date', '>=', now()->startOfWeek())
                                         ->whereDate('date', '<=', now()->endOfWeek())
                                         ->count(),

            // Recent users table shown at bottom of admin dashboard
            'recent_users' => $recentUsers->map(fn($u) => [
                'id'         => $u->id,
                'prenom'     => $u->prenom,
                'nom'        => $u->nom,
                'email'      => $u->email,
                'role'       => $u->role,
                'matricule'  => $u->matricule,
                'statut'     => $u->statut,
                'created_at' => $u->created_at,
            ]),
        ]);
    }

    // ─────────────────────────────────────────────────────────────────────
    // FORMATEUR — Matches formateur/Dashboard.tsx data needs
    // ─────────────────────────────────────────────────────────────────────
    private function formateurStats(User $auth): JsonResponse
    {
        $moduleIds = $auth->modulesEnseignes()->pluck('id');

        // Stagiaires from all groupes that belong to formateur's filieres
        $filiereIds    = $auth->modulesEnseignes()->pluck('filiere_id')->unique();
        $totalStagiaires = User::where('role', 'Stagiaire')
                               ->whereIn('filiere_id', $filiereIds)
                               ->count();

        $absencesThisMonth = Absence::where('formateur_id', $auth->id)
                                    ->whereMonth('date', now()->month)
                                    ->whereYear('date', now()->year)
                                    ->count();

        $recentAbsences = Absence::where('formateur_id', $auth->id)
                                 ->with([
                                     'stagiaire:id,prenom,nom,matricule',
                                     'module:id,code,nom',
                                 ])
                                 ->orderByDesc('date')
                                 ->limit(5)
                                 ->get()
                                 ->map(fn($a) => [
                                     'id'         => $a->id,
                                     'stagiaire'  => $a->stagiaire?->prenom . ' ' . $a->stagiaire?->nom,
                                     'module'     => $a->module?->nom,
                                     'date'       => $a->date,
                                     'justifiee'  => $a->justifiee,
                                     'type'       => $a->justifiee ? 'Absence justifiée' : 'Absence non justifiée',
                                 ]);

        return response()->json([
            // Stats matching formateur/Dashboard.tsx StatCard expectations
            'mes_modules'           => $moduleIds->count(),
            'total_stagiaires'      => $totalStagiaires,
            'absences_ce_mois'      => $absencesThisMonth,
            'demandes_en_attente'   => Demande::where('statut', 'En attente')->count(),

            // Nested (for other uses)
            'absences' => [
                'total'         => Absence::where('formateur_id', $auth->id)->count(),
                'cette_semaine' => Absence::where('formateur_id', $auth->id)
                                          ->whereDate('date', '>=', now()->startOfWeek())
                                          ->whereDate('date', '<=', now()->endOfWeek())
                                          ->count(),
                'ce_mois'       => $absencesThisMonth,
            ],
            'notes_saisies'          => Note::where('formateur_id', $auth->id)->count(),
            'stagiaires_concernes'   => Absence::where('formateur_id', $auth->id)
                                               ->distinct('stagiaire_id')
                                               ->count('stagiaire_id'),

            // Recent activity feed for the dashboard
            'recent_absences' => $recentAbsences,

            // Modules list for the dashboard preview
            'modules' => $auth->modulesEnseignes()
                              ->with('filiere:id,nom,code,color')
                              ->get(['id', 'code', 'nom', 'filiere_id', 'coefficient', 'heures_par_semaine']),
        ]);
    }

    // ─────────────────────────────────────────────────────────────────────
    // STAGIAIRE — Matches stagiaire/Dashboard.tsx data needs
    // ─────────────────────────────────────────────────────────────────────
    private function stagiaireStats(User $auth): JsonResponse
    {
        $notes    = Note::where('stagiaire_id', $auth->id)->with('module:id,nom,coefficient')->get();
        $absences = Absence::where('stagiaire_id', $auth->id)->get();

        // Weighted average
        $moyenneGenerale = 0;
        if ($notes->isNotEmpty()) {
            $totalPondere = $notes->sum(fn($n) => $n->note * $n->coefficient);
            $totalCoeff   = $notes->sum('coefficient');
            $moyenneGenerale = $totalCoeff > 0 ? round($totalPondere / $totalCoeff, 2) : 0;
        }

        $mention = match(true) {
            $moyenneGenerale >= 16 => 'Très Bien',
            $moyenneGenerale >= 14 => 'Bien',
            $moyenneGenerale >= 12 => 'Assez Bien',
            $moyenneGenerale >= 10 => 'Passable',
            default                => 'Insuffisant',
        };

        // Absences this month
        $absencesThisMonth = $absences->filter(function ($a) {
            return $a->date->month === now()->month && $a->date->year === now()->year;
        })->count();

        // Count of emplois for this groupe this week
        $coursThisSemaine = 0;
        if ($auth->groupe_id) {
            $coursThisSemaine = \App\Models\EmploiDuTemps::where('groupe_id', $auth->groupe_id)->count();
        }

        return response()->json([
            // Stats matching stagiaire/Dashboard.tsx StatCard
            'cours_cette_semaine' => $coursThisSemaine,
            'absences_ce_mois'    => $absencesThisMonth,
            'moyenne_generale'    => $moyenneGenerale,
            'mention'             => $mention,
            'notes_count'         => $notes->count(),

            // Nested
            'absences' => [
                'total'        => $absences->count(),
                'justifiees'   => $absences->where('justifiee', true)->count(),
                'injustifiees' => $absences->where('justifiee', false)->count(),
                'ce_mois'      => $absencesThisMonth,
            ],
            'demandes' => [
                'total'      => Demande::where('user_id', $auth->id)->count(),
                'en_attente' => Demande::where('user_id', $auth->id)->where('statut', 'En attente')->count(),
            ],

            // Profile context
            'clubs_count' => $auth->clubs()->count(),
            'filiere'     => $auth->filiere?->nom,
            'groupe'      => $auth->groupe?->nom,
        ]);
    }
}
