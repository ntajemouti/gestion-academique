<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('groupes', function (Blueprint $table) {
            $table->id();
            $table->string('nom');
            $table->foreignId('filiere_id')->constrained('filieres')->cascadeOnDelete();
            $table->string('niveau');           // e.g. "1ère année"
            $table->string('annee');            // e.g. "2024-2025"
            $table->foreignId('formateur_referent_id')->nullable()->constrained('users')->nullOnDelete();
            $table->enum('statut', ['Actif', 'Inactif'])->default('Actif');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('groupes');
    }
};
