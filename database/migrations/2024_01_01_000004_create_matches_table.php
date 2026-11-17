<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('matches', function (Blueprint $table) {
            $table->id();
            $table->foreignId('season_id')->constrained('seasons')->cascadeOnUpdate()->cascadeOnDelete();
            $table->foreignId('home_player_id')->constrained('players')->cascadeOnUpdate()->restrictOnDelete();
            $table->foreignId('away_player_id')->constrained('players')->cascadeOnUpdate()->restrictOnDelete();
            $table->dateTime('scheduled_date')->index();
            $table->unsignedInteger('home_goals')->nullable();
            $table->unsignedInteger('away_goals')->nullable();
            $table->enum('status', ['scheduled', 'postponed', 'completed'])->default('scheduled')->index();
            $table->dateTime('played_at')->nullable()->index();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('matches');
    }
};
