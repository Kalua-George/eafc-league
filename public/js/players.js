// Player Management System for EAFC League Admin Dashboard

document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("playersContent")) {
    initPlayerManagement()
  }
})

function initPlayerManagement() {
  setupAddPlayerForm()
  setupPlayerModals()
}

async function loadPlayers() {
  const container = document.getElementById("playersContent")
  if (!container) return

  container.innerHTML = `
    <div class="text-center py-8">
      <div class="spinner mx-auto mb-4"></div>
      <p class="text-gray-600">Loading players...</p>
    </div>
  `

  try {
    const data = await window.EAFC.apiCall("/players")

    if (!data.success) {
      throw new Error(data.error || "Failed to load players")
    }

    renderPlayersTable(data.players || [])
  } catch (error) {
    console.error("Failed to load players:", error)
    container.innerHTML = `
      <div class="card">
        <div class="card-body text-center">
          <div class="text-red mb-4">
            <span class="text-4xl">⚠️</span>
          </div>
          <h3 class="text-lg font-semibold text-red mb-2">Failed to Load Players</h3>
          <p class="text-gray-600 mb-4">${escapeHtml(error.message)}</p>
          <button onclick="loadPlayers()" class="btn btn-primary">Try Again</button>
        </div>
      </div>
    `
  }
}

function renderPlayersTable(players) {
  const container = document.getElementById("playersContent")

  if (!players.length) {
    container.innerHTML = `
      <div class="card">
        <div class="card-body text-center">
          <div class="text-gray-400 mb-4">
            <span class="text-4xl">👥</span>
          </div>
          <h3 class="text-lg font-semibold text-gray-700 mb-2">No Players Found</h3>
          <p class="text-gray-600 mb-4">No players have registered yet.</p>
          <button onclick="openAddPlayerModal()" class="btn btn-primary">Add First Player</button>
        </div>
      </div>
    `
    return
  }

  container.innerHTML = `
    <div class="flex flex-col gap-6">
      <div class="card">
        <div class="card-header">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold">Add New Player</h3>
            <button onclick="openAddPlayerModal()" class="btn btn-primary">+ Add Player</button>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold">Players (${players.length})</h3>
            <button onclick="loadPlayers()" class="btn btn-outline btn-sm">🔄 Refresh</button>
          </div>
        </div>
        <div class="card-body p-0">
          <div class="overflow-auto">
            <table class="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Gamer Tag</th>
                  <th>Phone</th>
                  <th>Status</th>
                  <th>Date of Registration</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${players.map((player) => renderPlayerRow(player)).join("")}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `
}

function renderPlayerRow(player) {
  const created = player.created_at ? formatDate(player.created_at) : "N/A"

  return `
    <tr id="player-${player.id}">
      <td class="font-mono text-sm">#${player.id}</td>
      <td class="font-semibold">${escapeHtml(player.gamer_tag)}</td>
      <td class="font-mono text-sm">${escapeHtml(player.phone)}</td>
      <td>${getStatusBadge(player.status)}</td>
      <td class="text-sm text-gray-600">${created}</td>
      <td>
        <div class="flex gap-2">
          <button onclick="editPlayer(${player.id})" class="btn btn-outline btn-sm">Edit</button>
          ${renderStatusActions(player)}
        </div>
      </td>
    </tr>
  `
}

function getStatusBadge(status) {
  switch (status) {
    case "approved":
      return '<span class="badge badge-success">Approved</span>'
    case "pending":
      return '<span class="badge badge-warning">Pending</span>'
    case "rejected":
      return '<span class="badge badge-danger">Rejected</span>'
    default:
      return '<span class="badge badge-info">Unknown</span>'
  }
}

function renderStatusActions(player) {
  if (player.status !== "pending") {
    return ""
  }

  return `
    <button onclick="updatePlayerStatus(${player.id}, 'approve')" class="btn btn-primary btn-sm">Approve</button>
    <button onclick="updatePlayerStatus(${player.id}, 'reject')" class="btn btn-danger btn-sm">Reject</button>
  `
}

async function updatePlayerStatus(playerId, action) {
  const actionText = action === "approve" ? "approve" : "reject"

  if (!confirm(`Are you sure you want to ${actionText} this player?`)) {
    return
  }

  try {
    const data = await window.EAFC.apiCall("/players/status", {
      method: "POST",
      body: JSON.stringify({ player_id: playerId, action }),
    })

    if (!data.success) {
      throw new Error(data.error || `Failed to ${actionText} player`)
    }

    window.EAFC.showAlert(data.message || `Player ${actionText}d successfully`, "success")
    updatePlayerRowStatus(playerId, data.status || (action === "approve" ? "approved" : "rejected"))

    if (window.loadOverviewStats) {
      window.loadOverviewStats()
    }
  } catch (error) {
    console.error(`Failed to ${actionText} player:`, error)
    window.EAFC.showAlert(error.message, "error")
  }
}

function updatePlayerRowStatus(playerId, newStatus) {
  const row = document.getElementById(`player-${playerId}`)
  if (!row) return

  row.children[3].innerHTML = getStatusBadge(newStatus)

  const actionsCell = row.children[5]
  const editButton = actionsCell.querySelector('button[onclick*="editPlayer"]')
  actionsCell.innerHTML = `<div class="flex gap-2">${editButton ? editButton.outerHTML : ""}</div>`
}

function setupAddPlayerForm() {
  // Modal created dynamically.
}

function openAddPlayerModal() {
  const modalHtml = `
    <div id="addPlayerModal" class="modal show">
      <div class="modal-content">
        <div class="modal-header">
          <h3 class="modal-title">Add New Player</h3>
          <button class="modal-close" onclick="closeAddPlayerModal()">&times;</button>
        </div>
        <div class="modal-body">
          <form id="addPlayerForm">
            <div class="form-group">
              <label for="addGamerTag" class="form-label">Gamer Tag *</label>
              <input type="text" id="addGamerTag" name="gamer_tag" class="form-input" required maxlength="50" />
            </div>
            <div class="form-group">
              <label for="addPhone" class="form-label">Phone Number *</label>
              <input type="tel" id="addPhone" name="phone" class="form-input" required maxlength="20" />
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button onclick="closeAddPlayerModal()" class="btn btn-outline">Cancel</button>
          <button onclick="submitAddPlayer()" class="btn btn-primary" id="addPlayerBtn">
            <span id="addPlayerText">Add Player</span>
            <div id="addPlayerSpinner" class="spinner hidden"></div>
          </button>
        </div>
      </div>
    </div>
  `

  const existingModal = document.getElementById("addPlayerModal")
  if (existingModal) {
    existingModal.remove()
  }

  document.body.insertAdjacentHTML("beforeend", modalHtml)
  document.getElementById("addGamerTag").focus()
}

function closeAddPlayerModal() {
  const modal = document.getElementById("addPlayerModal")
  if (modal) {
    modal.remove()
  }
}

async function submitAddPlayer() {
  const form = document.getElementById("addPlayerForm")
  const btn = document.getElementById("addPlayerBtn")
  const btnText = document.getElementById("addPlayerText")
  const spinner = document.getElementById("addPlayerSpinner")

  const formData = new FormData(form)
  const gamerTag = String(formData.get("gamer_tag") || "").trim()
  const phone = String(formData.get("phone") || "").trim()

  if (!gamerTag || !phone) {
    window.EAFC.showAlert("Please fill in all required fields", "warning")
    return
  }

  btn.disabled = true
  btnText.textContent = "Adding..."
  spinner.classList.remove("hidden")

  try {
    const data = await window.EAFC.apiCall("/players", {
      method: "POST",
      body: JSON.stringify({
        gamer_tag: gamerTag,
        phone,
        admin_action: true,
      }),
    })

    if (!data.success) {
      throw new Error(data.error || "Failed to add player")
    }

    window.EAFC.showAlert(data.message || "Player added successfully", "success")
    closeAddPlayerModal()
    loadPlayers()

    if (window.loadOverviewStats) {
      window.loadOverviewStats()
    }
  } catch (error) {
    console.error("Failed to add player:", error)
    window.EAFC.showAlert(error.message, "error")
  } finally {
    btn.disabled = false
    btnText.textContent = "Add Player"
    spinner.classList.add("hidden")
  }
}

function editPlayer(playerId) {
  const row = document.getElementById(`player-${playerId}`)
  if (!row) return

  const gamerTag = row.children[1].textContent
  const phone = row.children[2].textContent

  const modalHtml = `
    <div id="editPlayerModal" class="modal show">
      <div class="modal-content">
        <div class="modal-header">
          <h3 class="modal-title">Edit Player</h3>
          <button class="modal-close" onclick="closeEditPlayerModal()">&times;</button>
        </div>
        <div class="modal-body">
          <form id="editPlayerForm">
            <input type="hidden" id="editPlayerId" value="${playerId}">
            <div class="form-group">
              <label for="editGamerTag" class="form-label">Gamer Tag *</label>
              <input type="text" id="editGamerTag" name="gamer_tag" class="form-input" required maxlength="50" value="${escapeHtml(gamerTag)}">
            </div>
            <div class="form-group">
              <label for="editPhone" class="form-label">Phone Number *</label>
              <input type="tel" id="editPhone" name="phone" class="form-input" required maxlength="20" value="${escapeHtml(phone)}">
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button onclick="closeEditPlayerModal()" class="btn btn-outline">Cancel</button>
          <button onclick="submitEditPlayer()" class="btn btn-primary" id="editPlayerBtn">
            <span id="editPlayerText">Save Changes</span>
            <div id="editPlayerSpinner" class="spinner hidden"></div>
          </button>
        </div>
      </div>
    </div>
  `

  const existingModal = document.getElementById("editPlayerModal")
  if (existingModal) {
    existingModal.remove()
  }

  document.body.insertAdjacentHTML("beforeend", modalHtml)
  document.getElementById("editGamerTag").focus()
}

function closeEditPlayerModal() {
  const modal = document.getElementById("editPlayerModal")
  if (modal) {
    modal.remove()
  }
}

async function submitEditPlayer() {
  const btn = document.getElementById("editPlayerBtn")
  const btnText = document.getElementById("editPlayerText")
  const spinner = document.getElementById("editPlayerSpinner")

  const playerId = document.getElementById("editPlayerId").value
  const gamerTag = document.getElementById("editGamerTag").value.trim()
  const phone = document.getElementById("editPhone").value.trim()

  if (!gamerTag || !phone) {
    window.EAFC.showAlert("Please fill in all required fields", "warning")
    return
  }

  btn.disabled = true
  btnText.textContent = "Saving..."
  spinner.classList.remove("hidden")

  try {
    const data = await window.EAFC.apiCall("/players/edit", {
      method: "POST",
      body: JSON.stringify({
        player_id: Number(playerId),
        gamer_tag: gamerTag,
        phone,
      }),
    })

    if (!data.success) {
      throw new Error(data.error || "Failed to update player")
    }

    window.EAFC.showAlert(data.message || "Player updated successfully", "success")
    closeEditPlayerModal()
    loadPlayers()
  } catch (error) {
    console.error("Failed to update player:", error)
    window.EAFC.showAlert(error.message, "error")
  } finally {
    btn.disabled = false
    btnText.textContent = "Save Changes"
    spinner.classList.add("hidden")
  }
}

function setupPlayerModals() {
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

window.loadPlayers = loadPlayers
window.editPlayer = editPlayer
window.updatePlayerStatus = updatePlayerStatus
window.openAddPlayerModal = openAddPlayerModal
window.closeAddPlayerModal = closeAddPlayerModal
window.submitAddPlayer = submitAddPlayer
window.closeEditPlayerModal = closeEditPlayerModal
window.submitEditPlayer = submitEditPlayer
