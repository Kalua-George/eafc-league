<header class="header">
    <div class="container">
        <div class="header-content">
            <a href="{{ route('home') }}" class="logo">EAFC League</a>
            <nav class="nav">
                <a href="{{ route('home') }}" class="nav-link">Home</a>
                <a href="{{ route('registration') }}" class="nav-link">Register</a>
                <a href="{{ route('lookup') }}" class="nav-link">Player Status</a>
                @unless (request()->routeIs('login'))
                    <a href="{{ route('login') }}" class="nav-link">Admin Login</a>
                @endunless
            </nav>
        </div>
    </div>
</header>
