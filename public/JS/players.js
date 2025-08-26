// ============================
// Load players table
// ============================


async function loadPlayers() {
    const container = document.getElementById('playersContent');
    container.innerHTML = 'Loading players...';

    try {
        const res = await fetch('../api/players/get_players.php');
        const text = await res.text();

        let players;
        try { players = JSON.parse(text); }
        catch { container.innerHTML = 'Failed to parse server response'; return; }

        if (players.error) {
            container.innerHTML = players.error;
            return;
        }

        // Build HTML table
        let html = `
            <table border="1" cellspacing="0" cellpadding="5">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Gamer Tag</th>
                        <th>Phone</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${players.map(p => `
                        <tr id="player-${p.id}">
                            <td>${p.id}</td>
                            <td>${p.gamer_tag}</td>
                            <td>${p.phone}</td>
                            <td class="player-status">${p.status}</td>
                            <td class="action-buttons">
                                <button onclick="editPlayer(${p.id})">Edit</button>
                                ${p.status === 'pending' ? `
                                    <button onclick="updateStatus(${p.id}, 'approve')">Approve</button>
                                    <button onclick="updateStatus(${p.id}, 'reject')">Reject</button>
                                ` : ''}
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;

        container.innerHTML = html;

    } catch (err) {
        container.innerHTML = 'Failed to load players';
        console.error('Fetch error:', err);
    }
}

// ============================
// Approve / Reject player
// ============================
async function updateStatus(playerId, action) {
    if (!confirm(`Are you sure you want to ${action} this player?`)) return;

    try {
        const res = await fetch('../api/players/approve_reject_player.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ player_id: playerId, action })
        });

        const text = await res.text();
        let data;
        try { data = JSON.parse(text); } 
        catch { alert('Server returned invalid response'); return; }

        if (data.success) {
            alert(data.message);
            const row = document.getElementById(`player-${playerId}`);
            if (row) {
                row.querySelector('.player-status').textContent = data.status;
                row.querySelector('.action-buttons').innerHTML = `<button onclick="editPlayer(${playerId})">Edit</button>`;
            }
        } else {
            alert(data.error || 'Action failed');
        }

    } catch (err) {
        alert('Failed to perform action');
        console.error('Fetch error:', err);
    }
}

// ============================
// Add new player
// ============================
const addPlayerForm = document.getElementById('addPlayerForm');
if (addPlayerForm) {
    addPlayerForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const gamer_tag = document.getElementById('gamer_tag').value.trim();
        const phone = document.getElementById('phone').value.trim();
        const messageDiv = document.getElementById('addPlayerMessage');

        if (!gamer_tag || !phone) {
            messageDiv.style.color = 'red';
            messageDiv.textContent = 'All fields are required';
            return;
        }

        try {
            const res = await fetch('../api/players/add_player.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ gamer_tag, phone })
            });

            const text = await res.text();
            let data;
            try { data = JSON.parse(text); } 
            catch { messageDiv.style.color='red'; messageDiv.textContent='Server returned invalid response'; return; }

            if (data.success) {
                messageDiv.style.color = 'green';
                messageDiv.textContent = data.message;
                addPlayerForm.reset();
                loadPlayers();
            } else {
                messageDiv.style.color = 'red';
                messageDiv.textContent = data.error || 'Failed to add player';
            }

        } catch (err) {
            messageDiv.style.color = 'red';
            messageDiv.textContent = 'Failed to add player';
            console.error('Fetch error:', err);
        }
    });
}

// ============================
// Edit player modal logic
// ============================
function editPlayer(playerId) {
    const row = document.getElementById(`player-${playerId}`);
    if (!row) return;

    document.getElementById('editPlayerId').value = playerId;
    document.getElementById('editGamerTag').value = row.children[1].textContent;
    document.getElementById('editPhone').value = row.children[2].textContent;
    document.getElementById('editPlayerModal').style.display = 'flex';
}

function closeEditPlayerModal() {
    document.getElementById('editPlayerModal').style.display = 'none';
}

// Edit Player form submit
document.getElementById('editPlayerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const playerId = document.getElementById('editPlayerId').value;
    const gamerTag = document.getElementById('editGamerTag').value.trim();
    const phone = document.getElementById('editPhone').value.trim();

    if (!gamerTag || !phone) { alert('All fields are required'); return; }

    try {
        const res = await fetch('../api/players/edit_player.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ player_id: playerId, gamer_tag: gamerTag, phone })
        });

        const data = await res.json();
        if (data.success) {
            alert(data.message);
            closeEditPlayerModal();
            loadPlayers();
        } else {
            alert(data.error || 'Failed to update player');
        }

    } catch (err) {
        console.error(err);
        alert('Failed to update player');
    }
});

// ============================
// Load players when section is opened
// ============================
document.querySelector('button[data-section="players"]').addEventListener('click', loadPlayers);
