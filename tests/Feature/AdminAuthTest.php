<?php

namespace Tests\Feature;

use App\Models\Admin;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminAuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_log_in(): void
    {
        Admin::create(['username' => 'admin', 'password' => 'secret123']);

        $this->postJson('/api/admin/login', ['username' => 'admin', 'password' => 'secret123'])
            ->assertOk()
            ->assertJson(['success' => true, 'username' => 'admin']);

        $this->assertAuthenticated('admin');
        $this->assertDatabaseHas('system_logs', ['action' => 'login', 'status' => 'success']);
    }

    public function test_admin_can_log_out(): void
    {
        $admin = Admin::create(['username' => 'admin', 'password' => 'secret123']);

        $this->actingAs($admin, 'admin')
            ->postJson('/api/admin/logout')
            ->assertOk()
            ->assertJson(['success' => true]);

        $this->assertGuest('admin');
    }

    public function test_invalid_credentials_are_rejected_and_logged(): void
    {
        Admin::create(['username' => 'admin', 'password' => 'secret123']);

        $this->postJson('/api/admin/login', ['username' => 'admin', 'password' => 'wrong'])
            ->assertStatus(401)
            ->assertJson(['success' => false, 'error' => 'Invalid credentials']);

        $this->assertDatabaseHas('system_logs', ['action' => 'login', 'status' => 'failed', 'admin_id' => null]);
    }

    public function test_missing_credentials_return_400(): void
    {
        $this->postJson('/api/admin/login', [])->assertStatus(400);
    }

    public function test_admin_endpoints_require_login(): void
    {
        foreach (['/api/players', '/api/matches', '/api/systemlogs'] as $url) {
            $this->getJson($url)->assertStatus(401)->assertJson(['success' => false, 'error' => 'Unauthorized']);
        }
    }

    public function test_dashboard_page_redirects_guests_to_login_and_login_redirects_admins(): void
    {
        $this->get('/dashboard')->assertRedirect('/login');

        $admin = Admin::create(['username' => 'admin', 'password' => 'secret123']);

        $this->actingAs($admin, 'admin')->get('/dashboard')->assertOk();
        $this->actingAs($admin, 'admin')->get('/login')->assertRedirect('/dashboard');
    }

    public function test_public_pages_render(): void
    {
        foreach (['/', '/registration', '/lookup', '/login'] as $url) {
            $this->get($url)->assertOk()->assertSee('EAFC League');
        }
    }
}
