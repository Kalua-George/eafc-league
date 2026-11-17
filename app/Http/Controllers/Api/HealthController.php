<?php

namespace App\Http\Controllers\Api;

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Throwable;

class HealthController extends ApiController
{
    public function check(): JsonResponse
    {
        try {
            DB::select('SELECT 1');

            return $this->ok([
                'message' => 'Backend connection successful',
                'database' => 'connected',
                'timestamp' => now()->toAtomString(),
            ]);
        } catch (Throwable $e) {
            report($e);

            return $this->fail('Backend connection test failed', 500);
        }
    }
}
