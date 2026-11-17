<?php

namespace Tests\Feature;

use App\Models\Admin;
use App\Models\Player;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PlayerApiTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): Admin
    {
        return Admin::create(['username' => 'admin', 'password' => 'secret123']);
    }

    public function test_public_registration_creates_pending_player(): void
    {
        $this->postJson('/api/players', ['gamer_tag' => 'Messi10', 'phone' => '0999000111'])
            ->assertCreated()
            ->assertJson(['success' => true, 'status' => 'pending']);

        $this->assertDatabaseHas('players', ['gamer_tag' => 'Messi10', 'status' => 'pending']);
    }

    public function test_duplicate_gamer_tag_returns_409(): void
    {
        Player::create(['gamer_tag' => 'Messi10', 'phone' => '1']);

        $this->postJson('/api/players', ['gamer_tag' => 'Messi10', 'phone' => '2'])->assertStatus(409);
    }

    public function test_registration_requires_both_fields(): void
    {
        $this->postJson('/api/players', ['gamer_tag' => 'OnlyTag'])->assertStatus(400);
    }

    public function test_admin_registration_can_auto_approve(): void
    {
        $this->actingAs($this->admin(), 'admin')
            ->postJson('/api/players', ['gamer_tag' => 'Pele', 'phone' => '3', 'admin_action' => true])
            ->assertCreated()
            ->assertJson(['status' => 'approved']);
    }

    public function test_lookup_by_gamer_tag_or_phone(): void
    {
        Player::create(['gamer_tag' => 'Zico', 'phone' => '0888']);

        $this->getJson('/api/players/search?identifier=Zico')->assertOk()->assertJsonPath('player.status', 'pending');
        $this->getJson('/api/players/search?identifier=0888')->assertOk()->assertJsonPath('player.gamer_tag', 'Zico');
        $this->getJson('/api/players/search?identifier=nobody')->assertNotFound();
        $this->getJson('/api/players/search')->assertStatus(400);
    }

    public function test_admin_can_approve_and_reject_and_repeat_without_error(): void
    {
        $player = Player::create(['gamer_tag' => 'Zico', 'phone' => '0888']);
        $admin = $this->admin();

        $this->actingAs($admin, 'admin')
            ->postJson('/api/players/status', ['player_id' => $player->id, 'action' => 'approve'])
            ->assertOk()->assertJson(['status' => 'approved']);

        // approving again used to surface as a 500 in the original (rowCount() == 0)
        $this->actingAs($admin, 'admin')
            ->postJson('/api/players/status', ['player_id' => $player->id, 'action' => 'approve'])
            ->assertOk();

        $this->actingAs($admin, 'admin')
            ->postJson('/api/players/status', ['player_id' => $player->id, 'action' => 'reject'])
            ->assertOk()->assertJson(['status' => 'rejected']);

        $this->actingAs($admin, 'admin')
            ->postJson('/api/players/status', ['player_id' => 9999, 'action' => 'approve'])
            ->assertNotFound();

        $this->actingAs($admin, 'admin')
            ->postJson('/api/players/status', ['player_id' => $player->id, 'action' => 'nope'])
            ->assertStatus(400);
    }

    public function test_admin_list_supports_status_filter(): void
    {
        Player::create(['gamer_tag' => 'A', 'phone' => '1', 'status' => 'approved']);
        Player::create(['gamer_tag' => 'B', 'phone' => '2']);

        $this->actingAs($this->admin(), 'admin')
            ->getJson('/api/players?status=approved')
            ->assertOk()
            ->assertJsonPath('count', 1)
            ->assertJsonPath('players.0.gamer_tag', 'A');
    }

    public function test_registrant_can_edit_own_profile_but_not_others(): void
    {
        $other = Player::create(['gamer_tag' => 'Other', 'phone' => '9']);

        $registration = $this->postJson('/api/players', ['gamer_tag' => 'Me', 'phone' => '1']);
        $id = $registration->json('player_id');
        $registration->assertSessionHas('player_id', $id);

        // test requests don't share cookies, so replay the session the registration created
        $this->withSession(['player_id' => $id]);

        $this->postJson('/api/players/edit', ['player_id' => $id, 'gamer_tag' => 'Me2', 'phone' => '2'])
            ->assertOk();
        $this->assertDatabaseHas('players', ['id' => $id, 'gamer_tag' => 'Me2']);

        $this->postJson('/api/players/edit', ['player_id' => $other->id, 'gamer_tag' => 'Hax', 'phone' => '2'])
            ->assertStatus(401);

        $this->postJson('/api/players/edit', ['player_id' => $id, 'gamer_tag' => 'Other', 'phone' => '2'])
            ->assertStatus(409);
    }
}
