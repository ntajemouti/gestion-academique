<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('emplois_du_temps', function (Blueprint $table) {
            $table->id();
            $table->foreignId('groupe_id')->constrained('groupes')->cascadeOnDelete();
            $table->foreignId('module_id')->constrained('modules')->cascadeOnDelete();
            $table->foreignId('formateur_id')->constrained('users')->cascadeOnDelete();
            $table->enum('jour', ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']);
            $table->time('heure_debut');
            $table->time('heure_fin');
            $table->string('salle');
            $table->timestamps();

            // Prevent double-booking a room or a formateur at the same time
            $table->unique(['salle', 'jour', 'heure_debut'], 'salle_slot_unique');
            $table->unique(['formateur_id', 'jour', 'heure_debut'], 'formateur_slot_unique');
            $table->unique(['groupe_id', 'jour', 'heure_debut'], 'groupe_slot_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('emplois_du_temps');
    }
};
