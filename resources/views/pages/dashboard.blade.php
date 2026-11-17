@extends('layouts.app')

@section('title', 'EAFC League - Admin Dashboard')
@section('body_class', 'bg-gray-50')

@section('footer')@endsection

@section('header')
<header class="header">
        <div class="container">
            <div class="flex items-center justify-between py-4">
                <div class="flex items-center gap-4">
                    <a href="{{ route('home') }}" class="logo">EAFC League</a>
                    <span class="text-gray-400">|</span>
                    <span class="text-lg font-semibold">Admin Dashboard</span>
                </div>
                
                <div class="flex items-center gap-4">
                    <span class="text-sm text-gray-300">Welcome, <span id="adminUsername">Admin</span></span>
                    <button id="logoutBtn" class="btn btn-danger btn-sm">
                        <span>Logout</span>
                    </button>
                </div>
            </div>
        </div>
    </header>
@endsection

@section('content')
<main class="dashboard-shell">
        <div id="alerts" class="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md px-4"></div>
        
        <aside class="dashboard-sidebar text-white">
            <nav class="flex flex-col gap-1">
                <button class="nav-tab active" data-section="overview">
                    <span class="text-2xl">🏠</span>
                    <span>Overview</span>
                </button>
                <button class="nav-tab" data-section="players">
                    <span class="text-2xl">👥</span>
                    <span>Players</span>
                </button>
                <button class="nav-tab" data-section="seasons">
                    <span class="text-2xl">📅</span>
                    <span>Seasons</span>
                </button>
                <button class="nav-tab" data-section="matches">
                    <span class="text-2xl">⚽</span>
                    <span>Matches</span>
                </button>
                <button class="nav-tab" data-section="logs">
                    <span class="text-2xl">📜</span>
                    <span>Logs</span>
                </button>
            </nav>
        </aside>

        <div class="dashboard-content">
            <div id="overview" class="section">
                <div class="mb-6">
                    <h2 class="text-2xl font-bold text-black mb-2">Dashboard Overview</h2>
                    <p class="text-gray-600">Quick stats on the league and players</p>
                </div>
                <div id="overviewContent" class="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div class="card text-center py-8">
                        <div class="spinner mx-auto mb-4"></div>
                        <p class="text-gray-600">Loading overview...</p>
                    </div>
                </div>
            </div>

            <div id="players" class="section hidden">
                <div class="mb-6">
                    <h2 class="text-2xl font-bold text-black mb-2">Player Management</h2>
                    <p class="text-gray-600">View and manage player registrations</p>
                </div>
                <div id="playersContent">
                    <div class="text-center py-8">
                        <div class="spinner mx-auto mb-4"></div>
                        <p class="text-gray-600">Loading players...</p>
                    </div>
                </div>
            </div>

            <div id="seasons" class="section hidden">
                <div class="mb-6">
                    <h2 class="text-2xl font-bold text-black mb-2">Season Management</h2>
                    <p class="text-gray-600">Create and manage league seasons</p>
                </div>
                <div id="seasonsContent">
                    <div class="text-center py-8">
                        <div class="spinner mx-auto mb-4"></div>
                        <p class="text-gray-600">Loading seasons...</p>
                    </div>
                </div>
            </div>

            <div id="matches" class="section hidden">
                <div class="mb-6">
                    <h2 class="text-2xl font-bold text-black mb-2">Match Management</h2>
                    <p class="text-gray-600">Schedule fixtures and record results</p>
                </div>
                <div id="matchesContent">
                    <div class="text-center py-8">
                        <div class="spinner mx-auto mb-4"></div>
                        <p class="text-gray-600">Loading matches...</p>
                    </div>
                </div>
            </div>

            <div id="logs" class="section hidden">
                <div class="mb-6">
                    <h2 class="text-2xl font-bold text-black mb-2">System Logs</h2>
                    <p class="text-gray-600">View system activity and audit trail</p>
                </div>
                <div id="logsContent">
                    <div class="text-center py-8">
                        <div class="spinner mx-auto mb-4"></div>
                        <p class="text-gray-600">Loading logs...</p>
                    </div>
                </div>
            </div>
        </div>
    </main>
@endsection

@push('scripts')
<script src="{{ asset('js/players.js') }}"></script>
<script src="{{ asset('js/seasons.js') }}"></script>
<script src="{{ asset('js/matches.js') }}"></script>
<script src="{{ asset('js/logs.js') }}"></script>
<script src="{{ asset('js/dashboard.js') }}"></script>
@endpush
