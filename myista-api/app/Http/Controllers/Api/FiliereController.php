<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Filiere;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FiliereController extends Controller
{
    // GET /api/filieres
    public function index(Request $request): JsonResponse
    {
        $query = Filiere::withCount(['modules', 'groupes']);

        if ($request->filled('statut')) {
            $query->where('statut', $request->statut);
        }
        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('nom', 'like', "%{$request->search}%")
                  ->orWhere('code', 'like', "%{$request->search}%");
            });
        }

        return response()->json($query->orderBy('nom')->get());
    }

    // POST /api/filieres  [admin]
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'code'        => 'required|string|max:20|unique:filieres,code',
            'nom'         => 'required|string|max:150',
            'description' => 'nullable|string',
            'duree'       => 'required|integer|min:1|max:5',
            'color'       => 'nullable|string|max:20',
            'statut'      => 'in:Actif,Inactif',
        ]);

        $filiere = Filiere::create($data);

        return response()->json($filiere->loadCount(['modules', 'groupes']), 201);
    }

    // GET /api/filieres/{id}
    public function show(Filiere $filiere): JsonResponse
    {
        return response()->json(
            $filiere->load(['modules.formateur', 'groupes.formateurReferent'])
                    ->loadCount(['modules', 'groupes'])
        );
    }

    // PUT /api/filieres/{id}  [admin]
    public function update(Request $request, Filiere $filiere): JsonResponse
    {
        $data = $request->validate([
            'code'        => "required|string|max:20|unique:filieres,code,{$filiere->id}",
            'nom'         => 'required|string|max:150',
            'description' => 'nullable|string',
            'duree'       => 'required|integer|min:1|max:5',
            'color'       => 'nullable|string|max:20',
            'statut'      => 'in:Actif,Inactif',
        ]);

        $filiere->update($data);

        return response()->json($filiere->loadCount(['modules', 'groupes']));
    }

    // DELETE /api/filieres/{id}  [admin]
    public function destroy(Filiere $filiere): JsonResponse
    {
        if ($filiere->modules()->exists() || $filiere->groupes()->exists()) {
            return response()->json([
                'message' => 'Impossible de supprimer une filière qui possède des modules ou des groupes.',
            ], 422);
        }

        $filiere->delete();

        return response()->json(['message' => 'Filière supprimée.']);
    }
}
