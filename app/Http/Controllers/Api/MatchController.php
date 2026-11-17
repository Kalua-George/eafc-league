<?php

namespace App\Http\Controllers\Api;

use App\Enums\MatchStatus;
use App\Models\GameMatch;
use App\Models\Season;
use App\Services\FixtureGenerator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use RuntimeException;

class MatchController extends ApiController
{
    public function index(): JsonResponse
    {
        $matches = GameMatch::with(['homePlayer:id,gamer_tag', 'awayPlayer:id,gamer_tag'])
            ->orderByDesc('scheduled_date')
            ->orderByDesc('id')
            ->get()
            ->map(fn (GameMatch $m) => [
                'id' => $m->id,
                'season_id' => $m->season_id,
                'scheduled_date' => $m->scheduled_date->format('Y-m-d H:i:s'),
                'match_date' => $m->scheduled_date->format('Y-m-d H:i:s'),
                'home_goals' => $m->home_goals,
                'away_goals' => $m->away_goals,
                'home_team' => $m->homePlayer->gamer_tag,
                'away_team' => $m->awayPlayer->gamer_tag,
                'result' => $m->isPlayed() ? "{$m->home_goals}-{$m->away_goals}" : null,
                'status' => $m->status->value,
            ])
            ->all();

        $this->log('get_matches', 'matches', 'Viewed matches list');

        return $this->ok(['matches' => $matches]);
    }

    public function createFixtures(Request $request, FixtureGenerator $generator): JsonResponse
    {
        $data = $this->validated(
            $request,
            [
                'season_id' => ['required', 'integer', 'min:1'],
                'games_per_pair' => ['nullable', 'integer', 'min:1', 'max:10'],
                'start_date' => ['required', 'date'],
                'games_per_day' => ['nullable', 'integer', 'min:1', 'max:100'],
            ],
            'create_fixture',
            'matches',
            'Invalid input. Please provide a season, games per pair, and a start date.',
            (int) $request->input('season_id') ?: null,
        );

        $seasonId = (int) $data['season_id'];

        if (! Season::whereKey($seasonId)->exists()) {
            $this->log('create_fixture', 'matches', 'Season not found', $seasonId, 'failed');

            return $this->fail('Season not found', 404);
        }

        try {
            $total = $generator->generate(
                $seasonId,
                (int) ($data['games_per_pair'] ?? 1),
                $data['start_date'],
                (int) ($data['games_per_day'] ?? 2),
            );
        } catch (RuntimeException $e) {
            $this->log('create_fixture', 'matches', $e->getMessage(), $seasonId, 'failed');

            return $this->fail($e->getMessage(), 422);
        }

        $this->log('create_fixture', 'matches', "Created {$total} fixtures for season {$seasonId}", $seasonId);

        return $this->ok(['message' => 'Fixtures created successfully', 'total_matches' => $total], 201);
    }

    public function recordResult(Request $request): JsonResponse
    {
        $data = $this->validated(
            $request,
            [
                'match_id' => ['required', 'integer', 'min:1'],
                'result' => ['required', 'string', 'regex:/^\s*\d{1,3}\s*-\s*\d{1,3}\s*$/'],
            ],
            'record_result',
            'matches',
            "Match ID and a result in the form '2-1' are required.",
            (int) $request->input('match_id') ?: null,
        );

        $match = GameMatch::find($data['match_id']);

        if (! $match) {
            $this->log('record_result', 'matches', "Match {$data['match_id']} not found", (int) $data['match_id'], 'failed');

            return $this->fail('Match not found.', 404);
        }

        [$home, $away] = array_map('intval', explode('-', $data['result']));

        $match->update([
            'home_goals' => $home,
            'away_goals' => $away,
            'status' => MatchStatus::Completed,
            'played_at' => now(),
        ]);

        $this->log('record_result', 'matches', "Recorded result {$home}-{$away} for match {$match->id}", $match->id);

        return $this->ok(['message' => 'Result recorded successfully.']);
    }

    public function reschedule(Request $request): JsonResponse
    {
        $data = $this->validated(
            $request,
            [
                'match_id' => ['required', 'integer', 'min:1'],
                'new_date' => ['required', 'date'],
            ],
            'reschedule_match',
            'matches',
            'Match ID and a valid new date are required.',
            (int) $request->input('match_id') ?: null,
        );

        $match = GameMatch::find($data['match_id']);

        if (! $match) {
            $this->log('reschedule_match', 'matches', "Match {$data['match_id']} not found", (int) $data['match_id'], 'failed');

            return $this->fail('Match not found.', 404);
        }

        $match->update(['scheduled_date' => $data['new_date'], 'status' => MatchStatus::Postponed]);

        $this->log('reschedule_match', 'matches', "Rescheduled match {$match->id} to {$data['new_date']}", $match->id);

        return $this->ok(['message' => 'Match rescheduled successfully.']);
    }
}
