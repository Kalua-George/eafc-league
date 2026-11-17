<?php

use App\Http\Controllers\Api\AdminAuthController;
use App\Http\Controllers\Api\HealthController;
use App\Http\Controllers\Api\MatchController;
use App\Http\Controllers\Api\PlayerController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\SeasonController;
use App\Http\Controllers\Api\SystemLogController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| JSON API  (prefix: /api, route names: api.*)
|--------------------------------------------------------------------------
| Same endpoints as the original api/routes.php, same {"success": ...} payloads.
*/

Route::get('/health', [HealthController::class, 'check'])->name('health');

// --- Admin session ---------------------------------------------------------
Route::post('/admin/login', [AdminAuthController::class, 'login'])->middleware('throttle:10,1')->name('admin.login');
Route::post('/admin/logout', [AdminAuthController::class, 'logout'])->name('admin.logout');

// --- Public ----------------------------------------------------------------
Route::get('/players/search', [PlayerController::class, 'search'])->middleware('throttle:60,1')->name('players.search');
Route::post('/players', [PlayerController::class, 'store'])->middleware('throttle:20,1')->name('players.store');
Route::post('/players/edit', [PlayerController::class, 'update'])->name('players.update'); // admin or the registrant's own session
Route::get('/seasons', [SeasonController::class, 'index'])->name('seasons.index');          // public: current season, admin: all
Route::get('/reports/season', [ReportController::class, 'season'])->name('reports.season');

// --- Admin only ------------------------------------------------------------
Route::get('/players', [PlayerController::class, 'index'])->middleware('admin:get_players,players')->name('players.index');
Route::post('/players/status', [PlayerController::class, 'updateStatus'])->middleware('admin:update_player_status,players')->name('players.status');

Route::post('/seasons', [SeasonController::class, 'store'])->middleware('admin:add_season,seasons')->name('seasons.store');

Route::get('/matches', [MatchController::class, 'index'])->middleware('admin:get_matches,matches')->name('matches.index');
Route::post('/matches/fixtures', [MatchController::class, 'createFixtures'])->middleware('admin:create_fixture,matches')->name('matches.fixtures');
Route::post('/matches/result', [MatchController::class, 'recordResult'])->middleware('admin:record_result,matches')->name('matches.result');
Route::post('/matches/reschedule', [MatchController::class, 'reschedule'])->middleware('admin:reschedule_match,matches')->name('matches.reschedule');

Route::get('/systemlogs', [SystemLogController::class, 'index'])->middleware('admin:view_logs,system_logs')->name('systemlogs.index');
