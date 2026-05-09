<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('notes', function (Blueprint $table) {
            // Denormalized groupe_id for faster admin/formateur queries
            $table->foreignId('groupe_id')
                  ->nullable()
                  ->after('formateur_id')
                  ->constrained('groupes')
                  ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('notes', function (Blueprint $table) {
            $table->dropForeign(['groupe_id']);
            $table->dropColumn('groupe_id');
        });
    }
};
