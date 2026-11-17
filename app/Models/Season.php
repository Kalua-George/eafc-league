<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Season extends Model
{
    protected $fillable = ['name', 'start_date', 'end_date'];

    protected function casts(): array
    {
        return [
            'start_date' => 'date:Y-m-d',
            'end_date' => 'date:Y-m-d',
        ];
    }

    public function matches(): HasMany
    {
        return $this->hasMany(GameMatch::class);
    }

    /**
     * "pending" before the start date, "current" between start and end (inclusive), "ended" after.
     */
    public function status(): string
    {
        $today = now()->startOfDay();

        if ($today->lt($this->start_date->copy()->startOfDay())) {
            return 'pending';
        }

        if ($today->gt($this->end_date->copy()->startOfDay())) {
            return 'ended';
        }

        return 'current';
    }

    /**
     * Shape returned by the API: id, name, start_date, end_date, status.
     */
    public function toApiArray(): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'start_date' => $this->start_date->toDateString(),
            'end_date' => $this->end_date->toDateString(),
            'status' => $this->status(),
        ];
    }
}
