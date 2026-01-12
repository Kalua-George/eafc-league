# EAFC League Management System

A modern, responsive web application for managing EA Sports FC league competitions.

## Setup Instructions

### 1. Backend Requirements
- PHP 7.4 or higher
- MySQL/MariaDB database
- Web server (Apache/Nginx)

### 2. API Configuration
The frontend expects your PHP API endpoints to be available at `/api/` relative to your domain.

**Expected API Structure:**
\`\`\`
/api/
├── players/
│   ├── add_player.php
│   ├── get_players.php
│   ├── get_player.php
│   ├── edit_player.php
│   └── approve_reject_player.php
├── seasons/
│   ├── get_seasons.php
│   ├── add_season.php
│   └── edit_season.php
├── matches/
│   ├── matches.php
│   ├── create_fixture.php
│   ├── record_results.php
│   ├── reschedule.php
│   └── standings.php
├── admin/
│   ├── login.php
│   └── logout.php
└── systemlogs/
    └── getlogs.php
\`\`\`

### 3. Frontend Setup
1. Place all files in your web server's document root
2. Ensure your PHP backend is running and accessible
3. Update the API_BASE_URL in `js/utils.js` if your API is at a different path

### 4. Troubleshooting

**"API endpoint not found" errors:**
- Check that your PHP server is running
- Verify API endpoints exist and return JSON
- Check browser console for specific error messages

**"Backend Not Available" messages:**
- Ensure your PHP API endpoints are accessible
- Check that endpoints return proper JSON responses
- Verify CORS settings if frontend and backend are on different domains

### 5. File Structure
\`\`\`
/
├── index.html              # Public homepage
├── registration.html       # Player registration
├── lookup.html            # Player status lookup
├── login.html             # Admin login
├── dashboard.html         # Admin dashboard
├── styles/
│   └── main.css          # Main stylesheet
└── js/
    ├── utils.js          # Utility functions
    ├── homepage.js       # Homepage functionality
    ├── registration.js   # Registration form
    ├── lookup.js         # Player lookup
    ├── login.js          # Admin login
    ├── dashboard.js      # Dashboard navigation
    ├── players.js        # Player management
    ├── seasons.js        # Season management
    ├── matches.js        # Match management
    └── logs.js           # System logs
\`\`\`

### 6. Features
- **Public Pages:** Homepage with standings, player registration, status lookup
- **Admin Dashboard:** Player management, season management, match scheduling, system logs
- **Responsive Design:** Works on desktop, tablet, and mobile devices
- **Modern UI:** Clean, professional interface with proper loading states and error handling

### 7. Color Scheme
- Primary Green: #31A901
- Primary Blue: #1403CB  
- Primary Red: #CB0303
- Black: #000000
- Various gray shades for backgrounds and text
