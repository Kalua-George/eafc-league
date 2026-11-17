<?php

namespace App\Http\Controllers\Api;

use App\Models\Season;
use App\Services\SeasonReport;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReportController extends ApiController
{
    public function season(Request $request, SeasonReport $reports): JsonResponse
    {
        $seasonId = (int) $request->query('season_id');

        if ($seasonId <= 0) {
            $this->log('get_season_report', 'reports', 'Missing season_id', null, 'failed');

            return $this->fail('Missing season_id', 400);
        }

        $season = Season::find($seasonId);

        if (! $season) {
            $this->log('get_season_report', 'reports', 'Season not found', $seasonId, 'failed');

            return $this->fail('Season not found', 404);
        }

        $this->log('get_season_report', 'reports', "Generated season report for season {$seasonId}", $seasonId);

        return $this->ok(['report' => $reports->build($season)]);
    }
}
