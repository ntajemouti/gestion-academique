<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    // ── POST /api/auth/register ───────────────────────────────
    public function register(Request $request): JsonResponse
    {
        $data = $request->validate([
            'prenom'     => 'required|string|max:100',
            'nom'        => 'required|string|max:100',
            'email'      => 'required|email|unique:users,email',
            'password'   => ['required', 'confirmed', Password::min(8)],
            'role'       => 'required|in:Administrateur,Stagiaire,Formateur',
            'specialite' => 'nullable|string|max:150',
            'filiere_id' => 'nullable|exists:filieres,id',
            'groupe_id'  => 'nullable|exists:groupes,id',
        ]);

        $prefix = match($data['role']) {
            'Administrateur' => 'ADM',
            'Formateur'      => 'FOR',
            default          => 'STA',
        };
        $count      = User::where('role', $data['role'])->count() + 1;
        $matricule  = $prefix . str_pad($count, 3, '0', STR_PAD_LEFT);

        $user = User::create([
            ...$data,
            'matricule' => $matricule,
            'password'  => Hash::make($data['password']),
            'statut'    => 'Actif',
        ]);

        $token = $user->createToken('myista-token')->plainTextToken;

        return response()->json([
            'user'  => $user,
            'token' => $token,
        ], 201);
    }

    // ── POST /api/auth/login ──────────────────────────────────
    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'email'    => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $request->email)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Les identifiants fournis sont incorrects.'],
            ]);
        }

        if (! $user->isActif()) {
            return response()->json(['message' => 'Votre compte est désactivé.'], 403);
        }

        // Revoke previous tokens (single-session)
        $user->tokens()->delete();
        $token = $user->createToken('myista-token')->plainTextToken;

        return response()->json([
            'user'  => $user->load(['filiere', 'groupe']),
            'token' => $token,
        ]);
    }

    // ── POST /api/auth/logout ─────────────────────────────────
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Déconnexion réussie.']);
    }

    // ── GET /api/auth/me ──────────────────────────────────────
    public function me(Request $request): JsonResponse
    {
        return response()->json(
            $request->user()->load(['filiere', 'groupe'])
        );
    }

    // ── PUT /api/auth/password ────────────────────────────────
    public function updatePassword(Request $request): JsonResponse
    {
        $request->validate([
            'current_password' => 'required|string',
            'password'         => ['required', 'confirmed', Password::min(8)],
        ]);

        $user = $request->user();

        if (! Hash::check($request->current_password, $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['Le mot de passe actuel est incorrect.'],
            ]);
        }

        $user->update(['password' => Hash::make($request->password)]);

        return response()->json(['message' => 'Mot de passe mis à jour avec succès.']);
    }
}
