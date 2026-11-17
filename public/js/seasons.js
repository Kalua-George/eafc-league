// Season Management System for EAFC League Admin Dashboard

document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("seasonsContent")) {
    initSeasonManagement()
  }
})

function initSeasonManagement() {
  setupSeasonModals()
}

async function loadSeasons() {
  const container = document.getElementById("seasonsContent")
  if (!container) return

  container.innerHTML = `
    <div class="text-center py-8">
      <div class="spinner mx-auto mb-4"></div>
      <p class="text-gray-600">Loading seasons...</p>
    </div>
  `

  try {
    const data = await window.EAFC.apiCall("/seasons")

    if (!data.success) {
      throw new Error(data.error || "Failed to load seasons")
    }

    const seasons = data.seasons || []

    if (!seasons.length) {
      renderEmptySeasons()
      return
    }

    renderSeasonsTable(seasons)
  } catch (error) {
    console.error("Failed to load seasons:", error)
    container.innerHTML = `
      <div class="card">
        <div class="card-body text-center">
          <div class="text-red mb-4"><span class="text-4xl">⚠️</span></div>
          <h3 class="text-lg font-semibold text-red mb-2">Failed to Load Seasons</h3>
          <p class="text-gray-600 mb-4">${escapeHtml(error.message)}</p>
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
          <button onclick="openAddSeasonModal()" class="btn btn-primary">+ Create First Season</button>
        </div>
      </div>

      <div class="card">
        <div class="card-body text-center">
          <div class="text-gray-400 mb-4"><span class="text-4xl">🏆</span></div>
          <h3 class="text-lg font-semibold text-gray-700 mb-2">No Seasons Found</h3>
          <p class="text-gray-600">Create your first season to get started.</p>
        </div>
      </div>
    </div>
  `
}

function renderSeasonsTable(seasons) {
  const container = document.getElementById("seasonsContent")

  container.innerHTML = `
    <div class="flex flex-col gap-6">
      <div class="card">
        <div class="card-header">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold">Add New Season</h3>
            <button onclick="openAddSeasonModal()" class="btn btn-primary">+ Add Season</button>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold">Seasons (${seasons.length})</h3>
            <button onclick="loadSeasons()" class="btn btn-outline btn-sm">🔄 Refresh</button>
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
                ${seasons.map((season) => renderSeasonRow(season)).join("")}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `
}

function renderSeasonRow(season) {
  return `
    <tr id="season-${season.id}">
      <td class="font-mono text-sm">#${season.id}</td>
      <td class="font-semibold">${escapeHtml(season.name)}</td>
      <td class="text-sm">${formatDate(season.start_date)}</td>
      <td class="text-sm">${formatDate(season.end_date)}</td>
      <td>${getSeasonStatusBadge(season.status)}</td>
      <td>
        <button onclick="viewSeasonReport(${season.id})" class="btn btn-secondary btn-sm">View Report</button>
      </td>
    </tr>
  `
}

function getSeasonStatusBadge(status) {
  switch (status) {
    case "current":
      return '<span class="badge badge-success">Current</span>'
    case "pending":
      return '<span class="badge badge-warning">Pending</span>'
    case "ended":
      return '<span class="badge badge-info">Ended</span>'
    default:
      return '<span class="badge badge-info">Unknown</span>'
  }
}

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
              <input type="text" id="seasonName" name="name" class="form-input" required maxlength="100" />
            </div>
            <div class="form-group">
              <label for="seasonStart" class="form-label">Start Date *</label>
              <input type="date" id="seasonStart" name="start_date" class="form-input" required />
            </div>
            <div class="form-group">
              <label for="seasonEnd" class="form-label">End Date *</label>
              <input type="date" id="seasonEnd" name="end_date" class="form-input" required />
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

  const existingModal = document.getElementById("addSeasonModal")
  if (existingModal) {
    existingModal.remove()
  }

  document.body.insertAdjacentHTML("beforeend", modalHtml)

  const today = new Date()
  const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1)
  const endOfYear = new Date(today.getFullYear(), 11, 31)
  document.getElementById("seasonStart").value = nextMonth.toISOString().split("T")[0]
  document.getElementById("seasonEnd").value = endOfYear.toISOString().split("T")[0]

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

  const formData = new FormData(form)
  const payload = {
    name: String(formData.get("name") || "").trim(),
    start_date: String(formData.get("start_date") || ""),
    end_date: String(formData.get("end_date") || ""),
  }

  if (!payload.name || !payload.start_date || !payload.end_date) {
    window.EAFC.showAlert("Please fill in all required fields", "warning")
    return
  }

  if (new Date(payload.end_date) <= new Date(payload.start_date)) {
    window.EAFC.showAlert("End date must be after start date", "warning")
    return
  }

  btn.disabled = true
  btnText.textContent = "Adding..."
  spinner.classList.remove("hidden")

  try {
    const data = await window.EAFC.apiCall("/seasons", {
      method: "POST",
      body: JSON.stringify(payload),
    })

    if (!data.success) {
      throw new Error(data.error || "Failed to add season")
    }

    window.EAFC.showAlert(data.message || "Season added successfully", "success")
    closeAddSeasonModal()
    loadSeasons()

    if (window.loadOverviewStats) {
      window.loadOverviewStats()
    }
  } catch (error) {
    console.error("Failed to add season:", error)
    window.EAFC.showAlert(error.message, "error")
  } finally {
    btn.disabled = false
    btnText.textContent = "Add Season"
    spinner.classList.add("hidden")
  }
}

async function viewSeasonReport(seasonId) {
  const modalHtml = `
    <div id="viewSeasonModal" class="modal show">
      <div class="modal-content" style="max-width: 860px;">
        <div class="modal-header">
          <h3 class="modal-title">Season Report</h3>
          <button class="modal-close" onclick="closeViewSeasonModal()">&times;</button>
        </div>
        <div class="modal-body">
          <div id="seasonReportContent">
            <div class="text-center py-8">
              <div class="spinner mx-auto mb-4"></div>
              <p class="text-gray-600">Loading report...</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `

  const existingModal = document.getElementById("viewSeasonModal")
  if (existingModal) {
    existingModal.remove()
  }

  document.body.insertAdjacentHTML("beforeend", modalHtml)

  try {
    const data = await window.EAFC.apiCall(`/reports/season?season_id=${seasonId}`)
    if (!data.success || !data.report) {
      throw new Error(data.error || "Failed to load season report")
    }

    const report = data.report
    const standings = report.standings || []
    const container = document.getElementById("seasonReportContent")

    container.innerHTML = `
      <div class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div class="card"><div class="card-body"><p class="text-sm text-gray-600">Winner</p><p class="font-semibold">${escapeHtml(report.winner || "N/A")}</p></div></div>
          <div class="card"><div class="card-body"><p class="text-sm text-gray-600">Top Scorer</p><p class="font-semibold">${escapeHtml(report.top_scorer || "N/A")}</p></div></div>
          <div class="card"><div class="card-body"><p class="text-sm text-gray-600">Most Clean Sheets</p><p class="font-semibold">${escapeHtml(report.most_clean_sheets || "N/A")}</p></div></div>
        </div>

        <div class="overflow-auto">
          <table class="table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Gamer Tag</th>
                <th>Points</th>
                <th>W-D-L</th>
                <th>GF</th>
                <th>GA</th>
                <th>GD</th>
              </tr>
            </thead>
            <tbody>
              ${standings
                .map(
                  (row, idx) => `
                <tr>
                  <td>${idx + 1}</td>
                  <td class="font-semibold">${escapeHtml(row.gamer_tag)}</td>
                  <td class="font-semibold text-green">${Number(row.points || 0)}</td>
                  <td>${Number(row.wins || 0)}-${Number(row.draws || 0)}-${Number(row.losses || 0)}</td>
                  <td>${Number(row.goals_for || 0)}</td>
                  <td>${Number(row.goals_against || 0)}</td>
                  <td>${Number(row.goal_diff || 0)}</td>
                </tr>
              `,
                )
                .join("")}
            </tbody>
          </table>
        </div>
      </div>
    `
  } catch (error) {
    console.error("Failed to load report:", error)
    document.getElementById("seasonReportContent").innerHTML = `
      <div class="text-center py-8">
        <div class="text-red mb-4"><span class="text-4xl">⚠️</span></div>
        <h3 class="text-lg font-semibold text-red mb-2">Failed to Load Report</h3>
        <p class="text-gray-600">${escapeHtml(error.message)}</p>
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

function setupSeasonModals() {
  // Modals are created dynamically.
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

window.loadSeasons = loadSeasons
window.openAddSeasonModal = openAddSeasonModal
window.closeAddSeasonModal = closeAddSeasonModal
window.submitAddSeason = submitAddSeason
window.viewSeasonReport = viewSeasonReport
window.closeViewSeasonModal = closeViewSeasonModal
