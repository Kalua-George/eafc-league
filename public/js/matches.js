// Match Management System for EAFC League Admin Dashboard

document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("matchesContent")) {
    initMatchManagement()
  }
})

function initMatchManagement() {
  // Setup is handled dynamically.
}

async function loadMatches() {
  const container = document.getElementById("matchesContent")
  if (!container) return

  container.innerHTML = `
    <div class="text-center py-8">
      <div class="spinner mx-auto mb-4"></div>
      <p class="text-gray-600">Loading matches...</p>
    </div>
  `

  try {
    const data = await window.EAFC.apiCall("/matches")

    if (!data.success) {
      throw new Error(data.error || "Failed to load matches")
    }

    renderMatchesInterface(data.matches || [])
  } catch (error) {
    console.error("Failed to load matches:", error)
    container.innerHTML = `
      <div class="card">
        <div class="card-body text-center">
          <div class="text-red mb-4"><span class="text-4xl">⚠️</span></div>
          <h3 class="text-lg font-semibold text-red mb-2">Failed to Load Matches</h3>
          <p class="text-gray-600 mb-4">${escapeHtml(error.message)}</p>
          <button onclick="loadMatches()" class="btn btn-primary">Try Again</button>
        </div>
      </div>
    `
  }
}

function renderMatchesInterface(matches) {
  const container = document.getElementById("matchesContent")

  container.innerHTML = `
    <div class="flex flex-col gap-6">
      <div class="card">
        <div class="card-header">
          <h3 class="text-lg font-semibold">Create Fixtures</h3>
        </div>
        <div class="card-body">
          <form id="createFixtureForm" class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="form-group">
              <label for="fixtureSeasonId" class="form-label">Season ID *</label>
              <input type="number" id="fixtureSeasonId" name="season_id" class="form-input" required min="1" />
            </div>
            <div class="form-group">
              <label for="fixtureGamesPerPair" class="form-label">Games Per Pair *</label>
              <input type="number" id="fixtureGamesPerPair" name="games_per_pair" class="form-input" required min="1" max="10" value="1" />
            </div>
            <div class="form-group">
              <label for="fixtureStartDate" class="form-label">Start Date *</label>
              <input type="date" id="fixtureStartDate" name="start_date" class="form-input" required />
            </div>
            <div class="form-group">
              <label for="fixtureGamesPerDay" class="form-label">Games Per Day *</label>
              <input type="number" id="fixtureGamesPerDay" name="games_per_day" class="form-input" required min="1" max="20" value="2" />
            </div>
            <div class="md:col-span-2">
              <button type="submit" class="btn btn-primary w-full" id="createFixtureBtn">
                <span id="createFixtureText">Create Fixtures</span>
                <div id="createFixtureSpinner" class="spinner hidden"></div>
              </button>
            </div>
          </form>
          <div id="createFixtureMessage" class="mt-4"></div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold">Fixtures & Results (${matches.length})</h3>
            <button onclick="loadMatches()" class="btn btn-outline btn-sm">🔄 Refresh</button>
          </div>
        </div>
        <div class="card-body">
          ${matches.length === 0 ? renderEmptyMatches() : renderMatchesList(matches)}
        </div>
      </div>
    </div>
  `

  setupCreateFixtureForm()

  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  document.getElementById("fixtureStartDate").value = tomorrow.toISOString().split("T")[0]
}

function renderEmptyMatches() {
  return `
    <div class="text-center py-8">
      <div class="text-gray-400 mb-4"><span class="text-4xl">⚽</span></div>
      <h3 class="text-lg font-semibold text-gray-700 mb-2">No Fixtures Found</h3>
      <p class="text-gray-600">Create fixtures above to schedule matches.</p>
    </div>
  `
}

function renderMatchesList(matches) {
  return `
    <div class="space-y-4">
      ${matches
        .map(
          (match) => `
        <div class="border border-gray-200 rounded-lg p-4">
          <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-3">
            <div class="flex-1">
              <h4 class="font-semibold text-lg">${escapeHtml(match.home_team)} vs ${escapeHtml(match.away_team)}</h4>
              <p class="text-sm text-gray-600">Match Date: ${formatDate(match.match_date)}</p>
            </div>
            <div class="mt-2 md:mt-0">${getMatchStatusBadge(match)}</div>
          </div>
          ${match.result ? renderCompletedMatch(match) : renderPendingMatch(match)}
        </div>
      `,
        )
        .join("")}
    </div>
  `
}

function renderCompletedMatch(match) {
  return `
    <div class="bg-green bg-opacity-10 border border-green rounded-md p-4 text-center">
      <div class="text-2xl font-bold text-green mb-2">Final Result: ${escapeHtml(match.result)}</div>
      <p class="text-sm text-gray-600">Match completed</p>
    </div>
  `
}

function renderPendingMatch(match) {
  return `
    <div class="space-y-3">
      <div class="bg-gray-50 rounded-md p-4">
        <h5 class="font-medium mb-3">Record Result</h5>
        <form onsubmit="submitResult(event, ${match.id})" class="flex flex-col md:flex-row items-end gap-3">
          <div class="flex-1">
            <label class="form-label text-sm">${escapeHtml(match.home_team)} Goals</label>
            <input type="number" name="home_goals" class="form-input" required min="0" max="50" placeholder="0" />
          </div>
          <div class="text-2xl font-bold text-gray-400 self-center">-</div>
          <div class="flex-1">
            <label class="form-label text-sm">${escapeHtml(match.away_team)} Goals</label>
            <input type="number" name="away_goals" class="form-input" required min="0" max="50" placeholder="0" />
          </div>
          <button type="submit" class="btn btn-primary">Record Result</button>
        </form>
      </div>

      <div class="bg-gray-50 rounded-md p-4">
        <h5 class="font-medium mb-3">Reschedule Match</h5>
        <form onsubmit="submitReschedule(event, ${match.id})" class="flex flex-col md:flex-row items-end gap-3">
          <div class="flex-1">
            <label class="form-label text-sm">New Date</label>
            <input type="date" name="new_date" class="form-input" required />
          </div>
          <button type="submit" class="btn btn-secondary">Reschedule</button>
        </form>
      </div>
    </div>
  `
}

function getMatchStatusBadge(match) {
  if (match.result) {
    return '<span class="badge badge-success">Completed</span>'
  }

  return '<span class="badge badge-warning">Scheduled</span>'
}

function setupCreateFixtureForm() {
  const form = document.getElementById("createFixtureForm")
  if (!form) return

  form.addEventListener("submit", async (e) => {
    e.preventDefault()

    const btn = document.getElementById("createFixtureBtn")
    const btnText = document.getElementById("createFixtureText")
    const spinner = document.getElementById("createFixtureSpinner")
    const messageDiv = document.getElementById("createFixtureMessage")

    messageDiv.innerHTML = ""
    btn.disabled = true
    btnText.textContent = "Creating..."
    spinner.classList.remove("hidden")

    try {
      const formData = new FormData(form)
      const payload = {
        season_id: Number(formData.get("season_id")),
        games_per_pair: Number(formData.get("games_per_pair")),
        start_date: String(formData.get("start_date") || ""),
        games_per_day: Number(formData.get("games_per_day")),
      }

      const data = await window.EAFC.apiCall("/matches/fixtures", {
        method: "POST",
        body: JSON.stringify(payload),
      })

      if (!data.success) {
        throw new Error(data.error || "Failed to create fixtures")
      }

      messageDiv.innerHTML = `<div class="alert alert-success">${escapeHtml(data.message || "Fixtures created successfully")}</div>`
      form.reset()

      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      document.getElementById("fixtureStartDate").value = tomorrow.toISOString().split("T")[0]

      setTimeout(() => {
        loadMatches()
      }, 700)
    } catch (error) {
      console.error("Failed to create fixtures:", error)
      messageDiv.innerHTML = `<div class="alert alert-error">${escapeHtml(error.message)}</div>`
    } finally {
      btn.disabled = false
      btnText.textContent = "Create Fixtures"
      spinner.classList.add("hidden")
    }
  })
}

async function submitResult(event, matchId) {
  event.preventDefault()

  const form = event.target
  const homeGoals = form.home_goals.value
  const awayGoals = form.away_goals.value

  try {
    const data = await window.EAFC.apiCall("/matches/result", {
      method: "POST",
      body: JSON.stringify({
        match_id: matchId,
        result: `${homeGoals}-${awayGoals}`,
      }),
    })

    if (!data.success) {
      throw new Error(data.error || "Failed to record result")
    }

    window.EAFC.showAlert(data.message || "Match result recorded successfully", "success")
    loadMatches()
  } catch (error) {
    console.error("Failed to record result:", error)
    window.EAFC.showAlert(error.message, "error")
  }
}

async function submitReschedule(event, matchId) {
  event.preventDefault()

  const form = event.target
  const newDate = form.new_date.value

  try {
    const data = await window.EAFC.apiCall("/matches/reschedule", {
      method: "POST",
      body: JSON.stringify({
        match_id: matchId,
        new_date: newDate,
      }),
    })

    if (!data.success) {
      throw new Error(data.error || "Failed to reschedule match")
    }

    window.EAFC.showAlert(data.message || "Match rescheduled successfully", "success")
    loadMatches()
  } catch (error) {
    console.error("Failed to reschedule match:", error)
    window.EAFC.showAlert(error.message, "error")
  }
}

function escapeHtml(text) {
  const div = document.createElement("div")
  div.textContent = text == null ? "" : String(text)
  return div.innerHTML
}

function formatDate(dateString) {
  if (!dateString) return "N/A"
  const date = new Date(dateString)
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

window.loadMatches = loadMatches
window.submitResult = submitResult
window.submitReschedule = submitReschedule
