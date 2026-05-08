<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Absence;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AbsenceController extends Controller
{
    // GET /api/absences
    public function index(Request $request): JsonResponse
    {
        $query = Absence::with([
            'stagiaire:id,prenom,nom,matricule,groupe_id',
            'module:id,code,nom',
            'formateur:id,prenom,nom',
        ]);

        $auth = $request->user();

        if ($auth->isStagiaire()) {
            $query->where('stagiaire_id', $auth->id);
        } elseif ($auth->isFormateur()) {
            $query->where('formateur_id', $auth->id);
        }
        // Admin sees all

        if ($request->filled('stagiaire_id'))  $query->where('stagiaire_id', $request->stagiaire_id);
        if ($request->filled('module_id'))     $query->where('module_id', $request->module_id);
        if ($request->filled('justifiee'))     $query->where('justifiee', filter_var($request->justifiee, FILTER_VALIDATE_BOOLEAN));
        if ($request->filled('date_debut'))    $query->whereDate('date', '>=', $request->date_debut);
        if ($request->filled('date_fin'))      $query->whereDate('date', '<=', $request->date_fin);
        if ($request->filled('groupe_id')) {
            $query->whereHas('stagiaire', fn($q) => $q->where('groupe_id', $request->groupe_id));
        }

        return response()->json(
            $query->orderByDesc('date')->paginate($request->input('per_page', 30))
        );
    }

    // POST /api/absences  [formateur, admin]
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'stagiaire_id' => 'required|exists:users,id',
            'module_id'    => 'required|exists:modules,id',
            'date'         => 'required|date',
            'justifiee'    => 'boolean',
            'motif'        => 'nullable|string|max:500',
        ]);

        // Verify the target user is a stagiaire
        $stagiaire = User::findOrFail($data['stagiaire_id']);
        if (! $stagiaire->isStagiaire()) {
            return response()->json(['message' => 'L\'utilisateur ciblé n\'est pas un stagiaire.'], 422);
        }

        // Formateur can only record absences for their own modules
        $auth = $request->user();
        if ($auth->isFormateur()) {
            $module = \App\Models\Module::findOrFail($data['module_id']);
            if ($module->formateur_id !== $auth->id) {
                return response()->json(['message' => 'Vous ne pouvez saisir des absences que pour vos propres modules.'], 403);
            }
            $data['formateur_id'] = $auth->id;
        } else {
            $data['formateur_id'] = $request->input('formateur_id', $auth->id);
        }

        // Prevent duplicate
        $exists = Absence::where('stagiaire_id', $data['stagiaire_id'])
                         ->where('module_id', $data['module_id'])
                         ->whereDate('date', $data['date'])
                         ->exists();

        if ($exists) {
            return response()->json(['message' => 'Une absence a déjà été enregistrée pour ce stagiaire, ce module et cette date.'], 422);
        }

        $absence = Absence::create($data);

        return response()->json(
            $absence->load(['stagiaire:id,prenom,nom,matricule', 'module:id,code,nom', 'formateur:id,prenom,nom']),
            201
        );
    }

    // GET /api/absences/{id}
    public function show(Request $request, Absence $absence): JsonResponse
    {
        $auth = $request->user();

        if ($auth->isStagiaire() && $absence->stagiaire_id !== $auth->id) {
            return response()->json(['message' => 'Accès non autorisé.'], 403);
        }

        return response()->json(
            $absence->load(['stagiaire:id,prenom,nom,matricule', 'module:id,code,nom,coefficient', 'formateur:id,prenom,nom'])
        );
    }

    // PUT /api/absences/{id}  [formateur, admin]
    public function update(Request $request, Absence $absence): JsonResponse
    {
        $auth = $request->user();

        if ($auth->isFormateur() && $absence->formateur_id !== $auth->id) {
            return response()->json(['message' => 'Vous ne pouvez modifier que vos propres enregistrements.'], 403);
        }

        $data = $request->validate([
            'justifiee'     => 'required|boolean',
            'motif'         => 'nullable|string|max:500',
            'justificatif'  => 'nullable|string|max:255',
        ]);

        $absence->update($data);

        return response()->json($absence->load(['stagiaire:id,prenom,nom', 'module:id,code,nom']));
    }

    // DELETE /api/absences/{id}  [formateur, admin]
    public function destroy(Request $request, Absence $absence): JsonResponse
    {
        $auth = $request->user();

        if ($auth->isFormateur() && $absence->formateur_id !== $auth->id) {
            return response()->json(['message' => 'Vous ne pouvez supprimer que vos propres enregistrements.'], 403);
        }

        $absence->delete();

        return response()->json(['message' => 'Absence supprimée.']);
    }

    // GET /api/absences/stats  — summary per stagiaire
    public function stats(Request $request): JsonResponse
    {
        $request->validate([
            'stagiaire_id' => 'required|exists:users,id',
        ]);

        $absences = Absence::where('stagiaire_id', $request->stagiaire_id)
                           ->with('module:id,code,nom')
                           ->get();

        $total       = $absences->count();
        $justifiees  = $absences->where('justifiee', true)->count();
        $injustifiees= $total - $justifiees;

        $parModule = $absences->groupBy('module_id')->map(function ($items, $moduleId) {
            $module = $items->first()->module;
            return [
                'module'        => $module?->nom,
                'code'          => $module?->code,
                'total'         => $items->count(),
                'justifiees'    => $items->where('justifiee', true)->count(),
                'injustifiees'  => $items->where('justifiee', false)->count(),
            ];
        })->values();

        return response()->json([
            'total'         => $total,
            'justifiees'    => $justifiees,
            'injustifiees'  => $injustifiees,
            'par_module'    => $parModule,
        ]);
    }
}
