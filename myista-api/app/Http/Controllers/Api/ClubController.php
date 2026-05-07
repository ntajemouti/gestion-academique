<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Club;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ClubController extends Controller
{
    // ─────────────────────────────────────────────────────────────────────
    // PUBLIC (no auth) — used on the Home page before login
    // ─────────────────────────────────────────────────────────────────────

    // GET /api/clubs  (public, no is_member flag)
    public function publicIndex(Request $request): JsonResponse
    {
        $query = Club::with(['responsable:id,prenom,nom,email'])
                     ->withCount('membres');

        if ($request->filled('statut')) {
            $query->where('statut', $request->statut);
        }
        if ($request->filled('search')) {
            $query->where('nom', 'like', "%{$request->search}%");
        }

        return response()->json($query->orderBy('nom')->get());
    }

    // GET /api/clubs/{id}  (public)
    public function publicShow(Club $club): JsonResponse
    {
        $club->load(['responsable:id,prenom,nom,email'])
             ->loadCount('membres');

        return response()->json($club);
    }

    // ─────────────────────────────────────────────────────────────────────
    // AUTHENTICATED — includes is_member per authenticated user
    // ─────────────────────────────────────────────────────────────────────

    // GET /api/clubs  (authenticated)
    public function index(Request $request): JsonResponse
    {
        $query = Club::with(['responsable:id,prenom,nom,email'])
                     ->withCount('membres');

        if ($request->filled('statut')) {
            $query->where('statut', $request->statut);
        }
        if ($request->filled('search')) {
            $query->where('nom', 'like', "%{$request->search}%");
        }

        $clubs  = $query->orderBy('nom')->get();
        $authId = $request->user()->id;

        // Load member IDs once per club to annotate is_member
        $clubs->each(function ($club) use ($authId) {
            $club->is_member      = $club->membres->contains('id', $authId);
            $club->nombre_membres = $club->membres_count;
            unset($club->membres);
        });

        return response()->json($clubs);
    }

    // GET /api/clubs/{id}  (authenticated)
    public function show(Request $request, Club $club): JsonResponse
    {
        $club->load(['responsable:id,prenom,nom,email', 'membres:id,prenom,nom,matricule,role'])
             ->loadCount('membres');

        $club->is_member      = $club->membres->contains('id', $request->user()->id);
        $club->nombre_membres = $club->membres_count;

        return response()->json($club);
    }

    // POST /api/clubs  [admin]
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'nom'            => 'required|string|max:100',
            'description'    => 'nullable|string',
            'responsable_id' => 'nullable|exists:users,id',
            'capacite_max'   => 'required|integer|min:1|max:500',
            'icon'           => 'nullable|string|max:50',
            'statut'         => 'in:Actif,Inactif',
        ]);

        $club = Club::create($data);

        return response()->json(
            $club->load('responsable:id,prenom,nom')->loadCount('membres'),
            201
        );
    }

    // PUT /api/clubs/{id}  [admin]
    public function update(Request $request, Club $club): JsonResponse
    {
        $data = $request->validate([
            'nom'            => 'required|string|max:100',
            'description'    => 'nullable|string',
            'responsable_id' => 'nullable|exists:users,id',
            'capacite_max'   => 'required|integer|min:1|max:500',
            'icon'           => 'nullable|string|max:50',
            'statut'         => 'in:Actif,Inactif',
        ]);

        $club->update($data);

        return response()->json(
            $club->load('responsable:id,prenom,nom')->loadCount('membres')
        );
    }

    // DELETE /api/clubs/{id}  [admin]
    public function destroy(Club $club): JsonResponse
    {
        $club->membres()->detach(); // clean pivot first
        $club->delete();

        return response()->json(['message' => 'Club supprimé.']);
    }

    // POST /api/clubs/{id}/join  [any authenticated user]
    public function join(Request $request, Club $club): JsonResponse
    {
        $user = $request->user();

        if ($club->statut !== 'Actif') {
            return response()->json(['message' => 'Ce club n\'est pas actif.'], 422);
        }

        if ($club->membres()->where('user_id', $user->id)->exists()) {
            return response()->json(['message' => 'Vous êtes déjà membre de ce club.'], 422);
        }

        if ($club->membres()->count() >= $club->capacite_max) {
            return response()->json(['message' => 'Ce club a atteint sa capacité maximale.'], 422);
        }

        $club->membres()->attach($user->id, ['joined_at' => now()]);

        return response()->json([
            'message'      => 'Vous avez rejoint le club avec succès.',
            'nombre_membres' => $club->membres()->count(),
            'is_member'    => true,
        ]);
    }

    // DELETE /api/clubs/{id}/leave  [any authenticated user]
    public function leave(Request $request, Club $club): JsonResponse
    {
        $user = $request->user();

        if (! $club->membres()->where('user_id', $user->id)->exists()) {
            return response()->json(['message' => 'Vous n\'êtes pas membre de ce club.'], 422);
        }

        $club->membres()->detach($user->id);

        return response()->json([
            'message'      => 'Vous avez quitté le club.',
            'nombre_membres' => $club->membres()->count(),
            'is_member'    => false,
        ]);
    }

    // DELETE /api/clubs/{id}/members/{userId}  [admin]
    public function removeMember(Club $club, int $userId): JsonResponse
    {
        $club->membres()->detach($userId);

        return response()->json([
            'message'        => 'Membre retiré du club.',
            'nombre_membres' => $club->membres()->count(),
        ]);
    }
}
