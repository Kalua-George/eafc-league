// Season Management System for EAFC League Admin Dashboard

// Initialize season management when loaded
document.addEventListener("DOMContentLoaded", () => {
  // Only initialize if we're on the dashboard page
  if (document.getElementById("seasonsContent")) {
    initSeasonManagement()
  }
})

function initSeasonManagement() {
  // Set up modals
  setupSeasonModals()
}

// Load seasons table
async function loadSeasons() {
  const container = document.getElementById("seasonsContent")
  if (!container) return

  // Show loading state
  container.innerHTML = `
    <div class="text-center py-8">
      <div class="spinner mx-auto mb-4"></div>
      <p class="text-gray-600">Loading seasons...</p>
    </div>
  `

  try {
    const response = await fetch("../api/seasons/get_seasons.php")
    const data = await response.json()

    if (!data.success || !data.seasons || data.seasons.length === 0) {
      renderEmptySeasons()
      return
    }

    const seasons = data.seasons
    renderSeasonsTable(seasons)
  } catch (error) {
    console.error("Failed to load seasons:", error)
    container.innerHTML = `
      <div class="card">
        <div class="card-body text-center">
          <div class="text-red mb-4">
            <span class="text-4xl">⚠️</span>
          </div>
          <h3 class="text-lg font-semibold text-red mb-2">Failed to Load Seasons</h3>
          <p class="text-gray-600 mb-4">${error.message}</p>
          <button onclick="loadSeasons()" class="btn btn-primary">Try Again</button>
        </div>
      </div>
    `
  }
}

function renderEmptySeasons() {
  const container = document.getElementById("seasonsContent")
  container.innerHTML = `
    <div class="flex flex-col gap-6">
      <div class="card">
        <div class="card-header">
          <h3 class="text-lg font-semibold">Add New Season</h3>
        </div>
        <div class="card-body">
          <button onclick="openAddSeasonModal()" class="btn btn-primary">
            + Create First Season
          </button>
        </div>
      </div>
      
      <div class="card">
        <div class="card-body text-center">
          <div class="text-gray-400 mb-4">
            <span class="text-4xl">🏆</span>
          </div>
          <h3 class="text-lg font-semibold text-gray-700 mb-2">No Seasons Found</h3>
          <p class="text-gray-600">Create your first season to get started.</p>
        </div>
      </div>
    </div>
  `
}

function renderSeasonsTable(seasons) {
  const container = document.getElementById("seasonsContent")
  const currentSeasonId = seasons[0]?.id // Latest season is first

  const html = `
    <div class="flex flex-col gap-6">
       Add Season Section 
      <div class="card">
        <div class="card-header">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold">Add New Season</h3>
            <button onclick="openAddSeasonModal()" class="btn btn-primary">
              + Add Season
            </button>
          </div>
        </div>
      </div>

       Seasons Table 
      <div class="card">
        <div class="card-header">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold">Seasons (${seasons.length})</h3>
            <button onclick="loadSeasons()" class="btn btn-outline btn-sm">
              🔄 Refresh
            </button>
          </div>
        </div>
        <div class="card-body p-0">
          <div class="overflow-auto">
            <table class="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Season Name</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${seasons.map((season) => renderSeasonRow(season, currentSeasonId)).join("")}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `

  container.innerHTML = html
}

function renderSeasonRow(season, currentSeasonId) {
  const statusBadge = getSeasonStatusBadge(season)
  const isCurrent = season.id === currentSeasonId

  return `
    <tr id="season-${season.id}">
      <td class="font-mono text-sm">#${season.id}</td>
      <td class="font-semibold">
        ${escapeHtml(season.name)}
        ${isCurrent ? '<span class="badge badge-info ml-2">Current</span>' : ""}
      </td>
      <td class="text-sm">${formatDate(season.start_date)}</td>
      <td class="text-sm">${formatDate(season.end_date)}</td>
      <td>${statusBadge}</td>
      <td>
        <div class="flex gap-2">
          ${
            isCurrent
              ? `
            <button onclick="editSeason(${season.id})" class="btn btn-outline btn-sm">
              Edit
            </button>
          `
              : `
            <button onclick="viewSeasonRankings(${season.id})" class="btn btn-secondary btn-sm">
              View Rankings
            </button>
          `
          }
        </div>
      </td>
    </tr>
  `
}

function getSeasonStatusBadge(season) {
  const today = new Date()
  const startDate = new Date(season.start_date)
  const endDate = new Date(season.end_date)

  if (today < startDate) {
    return '<span class="badge badge-warning">Upcoming</span>'
  } else if (today >= startDate && today <= endDate) {
    return '<span class="badge badge-success">Active</span>'
  } else {
    return '<span class="badge badge-info">Completed</span>'
  }
}

// Add season modal
function openAddSeasonModal() {
  const modalHtml = `
    <div id="addSeasonModal" class="modal show">
      <div class="modal-content">
        <div class="modal-header">
          <h3 class="modal-title">Add New Season</h3>
          <button class="modal-close" onclick="closeAddSeasonModal()">&times;</button>
        </div>
        <div class="modal-body">
          <form id="addSeasonForm">
            <div class="form-group">
              <label for="seasonName" class="form-label">Season Name *</label>
              <input 
                type="text" 
                id="seasonName" 
                name="name" 
                class="form-input" 
                required
                placeholder="e.g., Season 2024"
                maxlength="100"
              >
            </div>
            <div class="form-group">
              <label for="seasonYear" class="form-label">Year *</label>
              <input 
                type="number" 
                id="seasonYear" 
                name="year" 
                class="form-input" 
                required
                min="2020"
                max="2030"
                value="${new Date().getFullYear()}"
              >
            </div>
            <div class="form-group">
              <label for="seasonStart" class="form-label">Start Date *</label>
              <input 
                type="date" 
                id="seasonStart" 
                name="start_date" 
                class="form-input" 
                required
              >
            </div>
            <div class="form-group">
              <label for="seasonEnd" class="form-label">End Date *</label>
              <input 
                type="date" 
                id="seasonEnd" 
                name="end_date" 
                class="form-input" 
                required
              >
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button onclick="closeAddSeasonModal()" class="btn btn-outline">Cancel</button>
          <button onclick="submitAddSeason()" class="btn btn-primary" id="addSeasonBtn">
            <span id="addSeasonText">Add Season</span>
            <div id="addSeasonSpinner" class="spinner hidden"></div>
          </button>
        </div>
      </div>
    </div>
  `

  // Remove existing modal if any
  const existingModal = document.getElementById("addSeasonModal")
  if (existingModal) {
    existingModal.remove()
  }

  // Add modal to page
  document.body.insertAdjacentHTML("beforeend", modalHtml)

  // Set default dates
  const today = new Date()
  const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1)
  const endOfYear = new Date(today.getFullYear(), 11, 31)

  document.getElementById("seasonStart").value = nextMonth.toISOString().split("T")[0]
  document.getElementById("seasonEnd").value = endOfYear.toISOString().split("T")[0]

  // Focus first input
  document.getElementById("seasonName").focus()
}

function closeAddSeasonModal() {
  const modal = document.getElementById("addSeasonModal")
  if (modal) {
    modal.remove()
  }
}

async function submitAddSeason() {
  const form = document.getElementById("addSeasonForm")
  const btn = document.getElementById("addSeasonBtn")
  const btnText = document.getElementById("addSeasonText")
  const spinner = document.getElementById("addSeasonSpinner")

  // Get form data
  const formData = new FormData(form)
  const seasonData = {
    name: formData.get("name").trim(),
    year: formData.get("year"),
    start_date: formData.get("start_date"),
    end_date: formData.get("end_date"),
  }

  // Validate
  if (!seasonData.name || !seasonData.start_date || !seasonData.end_date) {
    if (window.EAFC && window.EAFC.showAlert) {
      window.EAFC.showAlert("Please fill in all required fields", "warning")
    }
    return
  }

  // Validate dates
  const startDate = new Date(seasonData.start_date)
  const endDate = new Date(seasonData.end_date)

  if (endDate <= startDate) {
    if (window.EAFC && window.EAFC.showAlert) {
      window.EAFC.showAlert("End date must be after start date", "warning")
    }
    return
  }

  // Show loading
  btn.disabled = true
  btnText.textContent = "Adding..."
  spinner.classList.remove("hidden")

  try {
    const response = await fetch("../api/seasons/add_season.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(seasonData),
    })

    const data = await response.json()

    if (data.success) {
      if (window.EAFC && window.EAFC.showAlert) {
        window.EAFC.showAlert(data.message || "Season added successfully", "success")
      }

      closeAddSeasonModal()
      loadSeasons() // Refresh the table

      // Refresh overview stats
      if (window.loadOverviewStats) {
        window.loadOverviewStats()
      }
    } else {
      throw new Error(data.error || "Failed to add season")
    }
  } catch (error) {
    console.error("Failed to add season:", error)
    if (window.EAFC && window.EAFC.showAlert) {
      window.EAFC.showAlert(error.message, "error")
    }
  } finally {
    // Reset button
    btn.disabled = false
    btnText.textContent = "Add Season"
    spinner.classList.add("hidden")
  }
}

// Edit season functionality
function editSeason(seasonId) {
  const row = document.getElementById(`season-${seasonId}`)
  if (!row) return

  const endDate = row.children[3].textContent

  const modalHtml = `
    <div id="editSeasonModal" class="modal show">
      <div class="modal-content">
        <div class="modal-header">
          <h3 class="modal-title">Edit Current Season</h3>
          <button class="modal-close" onclick="closeEditSeasonModal()">&times;</button>
        </div>
        <div class="modal-body">
          <form id="editSeasonForm">
            <input type="hidden" id="editSeasonId" value="${seasonId}">
            <div class="form-group">
              <label class="form-label">Season Name</label>
              <input 
                type="text" 
                class="form-input" 
                value="${escapeHtml(row.children[1].textContent.replace(/Current$/, "").trim())}"
                disabled
              >
              <small class="text-gray-600">Season name cannot be changed</small>
            </div>
            <div class="form-group">
              <label class="form-label">Start Date</label>
              <input 
                type="date" 
                class="form-input" 
                value="${row.children[2].textContent}"
                disabled
              >
              <small class="text-gray-600">Start date cannot be changed</small>
            </div>
            <div class="form-group">
              <label for="editSeasonEnd" class="form-label">End Date *</label>
              <input 
                type="date" 
                id="editSeasonEnd" 
                name="end_date" 
                class="form-input" 
                required
                value="${endDate}"
              >
              <small class="text-gray-600">Only end date can be modified</small>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button onclick="closeEditSeasonModal()" class="btn btn-outline">Cancel</button>
          <button onclick="submitEditSeason()" class="btn btn-primary" id="editSeasonBtn">
            <span id="editSeasonText">Save Changes</span>
            <div id="editSeasonSpinner" class="spinner hidden"></div>
          </button>
        </div>
      </div>
    </div>
  `

  // Remove existing modal if any
  const existingModal = document.getElementById("editSeasonModal")
  if (existingModal) {
    existingModal.remove()
  }

  // Add modal to page
  document.body.insertAdjacentHTML("beforeend", modalHtml)

  // Focus end date input
  document.getElementById("editSeasonEnd").focus()
}

function closeEditSeasonModal() {
  const modal = document.getElementById("editSeasonModal")
  if (modal) {
    modal.remove()
  }
}

async function submitEditSeason() {
  const btn = document.getElementById("editSeasonBtn")
  const btnText = document.getElementById("editSeasonText")
  const spinner = document.getElementById("editSeasonSpinner")

  const seasonId = document.getElementById("editSeasonId").value
  const endDate = document.getElementById("editSeasonEnd").value

  if (!endDate) {
    if (window.EAFC && window.EAFC.showAlert) {
      window.EAFC.showAlert("Please select an end date", "warning")
    }
    return
  }

  // Show loading
  btn.disabled = true
  btnText.textContent = "Saving..."
  spinner.classList.remove("hidden")

  try {
    const response = await fetch("../api/seasons/edit_season.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ season_id: seasonId, end_date: endDate }),
    })

    const data = await response.json()

    if (data.success) {
      if (window.EAFC && window.EAFC.showAlert) {
        window.EAFC.showAlert(data.message || "Season updated successfully", "success")
      }

      closeEditSeasonModal()
      loadSeasons() // Refresh the table
    } else {
      throw new Error(data.error || "Failed to update season")
    }
  } catch (error) {
    console.error("Failed to update season:", error)
    if (window.EAFC && window.EAFC.showAlert) {
      window.EAFC.showAlert(error.message, "error")
    }
  } finally {
    // Reset button
    btn.disabled = false
    btnText.textContent = "Save Changes"
    spinner.classList.add("hidden")
  }
}

// View season rankings
async function viewSeasonRankings(seasonId) {
  const modalHtml = `
    <div id="viewSeasonModal" class="modal show">
      <div class="modal-content" style="max-width: 800px;">
        <div class="modal-header">
          <h3 class="modal-title">Season Rankings</h3>
          <button class="modal-close" onclick="closeViewSeasonModal()">&times;</button>
        </div>
        <div class="modal-body">
          <div id="seasonRankingsContent">
            <div class="text-center py-8">
              <div class="spinner mx-auto mb-4"></div>
              <p class="text-gray-600">Loading rankings...</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `

  // Remove existing modal if any
  const existingModal = document.getElementById("viewSeasonModal")
  if (existingModal) {
    existingModal.remove()
  }

  // Add modal to page
  document.body.insertAdjacentHTML("beforeend", modalHtml)

  // Load rankings
  try {
    const response = await fetch(`../api/matches/standings.php?season_id=${seasonId}`)
    const rankings = await response.json()

    const content = document.getElementById("seasonRankingsContent")

    if (!rankings || rankings.length === 0) {
      content.innerHTML = `
        <div class="text-center py-8">
          <div class="text-gray-400 mb-4">
            <span class="text-4xl">📊</span>
          </div>
          <h3 class="text-lg font-semibold text-gray-700 mb-2">No Rankings Available</h3>
          <p class="text-gray-600">No match results found for this season.</p>
        </div>
      `
      return
    }

    const html = `
      <div class="overflow-auto">
        <table class="table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Team</th>
              <th>Points</th>
              <th>Matches</th>
              <th>W-D-L</th>
            </tr>
          </thead>
          <tbody>
            ${rankings
              .map(
                (r, index) => `
              <tr>
                <td class="font-bold">${index + 1}</td>
                <td class="font-semibold">${escapeHtml(r.team_name || r.gamer_tag)}</td>
                <td class="font-bold text-green">${r.points || 0}</td>
                <td>${r.matches_played || 0}</td>
                <td class="text-sm">${r.wins || 0}-${r.draws || 0}-${r.losses || 0}</td>
              </tr>
            `,
              )
              .join("")}
          </tbody>
        </table>
      </div>
    `

    content.innerHTML = html
  } catch (error) {
    console.error("Failed to load rankings:", error)
    document.getElementById("seasonRankingsContent").innerHTML = `
      <div class="text-center py-8">
        <div class="text-red mb-4">
          <span class="text-4xl">⚠️</span>
        </div>
        <h3 class="text-lg font-semibold text-red mb-2">Failed to Load Rankings</h3>
        <p class="text-gray-600">${error.message}</p>
      </div>
    `
  }
}

function closeViewSeasonModal() {
  const modal = document.getElementById("viewSeasonModal")
  if (modal) {
    modal.remove()
  }
}

// Setup season modals
function setupSeasonModals() {
  // Modals are created dynamically, no setup needed
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
window.loadSeasons = loadSeasons
window.editSeason = editSeason
window.viewSeasonRankings = viewSeasonRankings
window.openAddSeasonModal = openAddSeasonModal
window.closeAddSeasonModal = closeAddSeasonModal
window.submitAddSeason = submitAddSeason
window.closeEditSeasonModal = closeEditSeasonModal
window.submitEditSeason = submitEditSeason
window.closeViewSeasonModal = closeViewSeasonModal
