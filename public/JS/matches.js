// ===== Matches Section Logic =====
async function loadMatches() {
    const matchesContent = document.getElementById("matchesContent");
    matchesContent.innerHTML = "Loading matches...";

    try {
        const res = await fetch("/api/matches.php");
        const matches = await res.json();

        let html = `
            <h3>Create Fixture</h3>
            <form id="createMatchForm">
                <input type="text" name="season_id" placeholder="Season ID" required>
                <input type="text" name="home_team" placeholder="Home Team ID" required>
                <input type="text" name="away_team" placeholder="Away Team ID" required>
                <input type="date" name="match_date" required>
                <button type="submit">Create</button>
            </form>

            <h3>Fixtures</h3>
            <ul>
        `;

        matches.forEach(m => {
            html += `
                <li>
                    ${m.home_team} vs ${m.away_team} 
                    on ${m.match_date}
                    ${m.result ? `<strong>Result: ${m.result}</strong>` : ""}
                    <button onclick="showRecordResultForm(${m.id})">Record Result</button>
                    <button onclick="showRescheduleForm(${m.id})">Reschedule</button>
                </li>
            `;
        });

        html += "</ul>";

        // Hidden forms
        html += `
            <div id="recordResultForm" style="display:none;">
                <h3>Record Result</h3>
                <form onsubmit="submitResult(event)">
                    <input type="hidden" id="matchIdResult" name="match_id">
                    <input type="text" name="result" placeholder="e.g. 2-1" required>
                    <button type="submit">Save</button>
                </form>
            </div>

            <div id="rescheduleForm" style="display:none;">
                <h3>Reschedule Match</h3>
                <form onsubmit="submitReschedule(event)">
                    <input type="hidden" id="matchIdReschedule" name="match_id">
                    <input type="date" name="new_date" required>
                    <button type="submit">Update</button>
                </form>
            </div>
        `;

        matchesContent.innerHTML = html;

        // Attach event for creating match
        document.getElementById("createMatchForm").addEventListener("submit", async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            await fetch("/api/matches.php", {
                method: "POST",
                body: formData
            });
            loadMatches();
        });

    } catch (err) {
        matchesContent.innerHTML = "Error loading matches.";
        console.error(err);
    }
}

// Show result form
function showRecordResultForm(matchId) {
    document.getElementById("recordResultForm").style.display = "block";
    document.getElementById("matchIdResult").value = matchId;
}

// Submit result
async function submitResult(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    await fetch("/api/matches.php?action=result", {
        method: "POST",
        body: formData
    });
    loadMatches();
}

// Show reschedule form
function showRescheduleForm(matchId) {
    document.getElementById("rescheduleForm").style.display = "block";
    document.getElementById("matchIdReschedule").value = matchId;
}

// Submit reschedule
async function submitReschedule(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    await fetch("/api/matches.php?action=reschedule", {
        method: "POST",
        body: formData
    });
    loadMatches();
}
