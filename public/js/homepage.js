// Homepage functionality for EAFC League

document.addEventListener("DOMContentLoaded", () => {
  loadCurrentSeasonAndStats()
})

async function loadCurrentSeasonAndStats() {
  const loadingStandings = document.getElementById("standings-loading")
  const standingsTable = document.getElementById("standings-table")
  const standingsBody = standingsTable.querySelector("tbody")
  const noStandings = document.getElementById("no-standings")

  const loadingScorers = document.getElementById("scorers-loading")
  const topScorers = document.getElementById("top-scorers")
  const noScorers = document.getElementById("no-scorers")

  const loadingCleanSheets = document.getElementById("cleansheets-loading")
  const cleanSheets = document.getElementById("clean-sheets")
  const noCleanSheets = document.getElementById("no-cleansheets")

  try {
    const seasonRes = await window.EAFC.apiCall("/seasons")

    if (!seasonRes.success || !seasonRes.season) {
      setSeasonUI("No Season Found", "Inactive", "text-gray-600")
      showNoStats(
        loadingStandings,
        loadingScorers,
        loadingCleanSheets,
        noStandings,
        noScorers,
        noCleanSheets,
      )
      return
    }

    const season = seasonRes.season
    setSeasonUIForDates(season)

    const reportRes = await window.EAFC.apiCall(`/reports/season?season_id=${season.id}`)

    loadingStandings.classList.add("hidden")
    loadingScorers.classList.add("hidden")
    loadingCleanSheets.classList.add("hidden")

    if (!reportRes.success || !reportRes.report) {
      noStandings.classList.remove("hidden")
      noScorers.classList.remove("hidden")
      noCleanSheets.classList.remove("hidden")
      return
    }

    const standings = reportRes.report.standings || []
    const goalRank = reportRes.report.goal_rank || []
    const cleanSheetRank = reportRes.report.clean_sheets || []

    if (!standings.length) {
      noStandings.classList.remove("hidden")
    } else {
      standingsBody.innerHTML = ""
      standings.forEach((p, i) => {
        const gd = Number(p.goal_diff || 0)
        const gdCls = gd > 0 ? "text-green" : gd < 0 ? "text-red" : "text-gray-600"

        standingsBody.innerHTML += `
          <tr>
            <td>${i + 1}</td>
            <td>${escapeHtml(p.gamer_tag)}</td>
            <td class="text-green font-semibold">${Number(p.points || 0)}</td>
            <td>${Number(p.wins || 0)}</td>
            <td>${Number(p.draws || 0)}</td>
            <td>${Number(p.losses || 0)}</td>
            <td>${Number(p.goals_for || 0)}</td>
            <td>${Number(p.goals_against || 0)}</td>
            <td class="${gdCls}">${gd > 0 ? "+" : ""}${gd}</td>
          </tr>
        `
      })

      standingsTable.classList.remove("hidden")
      noStandings.classList.add("hidden")
    }

    if (!goalRank.length) {
      noScorers.classList.remove("hidden")
    } else {
      const scorers = goalRank.slice(0, 5)
      topScorers.innerHTML = ""
      scorers.forEach((p, i) => {
        topScorers.innerHTML += `
          <li class="flex justify-between py-2">
            <span>${i + 1}. ${escapeHtml(p.gamer_tag)}</span>
            <span class="font-bold text-green">${Number(p.goals_for || 0)}</span>
          </li>
        `
      })
      topScorers.classList.remove("hidden")
      noScorers.classList.add("hidden")
    }

    if (!cleanSheetRank.length) {
      noCleanSheets.classList.remove("hidden")
    } else {
      const normalized = normalizeCleanSheets(cleanSheetRank).slice(0, 5)
      cleanSheets.innerHTML = ""
      normalized.forEach((p, i) => {
        cleanSheets.innerHTML += `
          <li class="flex justify-between py-2">
            <span>${i + 1}. ${escapeHtml(p.gamer_tag)}</span>
            <span class="font-bold text-blue">${Number(p.clean_sheets || 0)}</span>
          </li>
        `
      })
      cleanSheets.classList.remove("hidden")
      noCleanSheets.classList.add("hidden")
    }
  } catch (err) {
    console.error("Homepage stats failed:", err)
    setSeasonUI("Error", "Backend Not Available", "text-red font-medium")
    showNoStats(
      loadingStandings,
      loadingScorers,
      loadingCleanSheets,
      noStandings,
      noScorers,
      noCleanSheets,
    )
  }
}

function setSeasonUIForDates(season) {
  const today = new Date()
  const start = new Date(season.start_date)
  const end = new Date(season.end_date)

  let status = "Inactive"
  let cls = "text-gray-600"

  if (today < start) {
    status = "Registration Open"
    cls = "text-blue font-medium"
  } else if (today >= start && today <= end) {
    status = "Active"
    cls = "text-green font-medium"
  } else {
    status = "Season Ended"
    cls = "text-gray-500 font-medium"
  }

  setSeasonUI(season.name, status, cls)
}

function setSeasonUI(name, status, cls) {
  document.getElementById("season-name").textContent = name
  const el = document.getElementById("season-status")
  el.textContent = status
  el.className = cls
}

function showNoStats(
  loadingStandings,
  loadingScorers,
  loadingCleanSheets,
  noStandings,
  noScorers,
  noCleanSheets,
) {
  loadingStandings.classList.add("hidden")
  loadingScorers.classList.add("hidden")
  loadingCleanSheets.classList.add("hidden")
  noStandings.classList.remove("hidden")
  noScorers.classList.remove("hidden")
  noCleanSheets.classList.remove("hidden")
}

function normalizeCleanSheets(rows) {
  const byName = new Map()

  rows.forEach((row) => {
    const key = String(row.gamer_tag || "")
    const total = Number(row.clean_sheets || 0)
    byName.set(key, (byName.get(key) || 0) + total)
  })

  return [...byName.entries()]
    .map(([gamer_tag, clean_sheets]) => ({ gamer_tag, clean_sheets }))
    .sort((a, b) => b.clean_sheets - a.clean_sheets)
}

function escapeHtml(text = "") {
  const div = document.createElement("div")
  div.textContent = text
  return div.innerHTML
}

setInterval(() => {
  loadCurrentSeasonAndStats()
}, 5 * 60 * 1000)
