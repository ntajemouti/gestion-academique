<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Filiere extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'nom',
        'description',
        'duree',
        'color',
        'statut',
    ];

    public function modules(): HasMany
    {
        return $this->hasMany(Module::class);
    }

    public function groupes(): HasMany
    {
        return $this->hasMany(Groupe::class);
    }

    public function stagiaires(): HasMany
    {
        return $this->hasMany(User::class)->where('role', 'Stagiaire');
    }
}
