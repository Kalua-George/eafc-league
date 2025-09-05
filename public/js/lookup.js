// Player lookup functionality
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("lookupForm")
  const lookupBtn = document.getElementById("lookupBtn")
  const lookupText = document.getElementById("lookupText")
  const lookupSpinner = document.getElementById("lookupSpinner")
  const playerInfo = document.getElementById("playerInfo")
  const statsDiv = document.getElementById("stats")
  const notFoundMessage = document.getElementById("notFoundMessage")

  // Declare EAFC variable
  const EAFC = {
    showAlert: (message, type) => {
      alert(`${type.toUpperCase()}: ${message}`)
    },
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault()

    const identifier = form.identifier.value.trim()

    if (!identifier) {
      EAFC.showAlert("Please enter a gamer tag or phone number", "warning")
      return
    }

    // Show loading state
    lookupBtn.disabled = true
    lookupText.textContent = "Searching..."
    lookupSpinner.classList.remove("hidden")

    // Hide previous results
    playerInfo.classList.add("hidden")
    notFoundMessage.classList.add("hidden")

    try {
      const response = await fetch(`../api/players/get_player.php?identifier=${encodeURIComponent(identifier)}`)
      const result = await response.json()

      if (result.error) {
        // Player not found
        notFoundMessage.classList.remove("hidden")
      } else {
        // Display player information
        displayPlayerInfo(result)
        playerInfo.classList.remove("hidden")
      }
    } catch (error) {
      console.error("Lookup error:", error)
      EAFC.showAlert("Network or server error. Please try again later.", "error")
    } finally {
      // Reset button state
      lookupBtn.disabled = false
      lookupText.textContent = "Check Status"
      lookupSpinner.classList.add("hidden")
    }
  })

  function displayPlayerInfo(player) {
    // Basic info
    document.getElementById("gamerTag").textContent = player.gamer_tag || "N/A"
    document.getElementById("phone").textContent = player.phone || "N/A"

    // Status badge
    const statusElement = document.getElementById("status")
    const statusContainer = document.getElementById("statusMessage")

    statusElement.textContent = capitalizeFirst(player.status || "unknown")

    // Style status badge and message based on status
    statusElement.className = "badge"

    switch (player.status) {
      case "approved":
        statusElement.classList.add("badge-success")
        statusContainer.className = "mt-4 p-4 rounded-md bg-green bg-opacity-10 border border-green"
        statusContainer.innerHTML = `
                    <div class="flex items-center gap-2">
                        <span class="text-green text-lg">✓</span>
                        <div>
                            <p class="font-medium text-green">Registration Approved</p>
                            <p class="text-sm text-gray-600">You are approved to participate in league matches.</p>
                        </div>
                    </div>
                `
        break

      case "pending":
        statusElement.classList.add("badge-warning")
        statusContainer.className = "mt-4 p-4 rounded-md bg-yellow-50 border border-yellow-200"
        statusContainer.innerHTML = `
                    <div class="flex items-center gap-2">
                        <span class="text-yellow-600 text-lg">⏳</span>
                        <div>
                            <p class="font-medium text-yellow-700">Registration Pending</p>
                            <p class="text-sm text-gray-600">Your registration is under review. Please wait for admin approval.</p>
                        </div>
                    </div>
                `
        break

      case "rejected":
        statusElement.classList.add("badge-danger")
        statusContainer.className = "mt-4 p-4 rounded-md bg-red bg-opacity-10 border border-red"
        statusContainer.innerHTML = `
                    <div class="flex items-center gap-2">
                        <span class="text-red text-lg">✗</span>
                        <div>
                            <p class="font-medium text-red">Registration Rejected</p>
                            <p class="text-sm text-gray-600">Your registration was not approved. Contact admin for more information.</p>
                        </div>
                    </div>
                `
        break

      default:
        statusElement.classList.add("badge-info")
        statusContainer.className = "mt-4 p-4 rounded-md bg-gray-50 border border-gray-200"
        statusContainer.innerHTML = `
                    <div class="flex items-center gap-2">
                        <span class="text-gray-500 text-lg">?</span>
                        <div>
                            <p class="font-medium text-gray-700">Status Unknown</p>
                            <p class="text-sm text-gray-600">Contact admin for status information.</p>
                        </div>
                    </div>
                `
    }

    // Show stats only if approved
    if (player.status === "approved") {
      displayPlayerStats(player)
      statsDiv.classList.remove("hidden")
    } else {
      statsDiv.classList.add("hidden")
    }
  }

  function displayPlayerStats(player) {
    // Points and match record
    document.getElementById("points").textContent = player.points || 0
    document.getElementById("wins").textContent = player.wins || 0
    document.getElementById("draws").textContent = player.draws || 0
    document.getElementById("losses").textContent = player.losses || 0

    // Goals
    document.getElementById("gf").textContent = player.goals_for || 0
    document.getElementById("ga").textContent = player.goals_against || 0

    // Goal difference with styling
    const goalDiff = (player.goals_for || 0) - (player.goals_against || 0)
    const gdElement = document.getElementById("gd")
    gdElement.textContent = goalDiff > 0 ? `+${goalDiff}` : goalDiff

    // Style goal difference
    gdElement.className = "text-xl font-bold"
    if (goalDiff > 0) {
      gdElement.classList.add("text-green")
    } else if (goalDiff < 0) {
      gdElement.classList.add("text-red")
    } else {
      gdElement.classList.add("text-gray-600")
    }
  }

  function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1)
  }
})
