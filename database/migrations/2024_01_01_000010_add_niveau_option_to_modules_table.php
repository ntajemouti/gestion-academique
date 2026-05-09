<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('modules', function (Blueprint $table) {
            // année: 1 = 1ère année, 2 = 2ème année
            $table->unsignedTinyInteger('annee')->default(1)->after('filiere_id');
            // option: null = tronc commun, otherwise option name like "Web Full Stack"
            $table->string('option_nom')->nullable()->after('annee');
        });
    }

    public function down(): void
    {
        Schema::table('modules', function (Blueprint $table) {
            $table->dropColumn(['annee', 'option_nom']);
        });
    }
};
