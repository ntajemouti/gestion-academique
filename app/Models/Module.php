<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Module extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'nom',
        'filiere_id',
        'annee',
        'option_nom',
        'formateur_id',
        'heures_par_semaine',
        'coefficient',
    ];

    protected function casts(): array
    {
        return [
            'coefficient'        => 'float',
            'heures_par_semaine' => 'integer',
            'annee'              => 'integer',
        ];
    }

    public function filiere(): BelongsTo
    {
        return $this->belongsTo(Filiere::class);
    }

    public function formateur(): BelongsTo
    {
        return $this->belongsTo(User::class, 'formateur_id');
    }

    public function absences(): HasMany
    {
        return $this->hasMany(Absence::class);
    }

    public function notes(): HasMany
    {
        return $this->hasMany(Note::class);
    }

    public function emploisDuTemps(): HasMany
    {
        return $this->hasMany(EmploiDuTemps::class);
    }

    /** Scope: modules for 1ère année */
    public function scopePremiereAnnee($query)
    {
        return $query->where('annee', 1);
    }

    /** Scope: modules for 2ème année */
    public function scopeDeuxiemeAnnee($query)
    {
        return $query->where('annee', 2);
    }

    /** Scope: tronc commun (no option) */
    public function scopeTroncCommun($query)
    {
        return $query->whereNull('option_nom');
    }

    /** Scope: specific option */
    public function scopeOption($query, string $option)
    {
        return $query->where('option_nom', $option);
    }
}
