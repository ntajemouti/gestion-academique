<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Groupe;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GroupeController extends Controller
{
    // GET /api/groupes
    public function index(Request $request): JsonResponse
    {
        $query = Groupe::with(['filiere', 'formateurReferent'])
                       ->withCount('stagiaires');

        if ($request->filled('filiere_id')) {
            $query->where('filiere_id', $request->filiere_id);
        }
        if ($request->filled('statut')) {
            $query->where('statut', $request->statut);
        }
        if ($request->filled('annee')) {
            $query->where('annee', $request->annee);
        }
        if ($request->filled('search')) {
            $query->where('nom', 'like', "%{$request->search}%");
        }

        return response()->json($query->orderBy('nom')->get());
    }

    // POST /api/groupes  [admin]
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'nom'                    => 'required|string|max:100',
            'filiere_id'             => 'required|exists:filieres,id',
            'niveau'                 => 'required|string|max:50',
            'annee'                  => 'required|string|max:20',
            'formateur_referent_id'  => 'nullable|exists:users,id',
            'statut'                 => 'in:Actif,Inactif',
        ]);

        $groupe = Groupe::create($data);

        return response()->json(
            $groupe->load(['filiere', 'formateurReferent'])->loadCount('stagiaires'),
            201
        );
    }

    // GET /api/groupes/{id}
    public function show(Groupe $groupe): JsonResponse
    {
        return response()->json(
            $groupe->load([
                'filiere',
                'formateurReferent',
                'stagiaires',
                'emploisDuTemps.module',
                'emploisDuTemps.formateur',
            ])->loadCount('stagiaires')
        );
    }

    // PUT /api/groupes/{id}  [admin]
    public function update(Request $request, Groupe $groupe): JsonResponse
    {
        $data = $request->validate([
            'nom'                    => 'required|string|max:100',
            'filiere_id'             => 'required|exists:filieres,id',
            'niveau'                 => 'required|string|max:50',
            'annee'                  => 'required|string|max:20',
            'formateur_referent_id'  => 'nullable|exists:users,id',
            'statut'                 => 'in:Actif,Inactif',
        ]);

        $groupe->update($data);

        return response()->json(
            $groupe->load(['filiere', 'formateurReferent'])->loadCount('stagiaires')
        );
    }

    // DELETE /api/groupes/{id}  [admin]
    public function destroy(Groupe $groupe): JsonResponse
    {
        if ($groupe->stagiaires()->exists()) {
            return response()->json([
                'message' => 'Impossible de supprimer un groupe qui contient des stagiaires.',
            ], 422);
        }

        $groupe->delete();

        return response()->json(['message' => 'Groupe supprimé.']);
    }
}
