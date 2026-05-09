<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('absences', function (Blueprint $table) {
            // Link absence to the specific timetable slot (séance)
            $table->foreignId('seance_id')
                  ->nullable()
                  ->after('formateur_id')
                  ->constrained('emplois_du_temps')
                  ->nullOnDelete();

            // Also link to the group so admin can filter by group easily
            $table->foreignId('groupe_id')
                  ->nullable()
                  ->after('seance_id')
                  ->constrained('groupes')
                  ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('absences', function (Blueprint $table) {
            $table->dropForeign(['seance_id']);
            $table->dropForeign(['groupe_id']);
            $table->dropColumn(['seance_id', 'groupe_id']);
        });
    }
};
