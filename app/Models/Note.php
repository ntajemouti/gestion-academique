<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Note extends Model
{
    use HasFactory;

    protected $fillable = [
        'stagiaire_id',
        'module_id',
        'formateur_id',
        'note',
        'coefficient',
        'date_evaluation',
        'type_evaluation',
        'commentaire',
    ];

    protected function casts(): array
    {
        return [
            'note'           => 'float',
            'coefficient'    => 'float',
            'date_evaluation'=> 'date',
        ];
    }

    public function stagiaire(): BelongsTo
    {
        return $this->belongsTo(User::class, 'stagiaire_id');
    }

    public function module(): BelongsTo
    {
        return $this->belongsTo(Module::class);
    }

    public function formateur(): BelongsTo
    {
        return $this->belongsTo(User::class, 'formateur_id');
    }

    // ── Computed ──────────────────────────────────────────────
    public function getNotePondereeAttribute(): float
    {
        return $this->note * $this->coefficient;
    }

    public function getMentionAttribute(): string
    {
        return match(true) {
            $this->note >= 16 => 'Très Bien',
            $this->note >= 14 => 'Bien',
            $this->note >= 12 => 'Assez Bien',
            $this->note >= 10 => 'Passable',
            default           => 'Insuffisant',
        };
    }
}
