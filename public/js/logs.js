// System Logs Management for EAFC League Admin Dashboard

// Initialize logs management when loaded
document.addEventListener("DOMContentLoaded", () => {
  // Only initialize if we're on the dashboard page
  if (document.getElementById("logsContent")) {
    initLogsManagement()
  }
})

function initLogsManagement() {
  // Setup is handled when logs are loaded
}

// Load system logs with pagination
async function loadLogs(page = 1) {
  const container = document.getElementById("logsContent")
  if (!container) return

  const limit = 50

  // Show loading state
  container.innerHTML = `
    <div class="text-center py-8">
      <div class="spinner mx-auto mb-4"></div>
      <p class="text-gray-600">Loading system logs...</p>
    </div>
  `

  try {
    const response = await fetch(`../api/systemlogs/getlogs.php?page=${page}&limit=${limit}`)

    if (!response.ok) {
      throw new Error("Failed to load logs")
    }

    const data = await response.json()
    const logs = data.logs || []

    if (logs.length === 0 && page === 1) {
      renderEmptyLogs()
      return
    }

    renderLogsTable(logs, data)
  } catch (error) {
    console.error("Failed to load logs:", error)
    container.innerHTML = `
      <div class="card">
        <div class="card-body text-center">
          <div class="text-red mb-4">
            <span class="text-4xl">⚠️</span>
          </div>
          <h3 class="text-lg font-semibold text-red mb-2">Failed to Load Logs</h3>
          <p class="text-gray-600 mb-4">${error.message}</p>
          <button onclick="loadLogs(1)" class="btn btn-primary">Try Again</button>
        </div>
      </div>
    `
  }
}

function renderEmptyLogs() {
  const container = document.getElementById("logsContent")
  container.innerHTML = `
    <div class="card">
      <div class="card-body text-center">
        <div class="text-gray-400 mb-4">
          <span class="text-4xl">📋</span>
        </div>
        <h3 class="text-lg font-semibold text-gray-700 mb-2">No Logs Available</h3>
        <p class="text-gray-600">System logs will appear here as actions are performed.</p>
      </div>
    </div>
  `
}

function renderLogsTable(logs, data) {
  const container = document.getElementById("logsContent")

  const html = `
    <div class="card">
      <div class="card-header">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold">System Logs</h3>
          <div class="flex gap-2">
            <button onclick="loadLogs(${data.page || 1})" class="btn btn-outline btn-sm">
              🔄 Refresh
            </button>
          </div>
        </div>
      </div>
      <div class="card-body p-0">
        <div class="overflow-auto">
          <table class="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Admin</th>
                <th>Action</th>
                <th>Target</th>
                <th>Status</th>
                <th>Details</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              ${logs.map((log) => renderLogRow(log)).join("")}
            </tbody>
          </table>
        </div>
      </div>
      ${renderPagination(data)}
    </div>
  `

  container.innerHTML = html
}

function renderLogRow(log) {
  const statusBadge = getLogStatusBadge(log.status)
  const adminText = log.admin_id ? `Admin #${log.admin_id}` : "System"

  return `
    <tr>
      <td class="font-mono text-sm">#${log.id}</td>
      <td class="text-sm">${adminText}</td>
      <td class="font-medium">${escapeHtml(log.action)}</td>
      <td class="text-sm">
        ${log.target_table ? `${log.target_table}` : "N/A"}
        ${log.target_id ? ` #${log.target_id}` : ""}
      </td>
      <td>${statusBadge}</td>
      <td class="text-sm max-w-xs truncate" title="${escapeHtml(log.details)}">
        ${escapeHtml(log.details)}
      </td>
      <td class="text-sm text-gray-600">${formatDateTime(log.created_at)}</td>
    </tr>
  `
}

function getLogStatusBadge(status) {
  switch (status) {
    case "success":
      return '<span class="badge badge-success">Success</span>'
    case "error":
      return '<span class="badge badge-danger">Error</span>'
    case "warning":
      return '<span class="badge badge-warning">Warning</span>'
    case "info":
      return '<span class="badge badge-info">Info</span>'
    default:
      return '<span class="badge badge-info">Unknown</span>'
  }
}

function renderPagination(data) {
  if (!data.total_pages || data.total_pages <= 1) {
    return ""
  }

  const currentPage = data.page || 1
  const totalPages = data.total_pages

  return `
    <div class="card-footer">
      <div class="flex items-center justify-between">
        <div class="text-sm text-gray-600">
          Page ${currentPage} of ${totalPages}
        </div>
        <div class="flex gap-2">
          <button 
            onclick="loadLogs(${currentPage - 1})"
            class="btn btn-outline btn-sm"
            ${currentPage <= 1 ? "disabled" : ""}
          >
            Previous
          </button>
          <button 
            onclick="loadLogs(${currentPage + 1})"
            class="btn btn-outline btn-sm"
            ${currentPage >= totalPages ? "disabled" : ""}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  `
}

// Utility functions
function escapeHtml(text) {
  if (!text) return "N/A"
  const div = document.createElement("div")
  div.textContent = text
  return div.innerHTML
}

function formatDateTime(dateString) {
  if (!dateString) return "N/A"
  const date = new Date(dateString)
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

// Export functions for global access
window.loadLogs = loadLogs
