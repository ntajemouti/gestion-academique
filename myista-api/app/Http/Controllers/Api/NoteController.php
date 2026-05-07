<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Note;
use App\Models\Module;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NoteController extends Controller
{
    // GET /api/notes
    public function index(Request $request): JsonResponse
    {
        $query = Note::with([
            'stagiaire:id,prenom,nom,matricule,groupe_id',
            'module:id,code,nom,coefficient',
            'formateur:id,prenom,nom',
        ]);

        $auth = $request->user();

        if ($auth->isStagiaire()) {
            $query->where('stagiaire_id', $auth->id);
        } elseif ($auth->isFormateur()) {
            $query->where('formateur_id', $auth->id);
        }

        if ($request->filled('stagiaire_id'))   $query->where('stagiaire_id', $request->stagiaire_id);
        if ($request->filled('module_id'))      $query->where('module_id', $request->module_id);
        if ($request->filled('type_evaluation'))$query->where('type_evaluation', $request->type_evaluation);
        if ($request->filled('groupe_id')) {
            $query->whereHas('stagiaire', fn($q) => $q->where('groupe_id', $request->groupe_id));
        }

        return response()->json(
            $query->orderByDesc('date_evaluation')->paginate($request->input('per_page', 30))
        );
    }

    // POST /api/notes  [formateur, admin]
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'stagiaire_id'    => 'required|exists:users,id',
            'module_id'       => 'required|exists:modules,id',
            'note'            => 'required|numeric|min:0|max:20',
            'date_evaluation' => 'required|date',
            'type_evaluation' => 'nullable|string|max:50',
            'commentaire'     => 'nullable|string|max:500',
        ]);

        // Verify stagiaire
        $stagiaire = User::findOrFail($data['stagiaire_id']);
        if (! $stagiaire->isStagiaire()) {
            return response()->json(['message' => 'L\'utilisateur ciblé n\'est pas un stagiaire.'], 422);
        }

        // Scoping for formateurs
        $auth = $request->user();
        $module = Module::findOrFail($data['module_id']);

        if ($auth->isFormateur() && $module->formateur_id !== $auth->id) {
            return response()->json(['message' => 'Vous ne pouvez saisir des notes que pour vos propres modules.'], 403);
        }

        $data['formateur_id'] = $auth->isFormateur() ? $auth->id : ($request->input('formateur_id', $auth->id));
        $data['coefficient']  = $module->coefficient;

        $note = Note::create($data);

        return response()->json(
            $note->load(['stagiaire:id,prenom,nom,matricule', 'module:id,code,nom', 'formateur:id,prenom,nom']),
            201
        );
    }

    // GET /api/notes/{id}
    public function show(Request $request, Note $note): JsonResponse
    {
        $auth = $request->user();

        if ($auth->isStagiaire() && $note->stagiaire_id !== $auth->id) {
            return response()->json(['message' => 'Accès non autorisé.'], 403);
        }

        return response()->json(
            $note->load(['stagiaire:id,prenom,nom,matricule', 'module:id,code,nom,coefficient', 'formateur:id,prenom,nom'])
        );
    }

    // PUT /api/notes/{id}  [formateur, admin]
    public function update(Request $request, Note $note): JsonResponse
    {
        $auth = $request->user();

        if ($auth->isFormateur() && $note->formateur_id !== $auth->id) {
            return response()->json(['message' => 'Vous ne pouvez modifier que vos propres notes.'], 403);
        }

        $data = $request->validate([
            'note'            => 'required|numeric|min:0|max:20',
            'date_evaluation' => 'required|date',
            'type_evaluation' => 'nullable|string|max:50',
            'commentaire'     => 'nullable|string|max:500',
        ]);

        $note->update($data);

        return response()->json($note->load(['stagiaire:id,prenom,nom', 'module:id,code,nom']));
    }

    // DELETE /api/notes/{id}  [formateur, admin]
    public function destroy(Request $request, Note $note): JsonResponse
    {
        $auth = $request->user();

        if ($auth->isFormateur() && $note->formateur_id !== $auth->id) {
            return response()->json(['message' => 'Vous ne pouvez supprimer que vos propres notes.'], 403);
        }

        $note->delete();

        return response()->json(['message' => 'Note supprimée.']);
    }

    // GET /api/notes/bulletin  — full transcript for one stagiaire
    public function bulletin(Request $request): JsonResponse
    {
        $request->validate(['stagiaire_id' => 'required|exists:users,id']);

        $auth      = $request->user();
        $stagiaireId = $request->stagiaire_id;

        if ($auth->isStagiaire() && $auth->id != $stagiaireId) {
            return response()->json(['message' => 'Accès non autorisé.'], 403);
        }

        $notes = Note::where('stagiaire_id', $stagiaireId)
                     ->with('module:id,code,nom,coefficient,filiere_id')
                     ->get();

        $parModule = $notes->groupBy('module_id')->map(function ($items) {
            $module          = $items->first()->module;
            $totalPondere    = $items->sum(fn($n) => $n->note * $n->coefficient);
            $totalCoeff      = $items->sum('coefficient');
            $moyenne         = $totalCoeff > 0 ? $totalPondere / $totalCoeff : 0;

            return [
                'module'      => $module?->nom,
                'code'        => $module?->code,
                'coefficient' => $module?->coefficient,
                'notes'       => $items->pluck('note'),
                'moyenne'     => round($moyenne, 2),
                'mention'     => $this->getMention($moyenne),
            ];
        })->values();

        $globalMoyenne = $parModule->avg('moyenne');

        return response()->json([
            'stagiaire_id'    => $stagiaireId,
            'par_module'      => $parModule,
            'moyenne_generale'=> round($globalMoyenne, 2),
            'mention'         => $this->getMention($globalMoyenne),
        ]);
    }

    private function getMention(float $moyenne): string
    {
        return match(true) {
            $moyenne >= 16 => 'Très Bien',
            $moyenne >= 14 => 'Bien',
            $moyenne >= 12 => 'Assez Bien',
            $moyenne >= 10 => 'Passable',
            default        => 'Insuffisant',
        };
    }
}
