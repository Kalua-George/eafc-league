<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\SystemLogger;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

/**
 * Base class for the JSON API. Every response keeps the original
 * {"success": bool, ...} contract the frontend scripts rely on.
 */
abstract class ApiController extends Controller
{
    public function __construct(protected SystemLogger $logger)
    {
    }

    protected function ok(array $payload = [], int $status = 200): JsonResponse
    {
        return response()->json(['success' => true] + $payload, $status);
    }

    protected function fail(string $error, int $status): JsonResponse
    {
        return response()->json(['success' => false, 'error' => $error], $status);
    }

    protected function isAdmin(): bool
    {
        return Auth::guard('admin')->check();
    }

    protected function log(string $action, string $table, ?string $details = null, ?int $targetId = null, string $status = 'success'): void
    {
        $this->logger->log($action, $table, $details, $targetId, $status);
    }

    /**
     * Validates the request body/query. On failure the failed attempt is written to the
     * audit log and a 400 JSON response is returned immediately.
     */
    protected function validated(
        Request $request,
        array $rules,
        string $action,
        string $table,
        ?string $message = null,
        ?int $targetId = null,
    ): array {
        $validator = Validator::make($request->all(), $rules);

        if ($validator->fails()) {
            $error = $message ?? $validator->errors()->first();
            $this->log($action, $table, $error, $targetId, 'failed');

            throw new HttpResponseException($this->fail($error, 400));
        }

        return $validator->validated();
    }
}
