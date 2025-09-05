// Registration page functionality
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("registrationForm")
  const submitBtn = document.getElementById("submitBtn")
  const submitText = document.getElementById("submitText")
  const submitSpinner = document.getElementById("submitSpinner")
  const successMessage = document.getElementById("successMessage")

  const EAFC = {
    clearFormErrors: (formId) => {
      // Implementation for clearing form errors
    },
    getFormData: (formId) => {
      // Implementation for getting form data
    },
    validateForm: (formData, validationRules) => {
      // Implementation for validating form data
    },
    showFormErrors: (errors, formId) => {
      // Implementation for showing form errors
    },
    showAlert: (message, type) => {
      // Implementation for showing alert
    },
    apiCall: async (url, options) => {
      // Implementation for making API call
    },
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault()

    // Clear previous errors
    EAFC.clearFormErrors("registrationForm")

    // Get form data
    const formData = EAFC.getFormData("registrationForm")

    // Validate form
    const validationRules = {
      gamer_tag: {
        required: true,
        minLength: 3,
        maxLength: 50,
        label: "Gamer Tag",
      },
      phone: {
        required: true,
        minLength: 10,
        maxLength: 20,
        label: "Phone Number",
        pattern: /^[\d\s\-+$$$$]+$/,
        message: "Phone number can only contain numbers, spaces, dashes, plus signs, and parentheses",
      },
    }

    const errors = EAFC.validateForm(formData, validationRules)

    if (Object.keys(errors).length > 0) {
      EAFC.showFormErrors(errors, "registrationForm")
      return
    }

    // Show loading state
    submitBtn.disabled = true
    submitText.textContent = "Registering..."
    submitSpinner.classList.remove("hidden")

    try {
      const response = await EAFC.apiCall("/api/players/add_player.php", {
        method: "POST",
        body: JSON.stringify({
          gamer_tag: formData.gamer_tag.trim(),
          phone: formData.phone.trim(),
        }),
      })

      if (response.success) {
        // Hide form and show success message
        form.parentElement.parentElement.classList.add("hidden")
        successMessage.classList.remove("hidden")

        // Scroll to success message
        successMessage.scrollIntoView({ behavior: "smooth" })
      } else {
        EAFC.showAlert(response.error || "Registration failed. Please try again.", "error")
      }
    } catch (error) {
      console.error("Registration error:", error)
      EAFC.showAlert("Network or server error. Please try again later.", "error")
    } finally {
      // Reset button state
      submitBtn.disabled = false
      submitText.textContent = "Register Now"
      submitSpinner.classList.add("hidden")
    }
  })

  // Real-time validation
  const gamerTagInput = document.getElementById("gamer_tag")
  const phoneInput = document.getElementById("phone")

  gamerTagInput.addEventListener("input", () => {
    const value = gamerTagInput.value.trim()
    if (value.length > 0 && value.length < 3) {
      gamerTagInput.style.borderColor = "var(--primary-red)"
    } else {
      gamerTagInput.style.borderColor = ""
    }
  })

  phoneInput.addEventListener("input", () => {
    const value = phoneInput.value.trim()
    const phonePattern = /^[\d\s\-+$$$$]+$/
    if (value.length > 0 && !phonePattern.test(value)) {
      phoneInput.style.borderColor = "var(--primary-red)"
    } else {
      phoneInput.style.borderColor = ""
    }
  })
})
