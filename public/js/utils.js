// Utility functions for EAFC League Management System

// API base URL - adjust this to match your PHP backend
const API_BASE_URL = "/api"

// Utility function to make API calls
async function apiCall(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`
  const config = {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  }

  try {
    const response = await fetch(url, config)

    const contentType = response.headers.get("content-type")

    if (!response.ok) {
      // If it's an HTML error page, throw a more helpful error
      if (contentType && contentType.includes("text/html")) {
        throw new Error(`API endpoint not found: ${url}. Please check your PHP backend is running.`)
      }
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    // Check if response is actually JSON
    if (!contentType || !contentType.includes("application/json")) {
      const text = await response.text()
      // If it looks like HTML, it's probably an error page
      if (text.trim().startsWith("<!DOCTYPE") || text.trim().startsWith("<html")) {
        throw new Error(`API returned HTML instead of JSON. Check if ${url} exists and returns valid JSON.`)
      }
      // Try to parse as JSON anyway
      try {
        return JSON.parse(text)
      } catch (parseError) {
        throw new Error(`Invalid JSON response from ${url}: ${text.substring(0, 100)}...`)
      }
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error("API call failed:", error)
    throw error
  }
}

// Show loading spinner
function showLoading(elementId) {
  const element = document.getElementById(elementId)
  if (element) {
    element.innerHTML = '<div class="flex justify-center p-8"><div class="spinner"></div></div>'
  }
}

// Hide loading spinner
function hideLoading(elementId) {
  const element = document.getElementById(elementId)
  if (element) {
    element.innerHTML = ""
  }
}

// Show alert message
function showAlert(message, type = "info", containerId = "alerts") {
  const container = document.getElementById(containerId)
  if (!container) return

  const alertDiv = document.createElement("div")
  alertDiv.className = `alert alert-${type}`
  alertDiv.innerHTML = `
        ${message}
        <button class="modal-close" onclick="this.parentElement.remove()" style="float: right;">&times;</button>
    `

  container.appendChild(alertDiv)

  // Auto-remove after 5 seconds
  setTimeout(() => {
    if (alertDiv.parentElement) {
      alertDiv.remove()
    }
  }, 5000)
}

// Format date for display
function formatDate(dateString) {
  if (!dateString) return "N/A"
  const date = new Date(dateString)
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

// Format datetime for display
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

// Validate email format
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Validate form data
function validateForm(formData, rules) {
  const errors = {}

  for (const [field, rule] of Object.entries(rules)) {
    const value = formData[field]

    if (rule.required && (!value || value.trim() === "")) {
      errors[field] = `${rule.label || field} is required`
      continue
    }

    if (value && rule.minLength && value.length < rule.minLength) {
      errors[field] = `${rule.label || field} must be at least ${rule.minLength} characters`
      continue
    }

    if (value && rule.maxLength && value.length > rule.maxLength) {
      errors[field] = `${rule.label || field} must be no more than ${rule.maxLength} characters`
      continue
    }

    if (value && rule.email && !isValidEmail(value)) {
      errors[field] = `${rule.label || field} must be a valid email address`
      continue
    }

    if (value && rule.pattern && !rule.pattern.test(value)) {
      errors[field] = rule.message || `${rule.label || field} format is invalid`
      continue
    }
  }

  return errors
}

// Show form validation errors
function showFormErrors(errors, formId) {
  // Clear existing errors
  const form = document.getElementById(formId)
  if (!form) return

  const existingErrors = form.querySelectorAll(".error-message")
  existingErrors.forEach((error) => error.remove())

  // Show new errors
  for (const [field, message] of Object.entries(errors)) {
    const input = form.querySelector(`[name="${field}"]`)
    if (input) {
      const errorDiv = document.createElement("div")
      errorDiv.className = "error-message text-red text-sm mt-1"
      errorDiv.textContent = message
      input.parentElement.appendChild(errorDiv)
      input.style.borderColor = "var(--primary-red)"
    }
  }
}

// Clear form validation errors
function clearFormErrors(formId) {
  const form = document.getElementById(formId)
  if (!form) return

  const errors = form.querySelectorAll(".error-message")
  errors.forEach((error) => error.remove())

  const inputs = form.querySelectorAll("input, select, textarea")
  inputs.forEach((input) => {
    input.style.borderColor = ""
  })
}

// Get form data as object
function getFormData(formId) {
  const form = document.getElementById(formId)
  if (!form) return {}

  const formData = new FormData(form)
  const data = {}

  for (const [key, value] of formData.entries()) {
    data[key] = value
  }

  return data
}

// Modal utilities
function openModal(modalId) {
  const modal = document.getElementById(modalId)
  if (modal) {
    modal.classList.add("show")
    document.body.style.overflow = "hidden"
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId)
  if (modal) {
    modal.classList.remove("show")
    document.body.style.overflow = ""
  }
}

// Close modal when clicking outside
document.addEventListener("click", (e) => {
  if (e.target.classList.contains("modal")) {
    closeModal(e.target.id)
  }
})

// Close modal with Escape key
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    const openModal = document.querySelector(".modal.show")
    if (openModal) {
      closeModal(openModal.id)
    }
  }
})

// Debounce function for search inputs
function debounce(func, wait) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

// Local storage utilities
function saveToStorage(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch (error) {
    console.error("Failed to save to localStorage:", error)
  }
}

function getFromStorage(key) {
  try {
    const data = localStorage.getItem(key)
    return data ? JSON.parse(data) : null
  } catch (error) {
    console.error("Failed to get from localStorage:", error)
    return null
  }
}

function removeFromStorage(key) {
  try {
    localStorage.removeItem(key)
  } catch (error) {
    console.error("Failed to remove from localStorage:", error)
  }
}

// Session management
function setSession(key, value) {
  saveToStorage(`session_${key}`, value)
}

function getSession(key) {
  return getFromStorage(`session_${key}`)
}

function clearSession() {
  const keys = Object.keys(localStorage)
  keys.forEach((key) => {
    if (key.startsWith("session_")) {
      localStorage.removeItem(key)
    }
  })
}

// Check if user is logged in (admin)
function isLoggedIn() {
  return getSession("admin_logged_in") === true
}

// Redirect to login if not authenticated
function requireAuth() {
  if (!isLoggedIn()) {
    window.location.href = "login.html"
    return false
  }
  return true
}

// Logout function
function logout() {
  clearSession()
  window.location.href = "login.html"
}

// Initialize page
function initPage() {
  // Add logout functionality to logout buttons
  const logoutBtns = document.querySelectorAll(".logout-btn")
  logoutBtns.forEach((btn) => {
    btn.addEventListener("click", logout)
  })

  // Add modal close functionality
  const modalCloses = document.querySelectorAll(".modal-close")
  modalCloses.forEach((btn) => {
    btn.addEventListener("click", function () {
      const modal = this.closest(".modal")
      if (modal) {
        closeModal(modal.id)
      }
    })
  })
}

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", initPage)

// Export functions for use in other files
window.EAFC = {
  apiCall,
  showLoading,
  hideLoading,
  showAlert,
  formatDate,
  formatDateTime,
  validateForm,
  showFormErrors,
  clearFormErrors,
  getFormData,
  openModal,
  closeModal,
  debounce,
  saveToStorage,
  getFromStorage,
  removeFromStorage,
  setSession,
  getSession,
  clearSession,
  isLoggedIn,
  requireAuth,
  logout,
}
