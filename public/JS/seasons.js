async function loadCurrentSeason() {
    const seasonNameEl = document.getElementById('season-name');
    const seasonStatusEl = document.getElementById('season-status');
    const registerBtn = document.getElementById('register-btn');

    try {
        const res = await fetch('/api/seasons/get_seasons.php');
        const seasons = await res.json();
        if(seasons.error || seasons.length === 0) {
            seasonNameEl.textContent = 'N/A';
            seasonStatusEl.textContent = 'No active season';
            registerBtn.style.display = 'none';
            return;
        }

        // Assuming the latest season is the current one
        const currentSeason = seasons[seasons.length - 1];
        seasonNameEl.textContent = currentSeason.name;

        const today = new Date();
        const startDate = new Date(currentSeason.start_date);

        // Close registration 2 days before season start
        const registrationCloseDate = new Date(startDate);
        registrationCloseDate.setDate(startDate.getDate() - 2);

        if(today <= registrationCloseDate) {
            seasonStatusEl.textContent = 'Registration Open';
            registerBtn.style.display = 'inline-block';
        } else if(today < startDate) {
            seasonStatusEl.textContent = 'Registration Closed';
            registerBtn.style.display = 'none';
        } else {
            seasonStatusEl.textContent = 'Season In Progress';
            registerBtn.style.display = 'none';
        }

    } catch(err) {
        seasonNameEl.textContent = 'Error';
        seasonStatusEl.textContent = 'Could not load season';
        registerBtn.style.display = 'none';
        console.error(err);
    }
}

// Run this when the page loads
document.addEventListener('DOMContentLoaded', loadCurrentSeason);
