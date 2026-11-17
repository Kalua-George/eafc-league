<?php

namespace Database\Seeders;

use App\Models\Admin;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Creates the starter admin. Credentials come from ADMIN_USERNAME / ADMIN_PASSWORD in .env
     * (defaults: admin / admin123 -- change them before going to production).
     */
    public function run(): void
    {
        Admin::firstOrCreate(
            ['username' => env('ADMIN_USERNAME', 'admin')],
            ['password' => env('ADMIN_PASSWORD', 'admin123')],
        );
    }
}
