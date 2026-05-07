<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Groupe extends Model
{
    use HasFactory;

    protected $fillable = [
        'nom',
        'filiere_id',
        'niveau',
        'annee',
        'formateur_referent_id',
        'statut',
    ];

    public function filiere(): BelongsTo
    {
        return $this->belongsTo(Filiere::class);
    }

    public function formateurReferent(): BelongsTo
    {
        return $this->belongsTo(User::class, 'formateur_referent_id');
    }

    public function stagiaires(): HasMany
    {
        return $this->hasMany(User::class)->where('role', 'Stagiaire');
    }

    public function emploisDuTemps(): HasMany
    {
        return $this->hasMany(EmploiDuTemps::class);
    }

    // Computed: number of stagiaires
    public function getNombreStagiairesAttribute(): int
    {
        return $this->stagiaires()->count();
    }
}
