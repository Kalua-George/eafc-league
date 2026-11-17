<?php

namespace Tests\Feature;

use App\Models\GameMatch;
use App\Models\Player;
use App\Models\Season;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SeasonReportTest extends TestCase
{
    use RefreshDatabase;

    public function test_standings_only_count_played_matches_and_do_not_leak_phone_numbers(): void
    {
        $season = Season::create(['name' => 'S', 'start_date' => '2026-01-01', 'end_date' => '2026-12-31']);
        $a = Player::create(['gamer_tag' => 'A', 'phone' => '111', 'status' => 'approved']);
        $b = Player::create(['gamer_tag' => 'B', 'phone' => '222', 'status' => 'approved']);
        $c = Player::create(['gamer_tag' => 'C', 'phone' => '333', 'status' => 'approved']);

        $make = fn ($h, $aw, $hg = null, $ag = null) => GameMatch::create([
            'season_id' => $season->id, 'home_player_id' => $h->id, 'away_player_id' => $aw->id,
            'scheduled_date' => '2026-02-01 00:00:00', 'home_goals' => $hg, 'away_goals' => $ag,
            'status' => $hg === null ? 'scheduled' : 'completed', 'played_at' => $hg === null ? null : now(),
        ]);

        $make($a, $b, 2, 0); // A beats B, clean sheet for A
        $make($b, $c, 1, 1); // draw
        $make($a, $c);       // unplayed -> must not count as a loss for anyone

        $report = $this->getJson("/api/reports/season?season_id={$season->id}")
            ->assertOk()->json('report');

        $rows = collect($report['standings'])->keyBy('gamer_tag');

        $this->assertSame(3, $rows['A']['points']);
        $this->assertSame([1, 0, 0], [$rows['A']['wins'], $rows['A']['draws'], $rows['A']['losses']]);
        $this->assertSame(1, $rows['B']['points']);
        $this->assertSame([0, 1, 1], [$rows['B']['wins'], $rows['B']['draws'], $rows['B']['losses']]);
        $this->assertSame([0, 1, 0], [$rows['C']['wins'], $rows['C']['draws'], $rows['C']['losses']]);

        $this->assertSame('A', $report['standings'][0]['gamer_tag']);
        $this->assertSame('A', $report['winner']);
        $this->assertSame('A', $report['top_scorer']);
        $this->assertSame('A', $report['most_clean_sheets']);
        $this->assertSame([['gamer_tag' => 'A', 'clean_sheets' => 1]], $report['clean_sheets']);

        $this->assertArrayNotHasKey('phone', $report['standings'][0]);
    }

    public function test_report_validation(): void
    {
        $this->getJson('/api/reports/season')->assertStatus(400);
        $this->getJson('/api/reports/season?season_id=999')->assertNotFound();
    }

    public function test_empty_season_has_no_winner(): void
    {
        $season = Season::create(['name' => 'S', 'start_date' => '2026-01-01', 'end_date' => '2026-12-31']);
        Player::create(['gamer_tag' => 'A', 'phone' => '1', 'status' => 'approved']);

        $report = $this->getJson("/api/reports/season?season_id={$season->id}")->json('report');

        $this->assertSame('N/A', $report['winner']);
        $this->assertSame('N/A', $report['top_scorer']);
    }
}
