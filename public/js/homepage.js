// Homepage functionality for EAFC League
const EAFC = {
  apiCall: async (url) => {
    // Mock implementation for demonstration purposes
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          season: { name: "Season 2023", status: "Active" },
          rankings: [
            { gamer_tag: "Player1", points: 100, wins: 10, draws: 5, losses: 3, goals_for: 20, goals_against: 10 },
            { gamer_tag: "Player2", points: 90, wins: 9, draws: 4, losses: 4, goals_for: 18, goals_against: 12 },
          ],
          top_scorers: [
            { gamer_tag: "Player1", goals: 20 },
            { gamer_tag: "Player2", goals: 18 },
          ],
          clean_sheets: [
            { gamer_tag: "Player1", clean_sheets: 10 },
            { gamer_tag: "Player2", clean_sheets: 9 },
          ],
        })
      }, 1000)
    })
  },
}

document.addEventListener("DOMContentLoaded", () => {
  loadCurrentSeason()
  loadStandings()
  loadTopScorers()
  loadCleanSheets()
})

// Load current season information
async function loadCurrentSeason() {
  try {
    const response = await window.EAFC.apiCall("/seasons.php?action=current")

    if (response.success && response.season) {
      const season = response.season
      document.getElementById("season-name").textContent = season.name || "Current Season"

      const statusElement = document.getElementById("season-status")
      statusElement.textContent = season.status || "Active"

      // Style status based on value
      statusElement.className = ""
      if (season.status === "Active") {
        statusElement.className = "text-green font-medium"
      } else if (season.status === "Registration") {
        statusElement.className = "text-blue font-medium"
      } else {
        statusElement.className = "text-gray-600 font-medium"
      }
    } else {
      document.getElementById("season-name").textContent = "No Active Season"
      document.getElementById("season-status").textContent = "Inactive"
      document.getElementById("season-status").className = "text-gray-600 font-medium"
    }
  } catch (error) {
    console.error("Failed to load current season:", error)
    document.getElementById("season-name").textContent = "Error Loading"
    document.getElementById("season-status").textContent = "Backend Not Available"
    document.getElementById("season-status").className = "text-red font-medium"

    // Show helpful error message
    if (error.message.includes("API endpoint not found") || error.message.includes("API returned HTML")) {
      const alertsContainer = document.getElementById("alerts")
      if (alertsContainer) {
        alertsContainer.innerHTML = `
          <div class="alert alert-warning">
            <strong>Backend Not Connected:</strong> The PHP backend appears to be unavailable. 
            Please ensure your PHP server is running and the API endpoints are accessible.
          </div>
        `
      }
    }
  }
}

// Load season standings
async function loadStandings() {
  const loadingElement = document.getElementById("standings-loading")
  const tableElement = document.getElementById("standings-table")
  const noDataElement = document.getElementById("no-standings")

  try {
    const response = await window.EAFC.apiCall("/seasons.php?action=rankings")

    loadingElement.classList.add("hidden")

    if (response.success && response.rankings && response.rankings.length > 0) {
      const tbody = tableElement.querySelector("tbody")
      tbody.innerHTML = ""

      response.rankings.forEach((player, index) => {
        const row = document.createElement("tr")

        // Calculate goal difference
        const goalDiff = (player.goals_for || 0) - (player.goals_against || 0)
        const goalDiffClass = goalDiff > 0 ? "text-green" : goalDiff < 0 ? "text-red" : "text-gray-600"

        row.innerHTML = `
                    <td class="font-semibold">${index + 1}</td>
                    <td class="font-medium">${escapeHtml(player.gamer_tag || "N/A")}</td>
                    <td class="font-semibold text-green">${player.points || 0}</td>
                    <td class="text-green">${player.wins || 0}</td>
                    <td class="text-gray-600">${player.draws || 0}</td>
                    <td class="text-red">${player.losses || 0}</td>
                    <td>${player.goals_for || 0}</td>
                    <td>${player.goals_against || 0}</td>
                    <td class="${goalDiffClass} font-medium">${goalDiff > 0 ? "+" : ""}${goalDiff}</td>
                `

        tbody.appendChild(row)
      })

      tableElement.classList.remove("hidden")
    } else {
      noDataElement.classList.remove("hidden")
    }
  } catch (error) {
    console.error("Failed to load standings:", error)
    loadingElement.classList.add("hidden")
    noDataElement.classList.remove("hidden")
    noDataElement.innerHTML = '<p class="text-red">Backend not available. Please check your PHP server.</p>'
  }
}

// Load top scorers
async function loadTopScorers() {
  const loadingElement = document.getElementById("scorers-loading")
  const listElement = document.getElementById("top-scorers")
  const noDataElement = document.getElementById("no-scorers")

  try {
    const response = await window.EAFC.apiCall("/seasons.php?action=top_scorers")

    loadingElement.classList.add("hidden")

    if (response.success && response.top_scorers && response.top_scorers.length > 0) {
      listElement.innerHTML = ""

      response.top_scorers.forEach((player, index) => {
        const listItem = document.createElement("li")
        listItem.className = "flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0"

        listItem.innerHTML = `
                    <div class="flex items-center gap-3">
                        <span class="w-6 h-6 bg-green text-white rounded-full flex items-center justify-center text-xs font-bold">
                            ${index + 1}
                        </span>
                        <span class="font-medium">${escapeHtml(player.gamer_tag || "N/A")}</span>
                    </div>
                    <span class="font-bold text-green">${player.goals || 0} goals</span>
                `

        listElement.appendChild(listItem)
      })

      listElement.classList.remove("hidden")
    } else {
      noDataElement.classList.remove("hidden")
    }
  } catch (error) {
    console.error("Failed to load top scorers:", error)
    loadingElement.classList.add("hidden")
    noDataElement.classList.remove("hidden")
    noDataElement.innerHTML = '<p class="text-red">Backend not available.</p>'
  }
}

// Load clean sheets leaders
async function loadCleanSheets() {
  const loadingElement = document.getElementById("cleansheets-loading")
  const listElement = document.getElementById("clean-sheets")
  const noDataElement = document.getElementById("no-cleansheets")

  try {
    const response = await window.EAFC.apiCall("/seasons.php?action=clean_sheets")

    loadingElement.classList.add("hidden")

    if (response.success && response.clean_sheets && response.clean_sheets.length > 0) {
      listElement.innerHTML = ""

      response.clean_sheets.forEach((player, index) => {
        const listItem = document.createElement("li")
        listItem.className = "flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0"

        listItem.innerHTML = `
                    <div class="flex items-center gap-3">
                        <span class="w-6 h-6 bg-blue text-white rounded-full flex items-center justify-center text-xs font-bold">
                            ${index + 1}
                        </span>
                        <span class="font-medium">${escapeHtml(player.gamer_tag || "N/A")}</span>
                    </div>
                    <span class="font-bold text-blue">${player.clean_sheets || 0} clean sheets</span>
                `

        listElement.appendChild(listItem)
      })

      listElement.classList.remove("hidden")
    } else {
      noDataElement.classList.remove("hidden")
    }
  } catch (error) {
    console.error("Failed to load clean sheets:", error)
    loadingElement.classList.add("hidden")
    noDataElement.classList.remove("hidden")
    noDataElement.innerHTML = '<p class="text-red">Backend not available.</p>'
  }
}

// Utility function to escape HTML
function escapeHtml(text) {
  const div = document.createElement("div")
  div.textContent = text
  return div.innerHTML
}

// Refresh data function
function refreshData() {
  // Show loading states
  document.getElementById("standings-loading").classList.remove("hidden")
  document.getElementById("standings-table").classList.add("hidden")
  document.getElementById("no-standings").classList.add("hidden")

  document.getElementById("scorers-loading").classList.remove("hidden")
  document.getElementById("top-scorers").classList.add("hidden")
  document.getElementById("no-scorers").classList.add("hidden")

  document.getElementById("cleansheets-loading").classList.remove("hidden")
  document.getElementById("clean-sheets").classList.add("hidden")
  document.getElementById("no-cleansheets").classList.add("hidden")

  // Reload all data
  loadCurrentSeason()
  loadStandings()
  loadTopScorers()
  loadCleanSheets()
}

// Auto-refresh every 5 minutes
setInterval(refreshData, 5 * 60 * 1000)
