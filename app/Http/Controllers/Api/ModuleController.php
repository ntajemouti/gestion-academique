<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Module;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ModuleController extends Controller
{
    // GET /api/modules
    public function index(Request $request): JsonResponse
    {
        $query = Module::with(['filiere', 'formateur']);

        if ($request->filled('filiere_id'))  $query->where('filiere_id', $request->filiere_id);
        if ($request->filled('formateur_id'))$query->where('formateur_id', $request->formateur_id);
        if ($request->filled('annee'))       $query->where('annee', $request->annee);
        if ($request->filled('option_nom'))  $query->where('option_nom', $request->option_nom);
        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('nom', 'like', "%{$request->search}%")
                  ->orWhere('code', 'like', "%{$request->search}%");
            });
        }

        // Formateurs only see their own modules
        $auth = $request->user();
        if ($auth && $auth->isFormateur()) {
            $query->where('formateur_id', $auth->id);
        }

        return response()->json($query->orderBy('annee')->orderBy('nom')->get());
    }

    // GET /api/filieres/{filiere}/structure  — structured by year and option
    public function structureByFiliere(Request $request, int $filiereId): JsonResponse
    {
        $modules = Module::where('filiere_id', $filiereId)
                         ->with('formateur:id,prenom,nom')
                         ->orderBy('annee')
                         ->orderBy('nom')
                         ->get();

        // Year 1: tronc commun
        $annee1 = $modules->where('annee', 1)->values();

        // Year 2: group by option (null = tronc commun)
        $annee2Modules = $modules->where('annee', 2);
        $annee2TroncCommun = $annee2Modules->whereNull('option_nom')->values();
        $options = $annee2Modules->whereNotNull('option_nom')
            ->groupBy('option_nom')
            ->map(fn($items, $nom) => ['nom' => $nom, 'modules' => $items->values()])
            ->values();

        return response()->json([
            'annee_1' => $annee1,
            'annee_2' => [
                'tronc_commun' => $annee2TroncCommun,
                'options'      => $options,
            ],
        ]);
    }

    // POST /api/modules  [admin]
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'code'               => 'required|string|max:20|unique:modules,code',
            'nom'                => 'required|string|max:150',
            'filiere_id'         => 'required|exists:filieres,id',
            'annee'              => 'required|integer|in:1,2',
            'option_nom'         => 'nullable|string|max:100',
            'formateur_id'       => 'nullable|exists:users,id',
            'heures_par_semaine' => 'required|integer|min:1|max:40',
            'coefficient'        => 'required|numeric|min:0.5|max:10',
        ]);

        if (! empty($data['formateur_id'])) {
            $f = User::findOrFail($data['formateur_id']);
            if (! $f->isFormateur()) {
                return response()->json(['message' => "L'utilisateur assigné n'est pas un formateur."], 422);
            }
        }

        $module = Module::create($data);

        return response()->json($module->load(['filiere', 'formateur']), 201);
    }

    // GET /api/modules/{id}
    public function show(Module $module): JsonResponse
    {
        return response()->json($module->load(['filiere', 'formateur']));
    }

    // PUT /api/modules/{id}  [admin]
    public function update(Request $request, Module $module): JsonResponse
    {
        $data = $request->validate([
            'code'               => "required|string|max:20|unique:modules,code,{$module->id}",
            'nom'                => 'required|string|max:150',
            'filiere_id'         => 'required|exists:filieres,id',
            'annee'              => 'required|integer|in:1,2',
            'option_nom'         => 'nullable|string|max:100',
            'formateur_id'       => 'nullable|exists:users,id',
            'heures_par_semaine' => 'required|integer|min:1|max:40',
            'coefficient'        => 'required|numeric|min:0.5|max:10',
        ]);

        if (! empty($data['formateur_id'])) {
            $f = User::findOrFail($data['formateur_id']);
            if (! $f->isFormateur()) {
                return response()->json(['message' => "L'utilisateur assigné n'est pas un formateur."], 422);
            }
        }

        $module->update($data);

        return response()->json($module->load(['filiere', 'formateur']));
    }

    // DELETE /api/modules/{id}  [admin]
    public function destroy(Module $module): JsonResponse
    {
        if ($module->notes()->exists() || $module->absences()->exists()) {
            return response()->json([
                'message' => 'Impossible de supprimer un module qui possède des notes ou des absences enregistrées.',
            ], 422);
        }

        $module->delete();

        return response()->json(['message' => 'Module supprimé.']);
    }
}
