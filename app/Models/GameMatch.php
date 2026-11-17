<?php

namespace App\Models;

use App\Enums\MatchStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * "Match" is a reserved word in PHP 8, so the model is GameMatch (table: matches).
 */
class GameMatch extends Model
{
    protected $table = 'matches';

    protected $fillable = [
        'season_id',
        'home_player_id',
        'away_player_id',
        'scheduled_date',
        'home_goals',
        'away_goals',
        'status',
        'played_at',
    ];

    protected function casts(): array
    {
        return [
            'scheduled_date' => 'datetime',
            'played_at' => 'datetime',
            'home_goals' => 'integer',
            'away_goals' => 'integer',
            'status' => MatchStatus::class,
        ];
    }

    public function season(): BelongsTo
    {
        return $this->belongsTo(Season::class);
    }

    public function homePlayer(): BelongsTo
    {
        return $this->belongsTo(Player::class, 'home_player_id');
    }

    public function awayPlayer(): BelongsTo
    {
        return $this->belongsTo(Player::class, 'away_player_id');
    }

    public function isPlayed(): bool
    {
        return $this->home_goals !== null && $this->away_goals !== null;
    }
}
