<?php

namespace App\Services;

use App\Models\GameMatch;
use App\Models\Player;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class FixtureGenerator
{
    /**
     * Creates a round robin between all approved players, $gamesPerPair games per pair,
     * spread over consecutive days with at most $gamesPerDay matches per day.
     *
     * @return int number of matches created
     */
    public function generate(int $seasonId, int $gamesPerPair, string $startDate, int $gamesPerDay = 2): int
    {
        $playerIds = Player::approved()->orderBy('id')->pluck('id')->all();

        if (count($playerIds) < 2) {
            throw new RuntimeException('Not enough approved players to generate fixtures');
        }

        $pairings = [];
        foreach ($playerIds as $i => $home) {
            for ($j = $i + 1; $j < count($playerIds); $j++) {
                for ($k = 0; $k < $gamesPerPair; $k++) {
                    $pairings[] = [$home, $playerIds[$j]];
                }
            }
        }

        // Shuffle first, then hand out dates, so opponents are mixed across the calendar.
        shuffle($pairings);

        $date = Carbon::parse($startDate)->startOfDay();
        $gamesPerDay = max(1, $gamesPerDay);
        $now = now();
        $rows = [];

        foreach ($pairings as $n => [$home, $away]) {
            if ($n > 0 && $n % $gamesPerDay === 0) {
                $date = $date->copy()->addDay();
            }

            $rows[] = [
                'season_id' => $seasonId,
                'home_player_id' => $home,
                'away_player_id' => $away,
                'scheduled_date' => $date->format('Y-m-d H:i:s'),
                'status' => 'scheduled',
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        DB::transaction(function () use ($rows) {
            foreach (array_chunk($rows, 100) as $chunk) {
                GameMatch::insert($chunk);
            }
        });

        return count($rows);
    }
}
