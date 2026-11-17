<?php

namespace App\Services;

use App\Models\SystemLog;
use Illuminate\Support\Facades\Auth;
use Throwable;

/**
 * Writes the audit trail shown on the admin "System Logs" page.
 */
class SystemLogger
{
    public function log(
        string $action,
        string $targetTable,
        ?string $details = null,
        ?int $targetId = null,
        string $status = 'success',
    ): void {
        try {
            SystemLog::create([
                'admin_id' => Auth::guard('admin')->id(),
                'action' => $action,
                'target_table' => $targetTable,
                'target_id' => $targetId,
                'status' => $status,
                'details' => $details,
            ]);
        } catch (Throwable $e) {
            // An audit-log failure must never break the request that triggered it.
            report($e);
        }
    }
}
