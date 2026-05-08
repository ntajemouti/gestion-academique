<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('absences', function (Blueprint $table) {
            $table->id();
            $table->foreignId('stagiaire_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('module_id')->constrained('modules')->cascadeOnDelete();
            $table->foreignId('formateur_id')->constrained('users')->cascadeOnDelete();
            $table->date('date');
            $table->boolean('justifiee')->default(false);
            $table->text('motif')->nullable();
            $table->string('justificatif')->nullable();    // stored file path
            $table->timestamps();

            $table->unique(['stagiaire_id', 'module_id', 'date']); // one absence per student/module/day
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('absences');
    }
};
