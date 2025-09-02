// ===== Matches Section Logic =====
async function loadMatches() {
    const matchesContent = document.getElementById("matchesContent");
    matchesContent.innerHTML = "Loading matches...";

    try {
        const res = await fetch("../api/matches/matches.php");
        const matches = await res.json();
        
        // This helper function creates and returns the matches HTML.
        function generateMatchesHtml(data) {
            let html = `
                <h3>Create Fixture</h3>
                <form id="createFixtureForm">
                    <input type="text" id="fixture-season-id" name="season_id" placeholder="Season ID" required>
                    <input type="number" id="fixture-games-per-pair" name="max_games_per_pair" placeholder="Games Per Pair" value="1" required>
                    <button type="submit">Create</button>
                    <div id="createFixtureMessage"></div>
                </form>

                <h3>Fixtures</h3>
            `;
            
            if (data.length === 0) {
                html += "<p>No fixtures found. Please create one above.</p>";
            } else {
                html += "<ul>";
                data.forEach(m => {
                    // Note: match_date is now used from the PHP response for frontend consistency
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
            }
            
            // Add the hidden forms to the end of the HTML string
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
            
            return html;
        }

        // Set the HTML first to ensure all elements are in the DOM
        matchesContent.innerHTML = generateMatchesHtml(matches);

        // Then, and only then, attach event listeners to the new elements
        document.getElementById("createFixtureForm").addEventListener("submit", async (e) => {
            e.preventDefault();
            const messageDiv = document.getElementById("createFixtureMessage");

            const season_id = document.getElementById("fixture-season-id").value.trim();
            const max_games_per_pair = document.getElementById("fixture-games-per-pair").value.trim();

            if (!season_id) {
                messageDiv.style.color = "red";
                messageDiv.textContent = "Season ID is required.";
                return;
            }
            if (max_games_per_pair < 1) {
                messageDiv.style.color = "red";
                messageDiv.textContent = "Games per pair must be 1 or more.";
                return;
            }

            try {
                const res = await fetch("../api/matches/create_fixture.php", {
                    method: "POST",
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ season_id: parseInt(season_id), max_games_per_pair: parseInt(max_games_per_pair) })
                });

                const data = await res.json();
                if (data.success) {
                    messageDiv.style.color = "green";
                    messageDiv.textContent = data.message;
                    loadMatches(); // Reload matches to show the new fixture
                } else {
                    messageDiv.style.color = "red";
                    messageDiv.textContent = data.error || "Failed to create fixture.";
                }
            } catch (err) {
                console.error(err);
                messageDiv.style.color = "red";
                messageDiv.textContent = "An error occurred while creating the fixture.";
            }
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

// Attach the loadMatches function to the Matches navigation button
document.querySelector('button[data-section="matches"]').addEventListener('click', loadMatches);
