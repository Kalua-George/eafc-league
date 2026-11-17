<?php

namespace App\Http\Controllers\Api;

use App\Models\Season;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SeasonController extends ApiController
{
    /**
     * Public: the season that is running today.
     * Admin: all seasons, or a single one with ?season_id=.
     */
    public function index(Request $request): JsonResponse
    {
        if ($this->isAdmin()) {
            if ($request->has('season_id')) {
                $seasonId = (int) $request->query('season_id');
                $season = Season::find($seasonId);

                if (! $season) {
                    $this->log('get_season', 'seasons', 'Season not found', $seasonId, 'failed');

                    return $this->fail('Season not found', 404);
                }

                $this->log('get_season', 'seasons', 'Viewed season details', $seasonId);

                return $this->ok(['season' => $season->toApiArray()]);
            }

            $seasons = Season::orderByDesc('start_date')->get()->map->toApiArray()->all();
            $this->log('get_seasons', 'seasons', 'Viewed seasons list');

            return $this->ok(['seasons' => $seasons]);
        }

        $current = Season::orderByDesc('start_date')->get()->first(fn (Season $s) => $s->status() === 'current');

        if (! $current) {
            $this->log('get_season', 'seasons', 'No active season currently', null, 'failed');

            return $this->fail('No active season currently', 404);
        }

        $this->log('get_season', 'seasons', 'Viewed current season', $current->id);

        return $this->ok(['season' => $current->toApiArray()]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validated(
            $request,
            [
                'name' => ['required', 'string', 'max:150'],
                'start_date' => ['required', 'date'],
                'end_date' => ['required', 'date', 'after_or_equal:start_date'],
            ],
            'add_season',
            'seasons',
        );

        if (Season::where('name', $data['name'])->exists()) {
            $this->log('add_season', 'seasons', 'Duplicate season name', null, 'failed');

            return $this->fail('A season with that name already exists', 409);
        }

        $season = Season::create($data);
        $this->log('add_season', 'seasons', "Created season: {$season->name}", $season->id);

        return $this->ok(['message' => 'Season added successfully', 'season_id' => $season->id], 201);
    }
}
