<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Club extends Model
{
    use HasFactory;

    protected $fillable = [
        'nom',
        'description',
        'responsable_id',
        'capacite_max',
        'icon',
        'statut',
    ];

    protected function casts(): array
    {
        return ['capacite_max' => 'integer'];
    }

    public function responsable(): BelongsTo
    {
        return $this->belongsTo(User::class, 'responsable_id');
    }

    public function membres(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'club_user')
                    ->withPivot('joined_at')
                    ->withTimestamps();
    }

    public function getNombreMembresAttribute(): int
    {
        return $this->membres()->count();
    }

    public function isFullAttribute(): bool
    {
        return $this->nombre_membres >= $this->capacite_max;
    }
}
