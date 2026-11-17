<?php

namespace App\Http\Controllers\Api;

use App\Models\SystemLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SystemLogController extends ApiController
{
    public function index(Request $request): JsonResponse
    {
        $page = max(1, (int) $request->query('page', 1));
        $limit = min(200, max(1, (int) $request->query('limit', 50)));

        $total = SystemLog::count();

        $logs = SystemLog::orderByDesc('created_at')
            ->orderByDesc('id')
            ->forPage($page, $limit)
            ->get()
            ->map(fn (SystemLog $l) => [
                'id' => $l->id,
                'admin_id' => $l->admin_id,
                'action' => $l->action,
                'target_table' => $l->target_table,
                'target_id' => $l->target_id,
                'status' => $l->status,
                'details' => $l->details,
                'created_at' => $l->created_at?->toIso8601String(),
            ])
            ->all();

        $this->log('view_logs', 'system_logs', 'Viewed system logs');

        return $this->ok([
            'page' => $page,
            'limit' => $limit,
            'total_records' => $total,
            'total_pages' => (int) ceil($total / $limit),
            'logs' => $logs,
        ]);
    }
}
