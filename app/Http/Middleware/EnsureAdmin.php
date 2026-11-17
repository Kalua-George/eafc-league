<?php

namespace App\Http\Middleware;

use App\Services\SystemLogger;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

/**
 * Guards admin-only JSON endpoints.
 *
 * Usage: ->middleware('admin:get_players,players') -- the optional parameters are the
 * action and target table recorded in the audit log when an anonymous caller is rejected.
 */
class EnsureAdmin
{
    public function __construct(private SystemLogger $logger)
    {
    }

    public function handle(Request $request, Closure $next, string $action = 'unauthorized', string $table = 'admins'): Response
    {
        if (Auth::guard('admin')->check()) {
            return $next($request);
        }

        $this->logger->log($action, $table, 'Unauthorized: admin login required', null, 'failed');

        return response()->json(['success' => false, 'error' => 'Unauthorized'], 401);
    }
}
