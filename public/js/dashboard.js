// Dashboard navigation and overview functionality

let dashboardInitialized = false

document.addEventListener("DOMContentLoaded", () => {
  if (!window.EAFC || !window.EAFC.isLoggedIn || !window.EAFC.isLoggedIn()) {
    window.location.href = window.EAFC_CONFIG.routes.login
    return
  }

  initDashboard()
})

function initDashboard() {
  if (dashboardInitialized) return
  dashboardInitialized = true

  setupNavigation()
  setupLogout()
  displayAdminInfo()

  showSection("overview")
  loadOverviewStats()
}

function setupNavigation() {
  const navTabs = document.querySelectorAll(".nav-tab")

  navTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const sectionId = tab.getAttribute("data-section")
      if (!sectionId) return
      showSection(sectionId)
    })
  })
}

function showSection(sectionId) {
  const sections = document.querySelectorAll(".section")
  sections.forEach((section) => section.classList.add("hidden"))

  const targetSection = document.getElementById(sectionId)
  if (targetSection) {
    targetSection.classList.remove("hidden")
    loadSectionContent(sectionId)
  }

  const navTabs = document.querySelectorAll(".nav-tab")
  navTabs.forEach((tab) => {
    const isActive = tab.getAttribute("data-section") === sectionId
    tab.classList.toggle("active", isActive)
  })
}

function loadSectionContent(sectionId) {
  switch (sectionId) {
    case "players":
      if (window.loadPlayers) {
        window.loadPlayers()
      } else {
        loadScriptOnce("js/players.js")
      }
      break
    case "seasons":
      if (window.loadSeasons) {
        window.loadSeasons()
      } else {
        loadScriptOnce("js/seasons.js")
      }
      break
    case "matches":
      if (window.loadMatches) {
        window.loadMatches()
      } else {
        loadScriptOnce("js/matches.js")
      }
      break
    case "logs":
      if (window.loadLogs) {
        window.loadLogs()
      } else {
        loadScriptOnce("js/logs.js")
      }
      break
    default:
      break
  }
}

function loadScriptOnce(src) {
  if (document.querySelector(`script[src="${src}"]`)) return

  const script = document.createElement("script")
  script.src = src
  document.head.appendChild(script)
}

async function loadOverviewStats() {
  const container = document.getElementById("overviewContent")
  if (!container) return

  container.innerHTML = `
    <div class="card text-center py-8 md:col-span-2">
      <div class="spinner mx-auto mb-4"></div>
      <p class="text-gray-600">Loading overview...</p>
    </div>
  `

  try {
    const [playersRaw, seasonsRaw, matchesRaw] = await Promise.all([
      window.EAFC.apiCall("/players"),
      window.EAFC.apiCall("/seasons"),
      window.EAFC.apiCall("/matches"),
    ])

    const players = Array.isArray(playersRaw) ? playersRaw : playersRaw.players || []
    const matches = Array.isArray(matchesRaw) ? matchesRaw : matchesRaw.matches || []

    let seasons = []
    if (Array.isArray(seasonsRaw)) {
      seasons = seasonsRaw
    } else if (Array.isArray(seasonsRaw.seasons)) {
      seasons = seasonsRaw.seasons
    } else if (seasonsRaw.season) {
      seasons = [seasonsRaw.season]
    }

    const pendingPlayers = players.filter((player) => player.status === "pending").length
    const approvedPlayers = players.filter((player) => player.status === "approved").length
    const activeSeasons = seasons.filter((season) => {
      return season.status === "current" || season.status === "active"
    }).length
    const completedMatches = matches.filter((match) => {
      return match.status === "completed" || (match.home_goals !== null && match.away_goals !== null)
    }).length

    container.innerHTML = `
      <div class="card overview-card">
        <div class="card-body">
          <div class="flex items-center justify-between mb-3">
            <span class="overview-label">Registered Players</span>
            <span class="overview-icon">👥</span>
          </div>
          <div class="overview-value">${players.length}</div>
          <p class="text-sm text-gray-600 mt-2">${approvedPlayers} approved and active</p>
        </div>
      </div>

      <div class="card overview-card">
        <div class="card-body">
          <div class="flex items-center justify-between mb-3">
            <span class="overview-label">Pending Approvals</span>
            <span class="overview-icon">⏳</span>
          </div>
          <div class="overview-value">${pendingPlayers}</div>
          <p class="text-sm text-gray-600 mt-2">Waiting for admin action</p>
        </div>
      </div>

      <div class="card overview-card">
        <div class="card-body">
          <div class="flex items-center justify-between mb-3">
            <span class="overview-label">Total Fixtures</span>
            <span class="overview-icon">⚽</span>
          </div>
          <div class="overview-value">${matches.length}</div>
          <p class="text-sm text-gray-600 mt-2">${completedMatches} completed</p>
        </div>
      </div>

      <div class="card overview-card">
        <div class="card-body">
          <div class="flex items-center justify-between mb-3">
            <span class="overview-label">Live Seasons</span>
            <span class="overview-icon">📅</span>
          </div>
          <div class="overview-value">${activeSeasons}</div>
          <p class="text-sm text-gray-600 mt-2">Based on current date range</p>
        </div>
      </div>
    `
  } catch (error) {
    console.error("Failed to load overview stats:", error)
    container.innerHTML = `
      <div class="card text-center py-8">
        <div class="text-red mb-3">⚠️</div>
        <p class="text-gray-700 font-semibold mb-2">Unable to load overview</p>
        <p class="text-sm text-gray-600 mb-4">${error.message || "Please try again."}</p>
        <button class="btn btn-primary" onclick="loadOverviewStats()">Retry</button>
      </div>
    `
  }
}

function setupLogout() {
  const logoutBtn = document.getElementById("logoutBtn")
  if (!logoutBtn) return

  logoutBtn.addEventListener("click", async () => {
    if (!confirm("Are you sure you want to logout?")) return

    try {
      await window.EAFC.apiCall("/admin/logout", { method: "POST" })
    } catch (error) {
      console.error("Logout API call failed:", error)
    } finally {
      if (window.EAFC && window.EAFC.logout) {
        window.EAFC.logout()
      } else {
        window.location.href = window.EAFC_CONFIG.routes.login
      }
    }
  })
}

function displayAdminInfo() {
  const username = (window.EAFC_CONFIG && window.EAFC_CONFIG.admin && window.EAFC_CONFIG.admin.username) || "Admin"
  const usernameElement = document.getElementById("adminUsername")

  if (usernameElement && username) {
    usernameElement.textContent = username
  }
}

window.showSection = showSection
window.loadOverviewStats = loadOverviewStats
