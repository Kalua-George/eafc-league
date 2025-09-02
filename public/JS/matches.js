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
                <div class="space-y-6 p-4">
                    <div class="bg-white p-6 rounded-lg shadow-md">
                        <h3 class="text-xl font-semibold mb-4">Create Fixture</h3>
                        <form id="createFixtureForm" class="space-y-4">
                            <input type="number" id="fixture-season-id" name="season_id" placeholder="Season ID" class="w-full p-2 border border-gray-300 rounded-md" required>
                            <input type="number" id="fixture-games-per-pair" name="games_per_pair" placeholder="Games Per Pair" value="1" min="1" class="w-full p-2 border border-gray-300 rounded-md" required>
                            <input type="date" id="fixture-start-date" name="start_date" class="w-full p-2 border border-gray-300 rounded-md" required>
                            <input type="number" id="fixture-games-per-day" name="games_per_day" placeholder="Games Per Day" value="2" min="1" class="w-full p-2 border border-gray-300 rounded-md" required>
                            <button type="submit" class="w-full p-2 bg-blue-500 text-white font-bold rounded-md hover:bg-blue-600 transition-colors">Create</button>
                            <div id="createFixtureMessage" class="text-center mt-2"></div>
                        </form>
                    </div>

                    <div class="bg-white p-6 rounded-lg shadow-md">
                        <h3 class="text-xl font-semibold mb-4">Fixtures</h3>
                        ${data.length === 0 ? `
                            <p class="text-gray-500 text-center">No fixtures found. Please create one above.</p>
                        ` : `
                            <ul class="space-y-4">
                                ${data.map(m => `
                                    <li class="border-b pb-4 last:border-b-0">
                                        <div class="flex flex-col md:flex-row justify-between items-center mb-2">
                                            <span class="font-bold">${m.home_team} vs ${m.away_team}</span>
                                            <span class="text-sm text-gray-500">on ${m.match_date}</span>
                                        </div>
                                        ${m.status === 'completed' ? `
                                            <div class="text-center font-bold text-lg text-green-600">
                                                Result: ${m.home_goals} - ${m.away_goals}
                                            </div>
                                        ` : `
                                            <div class="space-y-2">
                                                <form onsubmit="submitResult(event)" class="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-2">
                                                    <input type="hidden" name="match_id" value="${m.id}">
                                                    <input type="number" name="home_goals" placeholder="${m.home_team} goals" class="w-full p-2 border border-gray-300 rounded-md" required>
                                                    <span class="font-bold">-</span>
                                                    <input type="number" name="away_goals" placeholder="${m.away_team} goals" class="w-full p-2 border border-gray-300 rounded-md" required>
                                                    <button type="submit" class="w-full p-2 bg-green-500 text-white font-bold rounded-md hover:bg-green-600 transition-colors">Record Result</button>
                                                </form>
                                                <form onsubmit="submitReschedule(event)" class="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-2">
                                                    <input type="hidden" name="match_id" value="${m.id}">
                                                    <input type="date" name="new_date" class="w-full p-2 border border-gray-300 rounded-md" required>
                                                    <button type="submit" class="w-full p-2 bg-yellow-500 text-white font-bold rounded-md hover:bg-yellow-600 transition-colors">Reschedule</button>
                                                </form>
                                            </div>
                                        `}
                                    </li>
                                `).join('')}
                            </ul>
                        `}
                    </div>
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
            messageDiv.textContent = "Creating fixtures...";
            messageDiv.style.color = "blue";

            const formData = new FormData(e.target);

            try {
                const res = await fetch("../api/matches/create_fixture.php", {
                    method: "POST",
                    body: formData
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

// Submit result
async function submitResult(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    await fetch("../api/matches/record_results.php", {
        method: "POST",
        body: formData
    });
    loadMatches();
}

// Submit reschedule
async function submitReschedule(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    await fetch("../api/matches/reschedule.php", {
        method: "POST",
        body: formData
    });
    loadMatches();
}

// Attach the loadMatches function to the Matches navigation button
document.querySelector('button[data-section="matches"]').addEventListener('click', loadMatches);
