<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\EmploiDuTemps;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EmploiDuTempsController extends Controller
{
    // GET /api/emplois-du-temps
    public function index(Request $request): JsonResponse
    {
        $query = EmploiDuTemps::with([
            'groupe:id,nom,filiere_id',
            'module:id,code,nom',
            'formateur:id,prenom,nom',
        ]);

        $auth = $request->user();

        // Formateurs only see their own schedule
        if ($auth->isFormateur()) {
            $query->where('formateur_id', $auth->id);
        }

        // Stagiaires see their groupe's schedule
        if ($auth->isStagiaire()) {
            if ($auth->groupe_id) {
                $query->where('groupe_id', $auth->groupe_id);
            } else {
                return response()->json([]);
            }
        }

        if ($request->filled('groupe_id'))    $query->where('groupe_id', $request->groupe_id);
        if ($request->filled('formateur_id')) $query->where('formateur_id', $request->formateur_id);
        if ($request->filled('jour'))         $query->where('jour', $request->jour);
        if ($request->filled('module_id'))    $query->where('module_id', $request->module_id);

        $jours = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

        $slots = $query->orderByRaw("FIELD(jour, 'Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi')")
                       ->orderBy('heure_debut')
                       ->get();

        // Group by day for easy frontend consumption
        $grouped = collect($jours)->mapWithKeys(fn($j) => [
            $j => $slots->where('jour', $j)->values(),
        ]);

        return response()->json($grouped);
    }

    // POST /api/emplois-du-temps  [admin]
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'groupe_id'    => 'required|exists:groupes,id',
            'module_id'    => 'required|exists:modules,id',
            'formateur_id' => 'required|exists:users,id',
            'jour'         => 'required|in:Lundi,Mardi,Mercredi,Jeudi,Vendredi,Samedi',
            'heure_debut'  => 'required|date_format:H:i',
            'heure_fin'    => 'required|date_format:H:i|after:heure_debut',
            'salle'        => 'required|string|max:50',
        ]);

        // Conflict checks
        $conflicts = $this->checkConflicts($data);
        if ($conflicts) {
            return response()->json(['message' => $conflicts], 422);
        }

        $slot = EmploiDuTemps::create($data);

        return response()->json(
            $slot->load(['groupe:id,nom', 'module:id,code,nom', 'formateur:id,prenom,nom']),
            201
        );
    }

    // GET /api/emplois-du-temps/{id}
    public function show(EmploiDuTemps $emploiDuTemps): JsonResponse
    {
        return response()->json(
            $emploiDuTemps->load(['groupe', 'module', 'formateur:id,prenom,nom'])
        );
    }

    // PUT /api/emplois-du-temps/{id}  [admin]
    public function update(Request $request, EmploiDuTemps $emploiDuTemps): JsonResponse
    {
        $data = $request->validate([
            'groupe_id'    => 'required|exists:groupes,id',
            'module_id'    => 'required|exists:modules,id',
            'formateur_id' => 'required|exists:users,id',
            'jour'         => 'required|in:Lundi,Mardi,Mercredi,Jeudi,Vendredi,Samedi',
            'heure_debut'  => 'required|date_format:H:i',
            'heure_fin'    => 'required|date_format:H:i|after:heure_debut',
            'salle'        => 'required|string|max:50',
        ]);

        $conflicts = $this->checkConflicts($data, $emploiDuTemps->id);
        if ($conflicts) {
            return response()->json(['message' => $conflicts], 422);
        }

        $emploiDuTemps->update($data);

        return response()->json(
            $emploiDuTemps->load(['groupe:id,nom', 'module:id,code,nom', 'formateur:id,prenom,nom'])
        );
    }

    // DELETE /api/emplois-du-temps/{id}  [admin]
    public function destroy(EmploiDuTemps $emploiDuTemps): JsonResponse
    {
        $emploiDuTemps->delete();

        return response()->json(['message' => 'Créneau supprimé.']);
    }

    // ── Private helpers ───────────────────────────────────────
    private function checkConflicts(array $data, ?int $excludeId = null): ?string
    {
        $base = EmploiDuTemps::where('jour', $data['jour'])
                             ->where('heure_debut', $data['heure_debut']);

        if ($excludeId) {
            $base->where('id', '!=', $excludeId);
        }

        if ((clone $base)->where('salle', $data['salle'])->exists()) {
            return "La salle {$data['salle']} est déjà occupée à ce créneau.";
        }

        if ((clone $base)->where('formateur_id', $data['formateur_id'])->exists()) {
            return "Ce formateur a déjà un cours à ce créneau.";
        }

        if ((clone $base)->where('groupe_id', $data['groupe_id'])->exists()) {
            return "Ce groupe a déjà un cours à ce créneau.";
        }

        return null;
    }
}
