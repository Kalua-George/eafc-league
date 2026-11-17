@extends('layouts.app')

@section('title', 'EAFC League - Admin Login')
@section('body_class', 'bg-gray-50')

@section('footer')@endsection

@section('content')
<main class="min-h-screen flex items-center justify-center py-16">
         
        <div id="alerts" class="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md px-4"></div>

        <div class="w-full max-w-md">
            
            <div class="card">
                <div class="card-header text-center">
                    <div class="w-16 h-16 bg-black rounded-full flex items-center justify-center mx-auto mb-4">
                        <span class="text-white text-2xl font-bold">🔐</span>
                    </div>
                    <h1 class="text-2xl font-bold text-black mb-2">Admin Login</h1>
                    <p class="text-gray-600">Sign in to access the admin dashboard</p>
                </div>

                <div class="card-body">
                    <form id="loginForm">
                        <div class="form-group">
                            <label for="username" class="form-label">Username</label>
                            <input 
                                type="text" 
                                id="username" 
                                name="username" 
                                class="form-input" 
                                required
                                placeholder="Enter your username"
                                autocomplete="username"
                            >
                        </div>

                        <div class="form-group">
                            <label for="password" class="form-label">Password</label>
                            <div class="relative">
                                <input 
                                    type="password" 
                                    id="password" 
                                    name="password" 
                                    class="form-input pr-12" 
                                    required
                                    placeholder="Enter your password"
                                    autocomplete="current-password"
                                >
                                <button 
                                    type="button" 
                                    id="togglePassword" 
                                    class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                >
                                    <span id="eyeIcon">👁️</span>
                                </button>
                            </div>
                        </div>

                        <div class="form-group mb-6">
                            <div class="alert alert-warning">
                                <div class="flex items-start gap-2">
                                    <span class="text-red text-sm">⚠️</span>
                                    <div class="text-sm">
                                        <p class="font-medium text-red mb-1">Admin Access Only</p>
                                        <p class="text-gray-600">This area is restricted to authorized administrators only. Unauthorized access attempts are logged.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button 
                            type="submit" 
                            id="loginBtn" 
                            class="btn btn-primary w-full"
                        >
                            <span id="loginText">Sign In</span>
                            <div id="loginSpinner" class="spinner hidden"></div>
                        </button>
                    </form>
                </div>

                <div class="card-footer text-center"></div>
            </div>

            
            <div id="successMessage" class="card mt-6 hidden">
                <div class="card-body text-center">
                    <div class="w-16 h-16 bg-green rounded-full flex items-center justify-center mx-auto mb-4">
                        <span class="text-white text-2xl">✓</span>
                    </div>
                    <h3 class="text-lg font-semibold text-green mb-2">Login Successful!</h3>
                    <p class="text-gray-600 mb-4">Redirecting to admin dashboard...</p>
                    <div class="spinner mx-auto"></div>
                </div>
            </div>

             
            <div class="text-center mt-8">
                <a href="{{ route('home') }}" class="text-gray-600 hover:text-black transition">
                    ← Back to Homepage
                </a>
            </div>
        </div>
    </main>
@endsection

@push('scripts')
<script src="{{ asset('js/login.js') }}"></script>
@endpush
