<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Demande;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class DemandeController extends Controller
{
    // GET /api/demandes
    public function index(Request $request): JsonResponse
    {
        $query = Demande::with(['user:id,prenom,nom,matricule', 'traitePar:id,prenom,nom']);

        // Each user only sees their own demandes (stagiaires & formateurs alike)
        $auth = $request->user();
        if ($auth->isStagiaire() || $auth->isFormateur()) {
            $query->where('user_id', $auth->id);
        }

        if ($request->filled('statut')) {
            $query->where('statut', $request->statut);
        }
        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }
        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('reference', 'like', "%{$request->search}%")
                  ->orWhereHas('user', fn($u) =>
                      $u->where('nom', 'like', "%{$request->search}%")
                        ->orWhere('prenom', 'like', "%{$request->search}%")
                  );
            });
        }

        return response()->json(
            $query->orderByDesc('created_at')->paginate($request->input('per_page', 20))
        );
    }

    // POST /api/demandes  [stagiaire]
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'type'        => 'required|in:Attestation de présence,Certificat de scolarité,Relevé de notes,Autre',
            'description' => 'nullable|string|max:1000',
            'fichier'     => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120',
        ]);

        $path = null;
        if ($request->hasFile('fichier')) {
            $path = $request->file('fichier')->store('demandes', 'public');
        }

        $demande = Demande::create([
            'user_id'     => $request->user()->id,
            'type'        => $data['type'],
            'description' => $data['description'] ?? null,
            'fichier'     => $path,
            'statut'      => 'En attente',
        ]);

        return response()->json($demande->load('user:id,prenom,nom,matricule'), 201);
    }

    // GET /api/demandes/{id}
    public function show(Request $request, Demande $demande): JsonResponse
    {
        $auth = $request->user();

        if (($auth->isStagiaire() || $auth->isFormateur()) && $demande->user_id !== $auth->id) {
            return response()->json(['message' => 'Accès non autorisé.'], 403);
        }

        return response()->json(
            $demande->load(['user:id,prenom,nom,matricule,email', 'traitePar:id,prenom,nom'])
        );
    }

    // PATCH /api/demandes/{id}/approve  [admin]
    public function approve(Request $request, Demande $demande): JsonResponse
    {
        if ($demande->statut !== 'En attente') {
            return response()->json(['message' => 'Cette demande a déjà été traitée.'], 422);
        }

        $demande->approve($request->user());

        return response()->json([
            'message' => 'Demande approuvée.',
            'demande' => $demande->fresh()->load(['user:id,prenom,nom', 'traitePar:id,prenom,nom']),
        ]);
    }

    // PATCH /api/demandes/{id}/reject  [admin]
    public function reject(Request $request, Demande $demande): JsonResponse
    {
        if ($demande->statut !== 'En attente') {
            return response()->json(['message' => 'Cette demande a déjà été traitée.'], 422);
        }

        $request->validate(['motif_rejet' => 'nullable|string|max:500']);

        $demande->reject($request->user(), $request->motif_rejet);

        return response()->json([
            'message' => 'Demande rejetée.',
            'demande' => $demande->fresh()->load(['user:id,prenom,nom', 'traitePar:id,prenom,nom']),
        ]);
    }

    // DELETE /api/demandes/{id}  [stagiaire or formateur — only if En attente]
    public function destroy(Request $request, Demande $demande): JsonResponse
    {
        $auth = $request->user();

        if ($auth->isStagiaire() || $auth->isFormateur()) {
            if ($demande->user_id !== $auth->id) {
                return response()->json(['message' => 'Accès non autorisé.'], 403);
            }
            if ($demande->statut !== 'En attente') {
                return response()->json(['message' => 'Impossible de supprimer une demande déjà traitée.'], 422);
            }
        }

        if ($demande->fichier) {
            Storage::disk('public')->delete($demande->fichier);
        }

        $demande->delete();

        return response()->json(['message' => 'Demande supprimée.']);
    }
}
