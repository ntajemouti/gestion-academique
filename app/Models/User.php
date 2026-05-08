<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'matricule',
        'prenom',
        'nom',
        'email',
        'password',
        'role',
        'statut',
        'avatar',
        'specialite',
        'filiere_id',
        'groupe_id',
    ];

    protected $hidden = ['password', 'remember_token'];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password'          => 'hashed',
        ];
    }

    // ── Helpers ──────────────────────────────────────────────
    public function isAdmin(): bool       { return $this->role === 'Administrateur'; }
    public function isStagiaire(): bool   { return $this->role === 'Stagiaire'; }
    public function isFormateur(): bool   { return $this->role === 'Formateur'; }
    public function isActif(): bool       { return $this->statut === 'Actif'; }

    public function getFullNameAttribute(): string
    {
        return "{$this->prenom} {$this->nom}";
    }

    // ── Relationships ─────────────────────────────────────────
    public function filiere(): BelongsTo
    {
        return $this->belongsTo(Filiere::class);
    }

    public function groupe(): BelongsTo
    {
        return $this->belongsTo(Groupe::class);
    }

    /** Modules taught by this Formateur */
    public function modulesEnseignes(): HasMany
    {
        return $this->hasMany(Module::class, 'formateur_id');
    }

    /** Clubs this user is a member of */
    public function clubs(): BelongsToMany
    {
        return $this->belongsToMany(Club::class, 'club_user')
                    ->withPivot('joined_at')
                    ->withTimestamps();
    }

    /** Clubs this user manages */
    public function clubsGeres(): HasMany
    {
        return $this->hasMany(Club::class, 'responsable_id');
    }

    /** Stagiaire's absences */
    public function absences(): HasMany
    {
        return $this->hasMany(Absence::class, 'stagiaire_id');
    }

    /** Absences recorded BY this formateur */
    public function absencesSaisies(): HasMany
    {
        return $this->hasMany(Absence::class, 'formateur_id');
    }

    /** Stagiaire's notes */
    public function notes(): HasMany
    {
        return $this->hasMany(Note::class, 'stagiaire_id');
    }

    /** Notes given BY this formateur */
    public function notesSaisies(): HasMany
    {
        return $this->hasMany(Note::class, 'formateur_id');
    }

    /** Stagiaire's demandes */
    public function demandes(): HasMany
    {
        return $this->hasMany(Demande::class, 'user_id');
    }

    /** Groupes where this formateur is the referent */
    public function groupesReferent(): HasMany
    {
        return $this->hasMany(Groupe::class, 'formateur_referent_id');
    }

    /** Timetable slots for this formateur */
    public function emploisDuTemps(): HasMany
    {
        return $this->hasMany(EmploiDuTemps::class, 'formateur_id');
    }
}
