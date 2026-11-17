<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>@yield('title', 'EAFC League')</title>
    <link rel="stylesheet" href="{{ asset('css/main.css') }}">
</head>
<body class="@yield('body_class')">

    @hasSection('header')
        @yield('header')
    @else
        @include('partials.header')
    @endif

    @yield('content')

    @hasSection('footer')
        @yield('footer')
    @else
        @include('partials.footer')
    @endif

    @php
        $currentAdmin = auth('admin')->user();
        $eafcConfig = [
            'apiBase' => url('/api'),
            'routes' => [
                'home' => route('home'),
                'login' => route('login'),
                'dashboard' => route('dashboard'),
            ],
            'admin' => $currentAdmin ? ['id' => $currentAdmin->id, 'username' => $currentAdmin->username] : null,
        ];
    @endphp
    {{-- Runtime configuration consumed by js/utils.js --}}
    <script>window.EAFC_CONFIG = @json($eafcConfig)</script>
    <script src="{{ asset('js/utils.js') }}"></script>
    @stack('scripts')
</body>
</html>
