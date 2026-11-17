<?php

namespace App\Http\Controllers\Api;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AdminAuthController extends ApiController
{
    public function login(Request $request): JsonResponse
    {
        $credentials = $this->validated(
            $request,
            ['username' => ['required', 'string'], 'password' => ['required', 'string']],
            'login',
            'admins',
            'Username and password required',
        );

        $guard = Auth::guard('admin');

        if (! $guard->attempt($credentials)) {
            $this->log('login', 'admins', "Invalid username: {$credentials['username']}", null, 'failed');

            return $this->fail('Invalid credentials', 401);
        }

        $request->session()->regenerate();

        $admin = $guard->user();
        $this->log('login', 'admins', 'Admin logged in', $admin->id);

        return $this->ok([
            'message' => 'Logged in successfully',
            'admin_id' => $admin->id,
            'username' => $admin->username,
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $guard = Auth::guard('admin');
        $adminId = $guard->id();

        $this->log('logout', 'admins', 'Admin logged out', $adminId);

        $guard->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return $this->ok(['message' => 'Logged out successfully']);
    }
}
