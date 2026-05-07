<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rules\Password;

class UserController extends Controller
{
    // GET /api/users  [admin]
    public function index(Request $request): JsonResponse
    {
        $query = User::with(['filiere', 'groupe']);

        if ($request->filled('role'))       $query->where('role', $request->role);
        if ($request->filled('statut'))     $query->where('statut', $request->statut);
        if ($request->filled('filiere_id')) $query->where('filiere_id', $request->filiere_id);
        if ($request->filled('groupe_id'))  $query->where('groupe_id', $request->groupe_id);

        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('prenom',    'like', "%{$request->search}%")
                  ->orWhere('nom',     'like', "%{$request->search}%")
                  ->orWhere('email',   'like', "%{$request->search}%")
                  ->orWhere('matricule','like', "%{$request->search}%");
            });
        }

        $perPage = $request->input('per_page', 20);

        return response()->json($query->orderBy('nom')->paginate($perPage));
    }

    // POST /api/users  [admin]
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'prenom'     => 'required|string|max:100',
            'nom'        => 'required|string|max:100',
            'email'      => 'required|email|unique:users,email',
            'password'   => ['required', Password::min(8)],
            'role'       => 'required|in:Administrateur,Stagiaire,Formateur',
            'statut'     => 'in:Actif,Inactif,Congé',
            'specialite' => 'nullable|string|max:150',
            'filiere_id' => 'nullable|exists:filieres,id',
            'groupe_id'  => 'nullable|exists:groupes,id',
        ]);

        $matricule = $this->generateMatricule($data['role']);

        $user = User::create([
            ...$data,
            'matricule' => $matricule,
            'password'  => Hash::make($data['password']),
        ]);

        return response()->json($user->load(['filiere', 'groupe']), 201);
    }

    // GET /api/users/{id}  [admin]
    public function show(User $user): JsonResponse
    {
        return response()->json(
            $user->load(['filiere', 'groupe', 'clubs', 'modulesEnseignes.filiere'])
                 ->append(['avatar_url'])
        );
    }

    // PUT /api/users/{id}  [admin]
    public function update(Request $request, User $user): JsonResponse
    {
        $data = $request->validate([
            'prenom'     => 'required|string|max:100',
            'nom'        => 'required|string|max:100',
            'email'      => "required|email|unique:users,email,{$user->id}",
            'role'       => 'required|in:Administrateur,Stagiaire,Formateur',
            'statut'     => 'in:Actif,Inactif,Congé',
            'specialite' => 'nullable|string|max:150',
            'filiere_id' => 'nullable|exists:filieres,id',
            'groupe_id'  => 'nullable|exists:groupes,id',
        ]);

        if ($request->filled('password')) {
            $request->validate(['password' => Password::min(8)]);
            $data['password'] = Hash::make($request->password);
        }

        $user->update($data);

        return response()->json($user->load(['filiere', 'groupe']));
    }

    // DELETE /api/users/{id}  [admin]  — soft deactivate, preserves history
    public function destroy(Request $request, User $user): JsonResponse
    {
        if ($user->id === $request->user()->id) {
            return response()->json(['message' => 'Vous ne pouvez pas supprimer votre propre compte.'], 422);
        }

        $user->update(['statut' => 'Inactif']);

        return response()->json(['message' => 'Utilisateur désactivé.']);
    }

    // PATCH /api/users/{id}/statut  [admin]
    public function updateStatut(Request $request, User $user): JsonResponse
    {
        $request->validate(['statut' => 'required|in:Actif,Inactif,Congé']);
        $user->update(['statut' => $request->statut]);

        return response()->json(['message' => 'Statut mis à jour.', 'user' => $user]);
    }

    // GET /api/users/formateurs  — dropdown list for all authenticated users
    public function formateurs(): JsonResponse
    {
        $formateurs = User::where('role', 'Formateur')
                          ->where('statut', 'Actif')
                          ->select('id', 'prenom', 'nom', 'email', 'specialite', 'matricule')
                          ->orderBy('nom')
                          ->get();

        return response()->json($formateurs);
    }

    // GET /api/users/stagiaires  [admin, formateur]
    public function stagiaires(Request $request): JsonResponse
    {
        $query = User::where('role', 'Stagiaire')
                     ->with(['filiere', 'groupe']);

        if ($request->filled('groupe_id'))  $query->where('groupe_id',  $request->groupe_id);
        if ($request->filled('filiere_id')) $query->where('filiere_id', $request->filiere_id);

        return response()->json($query->orderBy('nom')->get());
    }

    // POST /api/auth/avatar  — upload profile picture for authenticated user
    public function updateAvatar(Request $request): JsonResponse
    {
        $request->validate([
            'avatar' => 'required|image|mimes:jpg,jpeg,png,webp|max:2048',
        ]);

        $user = $request->user();

        // Remove old avatar from disk
        if ($user->avatar) {
            Storage::disk('public')->delete($user->avatar);
        }

        $path = $request->file('avatar')->store('avatars', 'public');
        $user->update(['avatar' => $path]);

        return response()->json([
            'message'    => 'Avatar mis à jour.',
            'avatar'     => $path,
            'avatar_url' => asset('storage/' . $path),
        ]);
    }

    // ── Private helpers ───────────────────────────────────────────────────
    private function generateMatricule(string $role): string
    {
        $prefix = match($role) {
            'Administrateur' => 'ADM',
            'Formateur'      => 'FOR',
            default          => 'STA',
        };

        // Find the max existing number for this prefix to avoid gaps/duplicates
        $last = User::where('matricule', 'like', "$prefix%")
                    ->orderByDesc('matricule')
                    ->value('matricule');

        $num = $last ? (intval(substr($last, 3)) + 1) : 1;

        return $prefix . str_pad($num, 3, '0', STR_PAD_LEFT);
    }
}
