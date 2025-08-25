// players.js

async function loadPlayers() {
    const tbody = document.getElementById('playersContent');
    tbody.innerHTML = '<tr><td colspan="5">Loading players...</td></tr>';

    try {
        const res = await fetch('/api/players/get_players.php');
        const players = await res.json();

        if(players.error) {
            tbody.innerHTML = `<tr><td colspan="5">${players.error}</td></tr>`;
            return;
        }

        tbody.innerHTML = players.map(p => `
            <tr>
                <td>${p.id}</td>
                <td>${p.gamer_tag}</td>
                <td>${p.phone}</td>
                <td>${p.status}</td>
                <td>
                    <button onclick="editPlayer(${p.id})">Edit</button>
                    ${p.status === 'pending' ? `
                        <button onclick="updateStatus(${p.id}, 'approve')">Approve</button>
                        <button onclick="updateStatus(${p.id}, 'reject')">Reject</button>
                    ` : ''}
                </td>
            </tr>
        `).join('');

    } catch(err) {
        tbody.innerHTML = `<tr><td colspan="5">Failed to load players</td></tr>`;
        console.error(err);
    }
}

// Approve / Reject function
async function updateStatus(playerId, action) {
    if(!confirm(`Are you sure you want to ${action} this player?`)) return;

    try {
        const res = await fetch('/api/players/approve_reject.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ player_id: playerId, action })
        });
        const data = await res.json();
        if(data.success) {
            alert(data.message);
            loadPlayers(); // refresh table
        } else {
            alert(data.error || 'Action failed');
        }
    } catch(err) {
        alert('Failed to perform action');
        console.error(err);
    }
}

// Placeholder for edit
function editPlayer(playerId) {
    alert(`Edit player ${playerId} - implement edit form here`);
}

// Load players when section is opened
document.querySelector('button[data-section="players"]').addEventListener('click', loadPlayers);
