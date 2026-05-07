<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\FiliereController;
use App\Http\Controllers\Api\ModuleController;
use App\Http\Controllers\Api\GroupeController;
use App\Http\Controllers\Api\ClubController;
use App\Http\Controllers\Api\DemandeController;
use App\Http\Controllers\Api\AbsenceController;
use App\Http\Controllers\Api\NoteController;
use App\Http\Controllers\Api\EmploiDuTempsController;
use App\Http\Controllers\Api\DashboardController;

/*
|--------------------------------------------------------------------------
| Public routes — no auth required
|--------------------------------------------------------------------------
*/
Route::prefix('auth')->group(function () {
    Route::post('register', [AuthController::class, 'register']);
    Route::post('login',    [AuthController::class, 'login'])
         ->middleware('throttle:10,1'); // max 10 login attempts / minute
});

// Public: Home page data (filieres + clubs visible without login)
Route::get('filieres',           [FiliereController::class, 'index']);
Route::get('filieres/{filiere}', [FiliereController::class, 'show']);
Route::get('clubs',              [ClubController::class, 'publicIndex']);   // ← public version (no is_member)
Route::get('clubs/{club}',       [ClubController::class, 'publicShow']);    // ← public version

/*
|--------------------------------------------------------------------------
| Protected routes — Sanctum Bearer token required
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->group(function () {

    // ── Auth ─────────────────────────────────────────────────────────────
    Route::prefix('auth')->group(function () {
        Route::post('logout',        [AuthController::class, 'logout']);
        Route::get('me',             [AuthController::class, 'me']);
        Route::put('password',       [AuthController::class, 'updatePassword']);
        Route::post('avatar',        [UserController::class, 'updateAvatar']);
    });

    // ── Dashboard (role-aware — same endpoint, different response) ────────
    Route::get('dashboard', [DashboardController::class, 'index']);

    // ── Filieres ─────────────────────────────────────────────────────────
    // Public GET routes defined above; only write ops need auth+role
    Route::middleware('role:Administrateur')->group(function () {
        Route::post('filieres',             [FiliereController::class, 'store']);
        Route::put('filieres/{filiere}',    [FiliereController::class, 'update']);
        Route::delete('filieres/{filiere}', [FiliereController::class, 'destroy']);
    });

    // ── Modules ──────────────────────────────────────────────────────────
    Route::get('modules',          [ModuleController::class, 'index']);
    Route::get('modules/{module}', [ModuleController::class, 'show']);
    Route::middleware('role:Administrateur')->group(function () {
        Route::post('modules',            [ModuleController::class, 'store']);
        Route::put('modules/{module}',    [ModuleController::class, 'update']);
        Route::delete('modules/{module}', [ModuleController::class, 'destroy']);
    });

    // ── Groupes ──────────────────────────────────────────────────────────
    Route::get('groupes',          [GroupeController::class, 'index']);
    Route::get('groupes/{groupe}', [GroupeController::class, 'show']);
    Route::middleware('role:Administrateur')->group(function () {
        Route::post('groupes',            [GroupeController::class, 'store']);
        Route::put('groupes/{groupe}',    [GroupeController::class, 'update']);
        Route::delete('groupes/{groupe}', [GroupeController::class, 'destroy']);
    });

    // ── Users
    // ⚠️  Named sub-routes MUST be declared BEFORE {user} wildcard ─────────
    Route::get('users/formateurs', [UserController::class, 'formateurs']);
    Route::middleware('role:Administrateur,Formateur')->group(function () {
        Route::get('users/stagiaires', [UserController::class, 'stagiaires']);
    });
    Route::middleware('role:Administrateur')->group(function () {
        Route::get('users',                  [UserController::class, 'index']);
        Route::post('users',                 [UserController::class, 'store']);
        Route::get('users/{user}',           [UserController::class, 'show']);
        Route::put('users/{user}',           [UserController::class, 'update']);
        Route::delete('users/{user}',        [UserController::class, 'destroy']);
        Route::patch('users/{user}/statut',  [UserController::class, 'updateStatut']);
    });

    // ── Clubs (authenticated version — includes is_member flag) ──────────
    Route::get('clubs',             [ClubController::class, 'index']);
    Route::get('clubs/{club}',      [ClubController::class, 'show']);
    Route::post('clubs/{club}/join',    [ClubController::class, 'join']);
    Route::delete('clubs/{club}/leave', [ClubController::class, 'leave']);
    Route::middleware('role:Administrateur')->group(function () {
        Route::post('clubs',                           [ClubController::class, 'store']);
        Route::put('clubs/{club}',                     [ClubController::class, 'update']);
        Route::delete('clubs/{club}',                  [ClubController::class, 'destroy']);
        Route::delete('clubs/{club}/members/{userId}', [ClubController::class, 'removeMember']);
    });

    // ── Demandes ──────────────────────────────────────────────────────────
    Route::get('demandes',              [DemandeController::class, 'index']);
    Route::get('demandes/{demande}',    [DemandeController::class, 'show']);
    Route::post('demandes',             [DemandeController::class, 'store']);
    Route::delete('demandes/{demande}', [DemandeController::class, 'destroy']);
    Route::middleware('role:Administrateur')->group(function () {
        Route::patch('demandes/{demande}/approve', [DemandeController::class, 'approve']);
        Route::patch('demandes/{demande}/reject',  [DemandeController::class, 'reject']);
    });

    // ── Absences
    // ⚠️  'absences/stats' MUST come BEFORE 'absences/{absence}' ──────────
    Route::get('absences/stats',     [AbsenceController::class, 'stats']);
    Route::get('absences',           [AbsenceController::class, 'index']);
    Route::get('absences/{absence}', [AbsenceController::class, 'show']);
    Route::middleware('role:Administrateur,Formateur')->group(function () {
        Route::post('absences',             [AbsenceController::class, 'store']);
        Route::put('absences/{absence}',    [AbsenceController::class, 'update']);
        Route::delete('absences/{absence}', [AbsenceController::class, 'destroy']);
    });

    // ── Notes
    // ⚠️  'notes/bulletin' MUST come BEFORE 'notes/{note}' ───────────────
    Route::get('notes/bulletin', [NoteController::class, 'bulletin']);
    Route::get('notes',          [NoteController::class, 'index']);
    Route::get('notes/{note}',   [NoteController::class, 'show']);
    Route::middleware('role:Administrateur,Formateur')->group(function () {
        Route::post('notes',          [NoteController::class, 'store']);
        Route::put('notes/{note}',    [NoteController::class, 'update']);
        Route::delete('notes/{note}', [NoteController::class, 'destroy']);
    });

    // ── Emplois du Temps ──────────────────────────────────────────────────
    Route::get('emplois-du-temps',                 [EmploiDuTempsController::class, 'index']);
    Route::get('emplois-du-temps/{emploiDuTemps}', [EmploiDuTempsController::class, 'show']);
    Route::middleware('role:Administrateur')->group(function () {
        Route::post('emplois-du-temps',                   [EmploiDuTempsController::class, 'store']);
        Route::put('emplois-du-temps/{emploiDuTemps}',    [EmploiDuTempsController::class, 'update']);
        Route::delete('emplois-du-temps/{emploiDuTemps}', [EmploiDuTempsController::class, 'destroy']);
    });
});
