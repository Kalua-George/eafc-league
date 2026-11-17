<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('system_logs', function (Blueprint $table) {
            $table->id();
            // Nullable so anonymous/public actions (lookups, registrations, failed logins)
            // can be recorded without being attributed to an arbitrary admin.
            $table->foreignId('admin_id')->nullable()->constrained('admins')->cascadeOnUpdate()->nullOnDelete();
            $table->string('action', 100);
            $table->string('target_table', 100);
            $table->unsignedBigInteger('target_id')->nullable();
            $table->enum('status', ['success', 'failed'])->default('success')->index();
            $table->text('details')->nullable();
            $table->timestamp('created_at')->useCurrent()->index();

            $table->index(['target_table', 'target_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('system_logs');
    }
};
