<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SystemLog extends Model
{
    public const UPDATED_AT = null;

    protected $fillable = ['admin_id', 'action', 'target_table', 'target_id', 'status', 'details'];

    public function admin(): BelongsTo
    {
        return $this->belongsTo(Admin::class);
    }
}
