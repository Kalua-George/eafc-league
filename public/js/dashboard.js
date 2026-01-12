// Dashboard navigation and overview functionality
document.addEventListener("DOMContentLoaded", () => {
  // Check authentication
  if (!window.EAFC || !window.EAFC.isLoggedIn || !window.EAFC.isLoggedIn()) {
    window.location.href = "login.html"
    return
  }

  // Initialize dashboard
  initDashboard()
  loadOverviewStats()

  // Set up navigation
  setupNavigation()

  // Set up logout
  setupLogout()

  // Display admin username
  displayAdminInfo()
})

function initDashboard() {
  // Show overview section by default
  showSection("overview")
}

function setupNavigation() {
  const navTabs = document.querySelectorAll(".nav-tab")

  navTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const sectionId = tab.getAttribute("data-section")
      showSection(sectionId)

      // Update active tab
      navTabs.forEach((t) => t.classList.remove("active"))
      tab.classList.add("active")
    })
  })
}

function showSection(sectionId) {
  // Hide all sections
  const sections = document.querySelectorAll(".section")
  sections.forEach((section) => {
    section.classList.add("hidden")
  })

  // Show selected section
  const targetSection = document.getElementById(sectionId)
  if (targetSection) {
    targetSection.classList.remove("hidden")

    // Load section content if needed
    loadSectionContent(sectionId)
  }

  // Update active tab
  const navTabs = document.querySelectorAll(".nav-tab")
  navTabs.forEach((tab) => {
    tab.classList.remove("active")
    if (tab.getAttribute("data-section") === sectionId) {
      tab.classList.add("active")
    }
  })
}

function loadSectionContent(sectionId) {
  switch (sectionId) {
    case "players":
      if (window.loadPlayers) {
        window.loadPlayers()
      } else {
        loadPlayersScript()
      }
      break
    case "seasons":
      if (window.loadSeasons) {
        window.loadSeasons()
      } else {
        loadSeasonsScript()
      }
      break
    case "matches":
      if (window.loadMatches) {
        window.loadMatches()
      } else {
        loadMatchesScript()
      }
      break
    case "logs":
      if (window.loadLogs) {
        window.loadLogs()
      } else {
        loadLogsScript()
      }
      break
  }
}

function loadPlayersScript() {
  if (!document.querySelector('script[src="js/players.js"]')) {
    const script = document.createElement("script")
    script.src = "js/players.js"
    document.head.appendChild(script)
  }
}

function loadSeasonsScript() {
  if (!document.querySelector('script[src="js/seasons.js"]')) {
    const script = document.createElement("script")
    script.src = "js/seasons.js"
    document.head.appendChild(script)
  }
}

function loadMatchesScript() {
  if (!document.querySelector('script[src="js/matches.js"]')) {
    const script = document.createElement("script")
    script.src = "js/matches.js"
    document.head.appendChild(script)
  }
}

function loadLogsScript() {
  if (!document.querySelector('script[src="js/logs.js"]')) {
    const script = document.createElement("script")
    script.src = "js/logs.js"
    document.head.appendChild(script)
  }
}

async function loadOverviewStats() {
  try {
    // Load dashboard statistics
    const [playersResponse, seasonsResponse, matchesResponse] = await Promise.all([
      fetch("../api/players/get_players.php").catch(() => ({ json: () => ({ players: [] }) })),
      fetch("../api/seasons.php?action=list").catch(() => ({ json: () => ({ seasons: [] }) })),
      fetch("../api/matches.php?action=list").catch(() => ({ json: () => ({ matches: [] }) })),
    ])

    const playersData = await playersResponse.json()
    const seasonsData = await seasonsResponse.json()
    const matchesData = await matchesResponse.json()

    // Update stats
    const players = playersData.players || []
    const seasons = seasonsData.seasons || []
    const matches = matchesData.matches || []

    document.getElementById("totalPlayers").textContent = players.length
    document.getElementById("pendingPlayers").textContent = players.filter((p) => p.status === "pending").length
    document.getElementById("totalMatches").textContent = matches.length
    document.getElementById("activeSeasons").textContent = seasons.filter((s) => s.status === "active").length
  } catch (error) {
    console.error("Failed to load overview stats:", error)
    // Set default values on error
    document.getElementById("totalPlayers").textContent = "-"
    document.getElementById("pendingPlayers").textContent = "-"
    document.getElementById("totalMatches").textContent = "-"
    document.getElementById("activeSeasons").textContent = "-"
  }
}

function setupLogout() {
  const logoutBtn = document.getElementById("logoutBtn")

  logoutBtn.addEventListener("click", async () => {
    if (confirm("Are you sure you want to logout?")) {
      try {
        // Call logout API
        await fetch("/api/admin/logout.php", {
          method: "POST",
        })
      } catch (error) {
        console.error("Logout API call failed:", error)
      } finally {
        // Clear session and redirect
        if (window.EAFC && window.EAFC.logout) {
          window.EAFC.logout()
        } else {
          window.location.href = "login.html"
        }
      }
    }
  })
}

function displayAdminInfo() {
  const username = window.EAFC && window.EAFC.getSession ? window.EAFC.getSession("admin_username") : "Admin"

  const usernameElement = document.getElementById("adminUsername")
  if (usernameElement && username) {
    usernameElement.textContent = username
  }
}

// Add CSS for navigation tabs
const style = document.createElement("style")
style.textContent = `
    .nav-tab {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.25rem;
        padding: 0.75rem 1rem;
        border: none;
        background: transparent;
        color: var(--gray-600);
        font-size: 0.875rem;
        font-weight: 500;
        border-radius: 0.5rem;
        cursor: pointer;
        transition: all 0.2s ease;
        min-width: 80px;
        white-space: nowrap;
    }
    
    .nav-tab:hover {
        background-color: var(--gray-100);
        color: var(--gray-700);
    }
    
    .nav-tab.active {
        background-color: var(--primary-green);
        color: white;
    }
    
    .nav-tab.active:hover {
        background-color: #2a8f01;
    }
    
    @media (max-width: 768px) {
        .nav-tab {
            min-width: 60px;
            padding: 0.5rem 0.75rem;
            font-size: 0.75rem;
        }
        
        .nav-tab span:first-child {
            font-size: 1rem;
        }
    }
`
document.head.appendChild(style)

// Export functions for use by other scripts
window.showSection = showSection
window.loadOverviewStats = loadOverviewStats
