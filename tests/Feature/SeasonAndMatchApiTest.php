<?php

namespace Tests\Feature;

use App\Models\Admin;
use App\Models\GameMatch;
use App\Models\Player;
use App\Models\Season;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SeasonAndMatchApiTest extends TestCase
{
    use RefreshDatabase;

    private function adminTest(): static
    {
        return $this->actingAs(Admin::firstOrCreate(['username' => 'admin'], ['password' => 'secret123']), 'admin');
    }

    public function test_public_sees_only_the_current_season(): void
    {
        $this->getJson('/api/seasons')->assertNotFound();

        Season::create(['name' => 'Old', 'start_date' => now()->subYear()->toDateString(), 'end_date' => now()->subMonths(6)->toDateString()]);
        Season::create(['name' => 'Now', 'start_date' => now()->subDay()->toDateString(), 'end_date' => now()->addMonth()->toDateString()]);

        $this->getJson('/api/seasons')
            ->assertOk()
            ->assertJsonPath('season.name', 'Now')
            ->assertJsonPath('season.status', 'current');
    }

    public function test_admin_sees_all_seasons_with_status(): void
    {
        Season::create(['name' => 'Old', 'start_date' => now()->subYear()->toDateString(), 'end_date' => now()->subMonths(6)->toDateString()]);
        Season::create(['name' => 'Next', 'start_date' => now()->addMonth()->toDateString(), 'end_date' => now()->addMonths(3)->toDateString()]);

        $response = $this->adminTest()->getJson('/api/seasons')->assertOk();

        $statuses = collect($response->json('seasons'))->pluck('status', 'name');
        $this->assertSame('ended', $statuses['Old']);
        $this->assertSame('pending', $statuses['Next']);
    }

    public function test_admin_creates_seasons_with_validation(): void
    {
        $this->adminTest()
            ->postJson('/api/seasons', ['name' => 'S1', 'start_date' => '2026-01-01', 'end_date' => '2026-06-01'])
            ->assertCreated();

        $this->adminTest()
            ->postJson('/api/seasons', ['name' => 'S1', 'start_date' => '2026-01-01', 'end_date' => '2026-06-01'])
            ->assertStatus(409);

        $this->adminTest()
            ->postJson('/api/seasons', ['name' => 'S2', 'start_date' => '2026-06-01', 'end_date' => '2026-01-01'])
            ->assertStatus(400);
    }

    public function test_fixture_generation_creates_round_robin_and_respects_games_per_day(): void
    {
        $season = Season::create(['name' => 'S', 'start_date' => '2026-01-01', 'end_date' => '2026-12-31']);
        foreach (['A', 'B', 'C', 'D'] as $i => $tag) {
            Player::create(['gamer_tag' => $tag, 'phone' => (string) $i, 'status' => 'approved']);
        }
        Player::create(['gamer_tag' => 'Pending', 'phone' => '99']); // not approved: excluded

        $this->adminTest()
            ->postJson('/api/matches/fixtures', [
                'season_id' => $season->id, 'games_per_pair' => 2, 'start_date' => '2026-02-01', 'games_per_day' => 3,
            ])
            ->assertCreated()
            ->assertJson(['total_matches' => 12]); // C(4,2) * 2

        $this->assertSame(12, GameMatch::count());
        $perDay = GameMatch::all()->groupBy(fn ($m) => $m->scheduled_date->toDateString())->map->count();
        $this->assertSame(3, $perDay->max());
        $this->assertSame('2026-02-01', $perDay->keys()->sort()->first());
    }

    public function test_fixture_generation_errors(): void
    {
        $season = Season::create(['name' => 'S', 'start_date' => '2026-01-01', 'end_date' => '2026-12-31']);

        // fewer than two approved players
        $this->adminTest()
            ->postJson('/api/matches/fixtures', ['season_id' => $season->id, 'start_date' => '2026-02-01'])
            ->assertStatus(422);

        $this->adminTest()
            ->postJson('/api/matches/fixtures', ['season_id' => 999, 'start_date' => '2026-02-01'])
            ->assertNotFound();

        $this->adminTest()
            ->postJson('/api/matches/fixtures', ['season_id' => $season->id])
            ->assertStatus(400);
    }

    public function test_record_result_and_reschedule(): void
    {
        $season = Season::create(['name' => 'S', 'start_date' => '2026-01-01', 'end_date' => '2026-12-31']);
        $a = Player::create(['gamer_tag' => 'A', 'phone' => '1', 'status' => 'approved']);
        $b = Player::create(['gamer_tag' => 'B', 'phone' => '2', 'status' => 'approved']);
        $match = GameMatch::create([
            'season_id' => $season->id, 'home_player_id' => $a->id, 'away_player_id' => $b->id,
            'scheduled_date' => '2026-02-01 00:00:00',
        ]);

        $this->adminTest()->postJson('/api/matches/result', ['match_id' => $match->id, 'result' => '3-1'])->assertOk();
        // recording the identical score again must still succeed
        $this->adminTest()->postJson('/api/matches/result', ['match_id' => $match->id, 'result' => '3-1'])->assertOk();

        $match->refresh();
        $this->assertSame([3, 1, 'completed'], [$match->home_goals, $match->away_goals, $match->status->value]);
        $this->assertNotNull($match->played_at);

        $this->adminTest()->postJson('/api/matches/result', ['match_id' => $match->id, 'result' => 'abc'])->assertStatus(400);
        $this->adminTest()->postJson('/api/matches/result', ['match_id' => 999, 'result' => '1-0'])->assertNotFound();

        $this->adminTest()->postJson('/api/matches/reschedule', ['match_id' => $match->id, 'new_date' => '2026-03-05'])->assertOk();
        $this->assertSame('postponed', $match->fresh()->status->value);
        $this->assertSame('2026-03-05', $match->fresh()->scheduled_date->toDateString());

        $this->adminTest()->getJson('/api/matches')
            ->assertOk()
            ->assertJsonPath('matches.0.home_team', 'A')
            ->assertJsonPath('matches.0.result', '3-1');
    }
}
