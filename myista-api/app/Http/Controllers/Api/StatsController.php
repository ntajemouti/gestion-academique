<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Club;
use App\Models\Filiere;
use App\Models\User;
use Illuminate\Http\JsonResponse;

class StatsController extends Controller
{
   
    public function public(): JsonResponse
    {
        return response()->json([
            'stagiaires' => User::where('role', 'Stagiaire')->where('statut', 'Actif')->count(),
            'formateurs' => User::where('role', 'Formateur')->where('statut', 'Actif')->count(),
            'filieres'   => Filiere::where('statut', 'Actif')->count(),
            'clubs'      => Club::where('statut', 'Actif')->count(),
        ]);
    }
}