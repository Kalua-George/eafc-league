// Match Management System for EAFC League Admin Dashboard

// Initialize match management when loaded
document.addEventListener("DOMContentLoaded", () => {
  // Only initialize if we're on the dashboard page
  if (document.getElementById("matchesContent")) {
    initMatchManagement()
  }
})

function initMatchManagement() {
  // Setup is handled dynamically when matches are loaded
}

// Load matches
async function loadMatches() {
  const container = document.getElementById("matchesContent")
  if (!container) return

  // Show loading state
  container.innerHTML = `
    <div class="text-center py-8">
      <div class="spinner mx-auto mb-4"></div>
      <p class="text-gray-600">Loading matches...</p>
    </div>
  `

  try {
    const response = await fetch("../api/matches/matches.php")
    const matches = await response.json()

    renderMatchesInterface(matches || [])
  } catch (error) {
    console.error("Failed to load matches:", error)
    container.innerHTML = `
      <div class="card">
        <div class="card-body text-center">
          <div class="text-red mb-4">
            <span class="text-4xl">⚠️</span>
          </div>
          <h3 class="text-lg font-semibold text-red mb-2">Failed to Load Matches</h3>
          <p class="text-gray-600 mb-4">${error.message}</p>
          <button onclick="loadMatches()" class="btn btn-primary">Try Again</button>
        </div>
      </div>
    `
  }
}

function renderMatchesInterface(matches) {
  const container = document.getElementById("matchesContent")

  const html = `
    <div class="flex flex-col gap-6">
       Create Fixture Section 
      <div class="card">
        <div class="card-header">
          <h3 class="text-lg font-semibold">Create Fixture</h3>
        </div>
        <div class="card-body">
          <form id="createFixtureForm" class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="form-group">
              <label for="fixtureSeasonId" class="form-label">Season ID *</label>
              <input 
                type="number" 
                id="fixtureSeasonId" 
                name="season_id" 
                class="form-input" 
                required
                placeholder="Enter season ID"
                min="1"
              >
            </div>
            <div class="form-group">
              <label for="fixtureGamesPerPair" class="form-label">Games Per Pair *</label>
              <input 
                type="number" 
                id="fixtureGamesPerPair" 
                name="games_per_pair" 
                class="form-input" 
                required
                value="1"
                min="1"
                max="10"
              >
            </div>
            <div class="form-group">
              <label for="fixtureStartDate" class="form-label">Start Date *</label>
              <input 
                type="date" 
                id="fixtureStartDate" 
                name="start_date" 
                class="form-input" 
                required
              >
            </div>
            <div class="form-group">
              <label for="fixtureGamesPerDay" class="form-label">Games Per Day *</label>
              <input 
                type="number" 
                id="fixtureGamesPerDay" 
                name="games_per_day" 
                class="form-input" 
                required
                value="2"
                min="1"
                max="20"
              >
            </div>
            <div class="md:col-span-2">
              <button type="submit" class="btn btn-primary w-full" id="createFixtureBtn">
                <span id="createFixtureText">Create Fixture</span>
                <div id="createFixtureSpinner" class="spinner hidden"></div>
              </button>
            </div>
          </form>
          <div id="createFixtureMessage" class="mt-4"></div>
        </div>
      </div>

       Matches List 
      <div class="card">
        <div class="card-header">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold">Fixtures & Results (${matches.length})</h3>
            <button onclick="loadMatches()" class="btn btn-outline btn-sm">
              🔄 Refresh
            </button>
          </div>
        </div>
        <div class="card-body">
          ${matches.length === 0 ? renderEmptyMatches() : renderMatchesList(matches)}
        </div>
      </div>
    </div>
  `

  container.innerHTML = html

  // Set up form handler
  setupCreateFixtureForm()

  // Set default start date to tomorrow
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  document.getElementById("fixtureStartDate").value = tomorrow.toISOString().split("T")[0]
}

function renderEmptyMatches() {
  return `
    <div class="text-center py-8">
      <div class="text-gray-400 mb-4">
        <span class="text-4xl">⚽</span>
      </div>
      <h3 class="text-lg font-semibold text-gray-700 mb-2">No Fixtures Found</h3>
      <p class="text-gray-600">Create a fixture above to schedule matches.</p>
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
              <h4 class="font-semibold text-lg">
                ${escapeHtml(match.home_team)} vs ${escapeHtml(match.away_team)}
              </h4>
              <p class="text-sm text-gray-600">
                Match Date: ${formatDate(match.match_date)}
                ${match.season_id ? ` | Season #${match.season_id}` : ""}
              </p>
            </div>
            <div class="mt-2 md:mt-0">
              ${getMatchStatusBadge(match.status)}
            </div>
          </div>

          ${match.status === "completed" ? renderCompletedMatch(match) : renderPendingMatch(match)}
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
      <div class="text-2xl font-bold text-green mb-2">
        Final Result: ${match.home_goals} - ${match.away_goals}
      </div>
      <p class="text-sm text-gray-600">Match completed</p>
    </div>
  `
}

function renderPendingMatch(match) {
  return `
    <div class="space-y-3">
       Record Result Form 
      <div class="bg-gray-50 rounded-md p-4">
        <h5 class="font-medium mb-3">Record Result</h5>
        <form onsubmit="submitResult(event, ${match.id})" class="flex flex-col md:flex-row items-end gap-3">
          <div class="flex-1">
            <label class="form-label text-sm">${escapeHtml(match.home_team)} Goals</label>
            <input 
              type="number" 
              name="home_goals" 
              class="form-input" 
              required
              min="0"
              max="50"
              placeholder="0"
            >
          </div>
          <div class="text-2xl font-bold text-gray-400 self-center">-</div>
          <div class="flex-1">
            <label class="form-label text-sm">${escapeHtml(match.away_team)} Goals</label>
            <input 
              type="number" 
              name="away_goals" 
              class="form-input" 
              required
              min="0"
              max="50"
              placeholder="0"
            >
          </div>
          <button type="submit" class="btn btn-primary">
            Record Result
          </button>
        </form>
      </div>

       Reschedule Form 
      <div class="bg-gray-50 rounded-md p-4">
        <h5 class="font-medium mb-3">Reschedule Match</h5>
        <form onsubmit="submitReschedule(event, ${match.id})" class="flex flex-col md:flex-row items-end gap-3">
          <div class="flex-1">
            <label class="form-label text-sm">New Date</label>
            <input 
              type="date" 
              name="new_date" 
              class="form-input" 
              required
            >
          </div>
          <button type="submit" class="btn btn-secondary">
            Reschedule
          </button>
        </form>
      </div>
    </div>
  `
}

function getMatchStatusBadge(status) {
  switch (status) {
    case "completed":
      return '<span class="badge badge-success">Completed</span>'
    case "scheduled":
      return '<span class="badge badge-warning">Scheduled</span>'
    case "postponed":
      return '<span class="badge badge-info">Postponed</span>'
    default:
      return '<span class="badge badge-info">Pending</span>'
  }
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

    // Clear previous messages
    messageDiv.innerHTML = ""

    // Show loading
    btn.disabled = true
    btnText.textContent = "Creating..."
    spinner.classList.remove("hidden")

    try {
      const formData = new FormData(form)

      const response = await fetch("../api/matches/create_fixture.php", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (data.success) {
        messageDiv.innerHTML = `
          <div class="alert alert-success">
            ${data.message || "Fixture created successfully"}
          </div>
        `
        form.reset()

        // Set default start date again
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        document.getElementById("fixtureStartDate").value = tomorrow.toISOString().split("T")[0]

        // Reload matches
        setTimeout(() => {
          loadMatches()
        }, 1000)
      } else {
        throw new Error(data.error || "Failed to create fixture")
      }
    } catch (error) {
      console.error("Failed to create fixture:", error)
      messageDiv.innerHTML = `
        <div class="alert alert-error">
          ${error.message}
        </div>
      `
    } finally {
      // Reset button
      btn.disabled = false
      btnText.textContent = "Create Fixture"
      spinner.classList.add("hidden")
    }
  })
}

// Submit match result
async function submitResult(event, matchId) {
  event.preventDefault()

  const form = event.target
  const formData = new FormData(form)
  formData.append("match_id", matchId)

  try {
    const response = await fetch("../api/matches/record_results.php", {
      method: "POST",
      body: formData,
    })

    const data = await response.json()

    if (data.success) {
      if (window.EAFC && window.EAFC.showAlert) {
        window.EAFC.showAlert("Match result recorded successfully", "success")
      }
      loadMatches() // Refresh matches
    } else {
      throw new Error(data.error || "Failed to record result")
    }
  } catch (error) {
    console.error("Failed to record result:", error)
    if (window.EAFC && window.EAFC.showAlert) {
      window.EAFC.showAlert(error.message, "error")
    }
  }
}

// Submit match reschedule
async function submitReschedule(event, matchId) {
  event.preventDefault()

  const form = event.target
  const formData = new FormData(form)
  formData.append("match_id", matchId)

  try {
    const response = await fetch("../api/matches/reschedule.php", {
      method: "POST",
      body: formData,
    })

    const data = await response.json()

    if (data.success) {
      if (window.EAFC && window.EAFC.showAlert) {
        window.EAFC.showAlert("Match rescheduled successfully", "success")
      }
      loadMatches() // Refresh matches
    } else {
      throw new Error(data.error || "Failed to reschedule match")
    }
  } catch (error) {
    console.error("Failed to reschedule match:", error)
    if (window.EAFC && window.EAFC.showAlert) {
      window.EAFC.showAlert(error.message, "error")
    }
  }
}

// Utility functions
function escapeHtml(text) {
  const div = document.createElement("div")
  div.textContent = text
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

// Export functions for global access
window.loadMatches = loadMatches
window.submitResult = submitResult
window.submitReschedule = submitReschedule
