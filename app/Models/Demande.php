<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class Demande extends Model
{
    use HasFactory;

    protected $fillable = [
        'reference',
        'user_id',
        'type',
        'description',
        'statut',
        'fichier',
        'traite_par',
        'traite_le',
        'motif_rejet',
    ];

    protected function casts(): array
    {
        return ['traite_le' => 'datetime'];
    }

    // Auto-generate reference on creation
    protected static function boot(): void
    {
        parent::boot();
        static::creating(function (self $demande) {
            if (empty($demande->reference)) {
                $demande->reference = 'DEM-' . strtoupper(Str::random(8));
            }
        });
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function traitePar(): BelongsTo
    {
        return $this->belongsTo(User::class, 'traite_par');
    }

    // ── Status helpers ────────────────────────────────────────
    public function approve(User $admin): void
    {
        $this->update([
            'statut'    => 'Approuvée',
            'traite_par'=> $admin->id,
            'traite_le' => now(),
        ]);
    }

    public function reject(User $admin, ?string $motif = null): void
    {
        $this->update([
            'statut'      => 'Rejetée',
            'traite_par'  => $admin->id,
            'traite_le'   => now(),
            'motif_rejet' => $motif,
        ]);
    }
}
