// Homepage functionality for EAFC League
// Depends on utils.js → window.EAFC.apiCall

document.addEventListener("DOMContentLoaded", () => {
  loadCurrentSeason();
  loadSeasonStats();
});

/* ===================== CURRENT SEASON ===================== */
async function loadCurrentSeason() {
  try {
    // New backend: get_season.php
    const res = await window.EAFC.apiCall("seasons/get_season.php");

    if (!res.success || !res.season) {
      setSeasonUI("No Season Found", "Inactive", "text-gray-600");
      return;
    }

    const season = res.season;
    const today = new Date();
    const start = new Date(season.start_date);
    const end = new Date(season.end_date);

    let status = "Inactive";
    let cls = "text-gray-600";

    if (today < start) {
      status = "Registration Open";
      cls = "text-blue font-medium";
    } else if (today >= start && today <= end) {
      status = "Active";
      cls = "text-green font-medium";
    } else {
      status = "Season Ended";
      cls = "text-gray-500 font-medium";
    }

    setSeasonUI(season.name, status, cls);
  } catch (err) {
    console.error("Season load failed:", err);
    setSeasonUI("Error", "Backend Not Available", "text-red font-medium");
  }
}

function setSeasonUI(name, status, cls) {
  document.getElementById("season-name").textContent = name;
  const el = document.getElementById("season-status");
  el.textContent = status;
  el.className = cls;
}

/* ===================== SEASON STATS ===================== */
async function loadSeasonStats() {
  const loadingStandings = document.getElementById("standings-loading");
  const table = document.getElementById("standings-table");
  const tbody = table.querySelector("tbody");
  const noStandings = document.getElementById("no-standings");

  const loadingScorers = document.getElementById("scorers-loading");
  const list = document.getElementById("top-scorers");
  const noScorers = document.getElementById("no-scorers");

  try {
    // Get current season id
    const seasonRes = await window.EAFC.apiCall("seasons/get_season.php");
    if (!seasonRes.season?.id) throw new Error("No season");

    const seasonId = seasonRes.season.id;

    // New backend: stats.php
    const data = await window.EAFC.apiCall(`matches/stats.php?season_id=${seasonId}`);

    loadingStandings.classList.add("hidden");
    loadingScorers.classList.add("hidden");

    if (!Array.isArray(data) || data.length === 0) {
      noStandings.classList.remove("hidden");
      noScorers.classList.remove("hidden");
      return;
    }

    /* ===================== STANDINGS ===================== */
    tbody.innerHTML = "";
    data.forEach((p, i) => {
      const gd = parseInt(p.goal_diff || 0);
      const gdCls = gd > 0 ? "text-green" : gd < 0 ? "text-red" : "text-gray-600";

      tbody.innerHTML += `
        <tr>
          <td>${i + 1}</td>
          <td>${escapeHtml(p.gamer_tag)}</td>
          <td class="text-green font-semibold">${p.points}</td>
          <td>${p.wins}</td>
          <td>${p.draws}</td>
          <td>${p.losses}</td>
          <td>${p.goals_for}</td>
          <td>${p.goals_against}</td>
          <td class="${gdCls}">${gd > 0 ? "+" : ""}${gd}</td>
        </tr>
      `;
    });
    table.classList.remove("hidden");

    /* ===================== TOP SCORERS ===================== */
    const scorers = data
      .filter(p => parseInt(p.goals_for || 0) > 0)
      .sort((a, b) => b.goals_for - a.goals_for)
      .slice(0, 5);

    if (!scorers.length) {
      noScorers.classList.remove("hidden");
    } else {
      noScorers.classList.add("hidden");
      list.innerHTML = "";
      scorers.forEach((p, i) => {
        list.innerHTML += `
          <li class="flex justify-between py-2">
            <span>${i + 1}. ${escapeHtml(p.gamer_tag)}</span>
            <span class="font-bold text-green">${p.goals_for}</span>
          </li>
        `;
      });
      list.classList.remove("hidden");
    }
  } catch (err) {
    console.error("Season stats failed:", err);
    loadingStandings.classList.add("hidden");
    loadingScorers.classList.add("hidden");
    noStandings.classList.remove("hidden");
    noScorers.classList.remove("hidden");
  }
}

/* ===================== HELPERS ===================== */
function escapeHtml(text = "") {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

/* ===================== AUTO REFRESH ===================== */
setInterval(() => {
  loadCurrentSeason();
  loadSeasonStats();
}, 5 * 60 * 1000);
