// Admin login functionality
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm")
  const loginBtn = document.getElementById("loginBtn")
  const loginText = document.getElementById("loginText")
  const loginSpinner = document.getElementById("loginSpinner")
  const successMessage = document.getElementById("successMessage")
  const togglePassword = document.getElementById("togglePassword")
  const passwordInput = document.getElementById("password")
  const eyeIcon = document.getElementById("eyeIcon")

  // Check if already logged in
  if (window.EAFC && window.EAFC.isLoggedIn && window.EAFC.isLoggedIn()) {
    window.location.href = "dashboard.html"
    return
  }

  // Password visibility toggle
  togglePassword.addEventListener("click", () => {
    const type = passwordInput.getAttribute("type") === "password" ? "text" : "password"
    passwordInput.setAttribute("type", type)
    eyeIcon.textContent = type === "password" ? "👁️" : "🙈"
  })

  // Form submission
  form.addEventListener("submit", async (e) => {
    e.preventDefault()

    // Clear previous errors
    if (window.EAFC && window.EAFC.clearFormErrors) {
      window.EAFC.clearFormErrors("loginForm")
    }

    // Get form data
    const formData = new FormData(form)
    const loginData = {
      username: formData.get("username").trim(),
      password: formData.get("password"),
    }

    // Basic validation
    if (!loginData.username || !loginData.password) {
      showAlert("Please enter both username and password", "error")
      return
    }

    // Show loading state
    loginBtn.disabled = true
    loginText.textContent = "Signing In..."
    loginSpinner.classList.remove("hidden")

    try {
      const response = await fetch("../api/admin/login.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(loginData),
      })

      const result = await response.json()

      if (result.success) {
        // Store session
        if (window.EAFC && window.EAFC.setSession) {
          window.EAFC.setSession("admin_logged_in", true)
          window.EAFC.setSession("admin_username", loginData.username)
          window.EAFC.setSession("login_time", new Date().toISOString())
        }

        // Show success message
        form.parentElement.parentElement.classList.add("hidden")
        successMessage.classList.remove("hidden")

        // Redirect after delay
        setTimeout(() => {
          window.location.href = "dashboard.html"
        }, 2000)
      } else {
        showAlert(result.error || "Invalid username or password", "error")

        // Clear password field on failed login
        passwordInput.value = ""
        passwordInput.focus()
      }
    } catch (error) {
      console.error("Login error:", error)
      showAlert("Network or server error. Please try again later.", "error")
    } finally {
      // Reset button state
      loginBtn.disabled = false
      loginText.textContent = "Sign In"
      loginSpinner.classList.add("hidden")
    }
  })

  // Auto-focus username field
  document.getElementById("username").focus()

  // Handle Enter key in form fields
  form.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault()
      form.dispatchEvent(new Event("submit"))
    }
  })

  // Show alert function
  function showAlert(message, type = "info") {
    if (window.EAFC && window.EAFC.showAlert) {
      window.EAFC.showAlert(message, type, "alerts")
    } else {
      // Fallback alert
      const alertDiv = document.createElement("div")
      alertDiv.className = `alert alert-${type}`
      alertDiv.innerHTML = `
                ${message}
                <button class="modal-close" onclick="this.parentElement.remove()" style="float: right;">&times;</button>
            `

      const alertsContainer = document.getElementById("alerts")
      if (alertsContainer) {
        alertsContainer.appendChild(alertDiv)

        // Auto-remove after 5 seconds
        setTimeout(() => {
          if (alertDiv.parentElement) {
            alertDiv.remove()
          }
        }, 5000)
      }
    }
  }

  // Security: Clear form on page unload
  window.addEventListener("beforeunload", () => {
    form.reset()
  })

  // Security: Disable right-click context menu
  document.addEventListener("contextmenu", (e) => {
    e.preventDefault()
  })

  // Security: Disable F12 and other dev tools shortcuts
  document.addEventListener("keydown", (e) => {
    if (
      e.key === "F12" ||
      (e.ctrlKey && e.shiftKey && e.key === "I") ||
      (e.ctrlKey && e.shiftKey && e.key === "C") ||
      (e.ctrlKey && e.key === "U")
    ) {
      e.preventDefault()
    }
  })
})

// Session timeout warning (15 minutes)
let sessionTimeout
function resetSessionTimeout() {
  clearTimeout(sessionTimeout)
  sessionTimeout = setTimeout(
    () => {
      alert("Your session will expire in 5 minutes due to inactivity.")

      // Auto-logout after 20 minutes total
      setTimeout(
        () => {
          if (window.EAFC && window.EAFC.logout) {
            window.EAFC.logout()
          } else {
            window.location.href = "login.html"
          }
        },
        5 * 60 * 1000,
      ) // 5 more minutes
    },
    15 * 60 * 1000,
  ) // 15 minutes
}

// Reset timeout on user activity
document.addEventListener("click", resetSessionTimeout)
document.addEventListener("keypress", resetSessionTimeout)
document.addEventListener("mousemove", resetSessionTimeout)

// Start session timeout
resetSessionTimeout()
