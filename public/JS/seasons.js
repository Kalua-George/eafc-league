// Load current season (for display)
async function loadCurrentSeason() {
    const seasonNameEl = document.getElementById('season-name');
    const seasonStatusEl = document.getElementById('season-status');
    const registerBtn = document.getElementById('register-btn');

    try {
        const res = await fetch('../api/seasons/get_seasons.php');
        const data = await res.json();

        if (!data.success || !data.seasons || data.seasons.length === 0) {
            seasonNameEl.textContent = 'N/A';
            seasonStatusEl.textContent = 'No active season';
            registerBtn.style.display = 'none';
            return;
        }

        const currentSeason = data.seasons[0]; // The API returns seasons ordered by date DESC, so the latest is the first one
        seasonNameEl.textContent = currentSeason.name;

        const today = new Date();
        const startDate = new Date(currentSeason.start_date);

        // Close registration 2 days before season start
        const registrationCloseDate = new Date(startDate);
        registrationCloseDate.setDate(startDate.getDate() - 2);

        if (today <= registrationCloseDate) {
            seasonStatusEl.textContent = 'Registration Open';
            registerBtn.style.display = 'inline-block';
        } else if (today < startDate) {
            seasonStatusEl.textContent = 'Registration Closed';
            registerBtn.style.display = 'none';
        } else {
            seasonStatusEl.textContent = 'Season In Progress';
            registerBtn.style.display = 'none';
        }

    } catch (err) {
        console.error(err);
        seasonNameEl.textContent = 'Error';
        seasonStatusEl.textContent = 'Could not load season';
        registerBtn.style.display = 'none';
    }
}

// Load all seasons into the table
async function loadSeasons() {
    const container = document.getElementById('seasonsContent');
    container.innerHTML = 'Loading seasons...';

    try {
        const res = await fetch('../api/seasons/get_seasons.php');
        const data = await res.json();

        if (!data.success || !data.seasons || data.seasons.length === 0) {
            container.innerHTML = 'No seasons found';
            return;
        }

        // The API returns seasons ordered by date DESC, so the latest is the first one
        const currentSeasonId = data.seasons[0].id;

        let html = `<table border="1" cellspacing="0" cellpadding="5">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Season Name</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>`;

        data.seasons.forEach(season => {
            html += `<tr id="season-${season.id}">
                <td>${season.id}</td>
                <td>${season.name}</td>
                <td>${season.start_date}</td>
                <td>${season.end_date}</td>
                <td>`;

            if (season.id === currentSeasonId) {
                html += `<button onclick="editSeason(${season.id})">Edit</button>`;
            } else {
                html += `<button onclick="viewSeasonRanking(${season.id})">View Rankings</button>`;
            }

            html += `</td></tr>`;
        });

        html += '</tbody></table>';
        container.innerHTML = html;

    } catch (err) {
        console.error(err);
        container.innerHTML = 'Failed to load seasons';
    }
}

// Edit current season (end date only)
function editSeason(seasonId) {
    const seasonRow = document.getElementById(`season-${seasonId}`);
    if (!seasonRow) return;

    const endDate = seasonRow.children[3].textContent; // 0=id,1=name,2=start,3=end

    document.getElementById('editSeasonId').value = seasonId;
    document.getElementById('editSeasonEnd').value = endDate;
    document.getElementById('editSeasonModal').style.display = 'flex';
}

async function saveEditedSeason(e) {
    e.preventDefault();

    const seasonId = document.getElementById('editSeasonId').value;
    const endDate = document.getElementById('editSeasonEnd').value;

    try {
        const res = await fetch('../api/seasons/edit_season.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ season_id: seasonId, end_date: endDate })
        });

        const data = await res.json();
        if (data.success) {
            // Replaced alert with custom modal logic
            alert('Season updated successfully');
            closeEditSeasonModal();
            loadSeasons();
        } else {
            alert(data.error || 'Failed to update season');
        }
    } catch (err) {
        console.error(err);
        alert('Error updating season');
    }
}

function closeEditSeasonModal() {
    document.getElementById('editSeasonModal').style.display = 'none';
}

// View past season rankings
async function viewSeasonRanking(seasonId) {
    if (!document.getElementById('viewSeasonModal')) {
        const modal = document.createElement('div');
        modal.id = 'viewSeasonModal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <span class="modal-close" onclick="closeViewSeasonModal()">&times;</span>
                <h3>Season Rankings</h3>
                <div id="seasonRankingsContent">Loading...</div>
            </div>`;
        document.body.appendChild(modal);
    }

    document.getElementById('viewSeasonModal').style.display = 'flex';
    document.getElementById('seasonRankingsContent').innerHTML = 'Loading...';

    try {
        const res = await fetch(`../api/matches/standings.php?season_id=${seasonId}`);
        const rankings = await res.json();

        if (!rankings || rankings.length === 0) {
            document.getElementById('seasonRankingsContent').innerHTML = 'No rankings found';
            return;
        }

        let html = `<table border="1" cellspacing="0" cellpadding="5">
            <thead>
                <tr>
                    <th>Rank</th>
                    <th>Team</th>
                    <th>Points</th>
                </tr>
            </thead>
            <tbody>`;

        rankings.forEach(r => {
            html += `<tr>
                        <td>${r.rank}</td>
                        <td>${r.team_name}</td>
                        <td>${r.points}</td>
                    </tr>`;
        });

        html += '</tbody></table>';
        document.getElementById('seasonRankingsContent').innerHTML = html;

    } catch (err) {
        console.error(err);
        document.getElementById('seasonRankingsContent').innerHTML = 'Failed to load rankings';
    }
}

function closeViewSeasonModal() {
    document.getElementById('viewSeasonModal').style.display = 'none';
}

// Add new season
const addSeasonForm = document.getElementById('addSeasonForm');
if (addSeasonForm) {
    addSeasonForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const name = document.getElementById('seasonName').value.trim();
        const start_date = document.getElementById('seasonStart').value;
        const end_date = document.getElementById('seasonEnd').value;
        const messageDiv = document.getElementById('addSeasonMessage');

        if (!name || !start_date || !end_date) {
            messageDiv.style.color = 'red';
            messageDiv.textContent = 'All fields are required';
            return;
        }

        try {
            const res = await fetch('../api/seasons/add_season.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, start_date, end_date })
            });

            const data = await res.json();

            if (data.success) {
                messageDiv.style.color = 'green';
                messageDiv.textContent = data.message;
                addSeasonForm.reset();
                loadSeasons();
            } else {
                messageDiv.style.color = 'red';
                messageDiv.textContent = data.error || 'Failed to add season';
            }
        } catch (err) {
            console.error(err);
            messageDiv.style.color = 'red';
            messageDiv.textContent = 'Failed to add season';
        }
    });
}

// Load seasons when the section is opened
document.querySelector('button[data-section="seasons"]').addEventListener('click', loadSeasons);
document.getElementById('editSeasonForm').addEventListener('submit', saveEditedSeason);
