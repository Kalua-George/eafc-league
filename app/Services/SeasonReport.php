<?php

namespace App\Services;

use App\Models\GameMatch;
use App\Models\Player;
use App\Models\Season;
use Illuminate\Support\Collection;

/**
 * Builds the standings / top scorer / clean sheet report for a season.
 * Only matches that have a recorded score count towards the table.
 */
class SeasonReport
{
    public function build(Season $season): array
    {
        /** @var Collection<int, GameMatch> $matches */
        $matches = GameMatch::with(['homePlayer:id,gamer_tag', 'awayPlayer:id,gamer_tag'])
            ->where('season_id', $season->id)
            ->get();

        $played = $matches->filter(fn (GameMatch $m) => $m->isPlayed());

        // Everyone approved, plus anyone who actually has a fixture this season.
        $participantIds = $matches->pluck('home_player_id')->merge($matches->pluck('away_player_id'))->unique();
        $players = Player::approved()->get()
            ->merge(Player::whereIn('id', $participantIds)->get())
            ->unique('id');

        $stats = $players->mapWithKeys(fn (Player $p) => [$p->id => [
            'id' => $p->id,
            'gamer_tag' => $p->gamer_tag,
            'points' => 0,
            'goal_diff' => 0,
            'goals_for' => 0,
            'goals_against' => 0,
            'wins' => 0,
            'draws' => 0,
            'losses' => 0,
            'clean_sheets' => 0,
        ]])->all();

        foreach ($played as $m) {
            $this->apply($stats[$m->home_player_id], $m->home_goals, $m->away_goals);
            $this->apply($stats[$m->away_player_id], $m->away_goals, $m->home_goals);
        }

        $standings = collect($stats)
            ->sort(fn ($a, $b) => [$b['points'], $b['goal_diff'], $b['goals_for']] <=> [$a['points'], $a['goal_diff'], $a['goals_for']])
            ->values();

        $goalRank = $standings->sortByDesc('goals_for')->values();

        $cleanSheets = $standings
            ->filter(fn ($p) => $p['clean_sheets'] > 0)
            ->sortByDesc('clean_sheets')
            ->map(fn ($p) => ['gamer_tag' => $p['gamer_tag'], 'clean_sheets' => $p['clean_sheets']])
            ->values();

        $matchRows = $matches
            ->sortBy(fn (GameMatch $m) => $m->played_at?->timestamp ?? PHP_INT_MAX)
            ->map(fn (GameMatch $m) => [
                'id' => $m->id,
                'home_player' => $m->homePlayer->gamer_tag,
                'away_player' => $m->awayPlayer->gamer_tag,
                'home_goals' => $m->home_goals,
                'away_goals' => $m->away_goals,
                'played_at' => $m->played_at?->toIso8601String(),
            ])
            ->values();

        return [
            'season' => [
                'id' => $season->id,
                'name' => $season->name,
                'start_date' => $season->start_date->toDateString(),
                'end_date' => $season->end_date->toDateString(),
            ],
            'standings' => $standings->all(),
            'winner' => $this->leader($standings, $played->isNotEmpty()),
            'top_scorer' => $this->leader($goalRank, $played->isNotEmpty() && $goalRank->first()['goals_for'] > 0),
            'most_clean_sheets' => $cleanSheets->first()['gamer_tag'] ?? 'N/A',
            'matches' => $matchRows->all(),
            'goal_rank' => $goalRank->all(),
            'clean_sheets' => $cleanSheets->all(),
        ];
    }

    private function apply(array &$row, int $for, int $against): void
    {
        $row['goals_for'] += $for;
        $row['goals_against'] += $against;
        $row['goal_diff'] = $row['goals_for'] - $row['goals_against'];

        if ($against === 0) {
            $row['clean_sheets']++;
        }

        if ($for > $against) {
            $row['wins']++;
            $row['points'] += 3;
        } elseif ($for === $against) {
            $row['draws']++;
            $row['points'] += 1;
        } else {
            $row['losses']++;
        }
    }

    private function leader(Collection $ranked, bool $hasData): string
    {
        return $hasData ? ($ranked->first()['gamer_tag'] ?? 'N/A') : 'N/A';
    }
}
