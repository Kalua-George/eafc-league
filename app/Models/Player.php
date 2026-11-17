<?php

namespace App\Models;

use App\Enums\PlayerStatus;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Player extends Model
{
    protected $fillable = ['gamer_tag', 'phone', 'status'];

    protected function casts(): array
    {
        return [
            'status' => PlayerStatus::class,
        ];
    }

    public function homeMatches(): HasMany
    {
        return $this->hasMany(GameMatch::class, 'home_player_id');
    }

    public function awayMatches(): HasMany
    {
        return $this->hasMany(GameMatch::class, 'away_player_id');
    }

    public function scopeApproved(Builder $query): Builder
    {
        return $query->where('status', PlayerStatus::Approved->value);
    }
}
