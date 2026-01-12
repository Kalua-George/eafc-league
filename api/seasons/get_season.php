<?php
session_start();
header("Content-Type: application/json");
require __DIR__ . "/../connect.php";
require __DIR__ . "/../systemlogs/logger.php";

$admin_id = $_SESSION['admin_id'] ?? null;
$isAdmin = !empty($admin_id);

$season_id = intval($_GET['season_id'] ?? 0); // admin can request specific season

try {
    // Fetch all seasons ordered by start date descending
    $stmt = $pdo->query("SELECT id, name, start_date, end_date FROM seasons ORDER BY start_date DESC");
    $seasons = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $today = new DateTime();

    // Determine status dynamically for each season
    foreach ($seasons as &$season) {
        $start = new DateTime($season['start_date']);
        $end = new DateTime($season['end_date']);

        if ($today < $start) {
            $season['status'] = 'pending';
        } elseif ($today > $end) {
            $season['status'] = 'ended';
        } else {
            $season['status'] = 'current';
        }
    }

    // Admin view: can request specific season info
    if ($isAdmin) {
        if ($season_id) {
            $season = array_filter($seasons, fn($s) => $s['id'] == $season_id);
            $season = array_values($season); // reindex

            if (empty($season)) {
                echo json_encode(["error" => "Season not found"]);
            } else {
                echo json_encode(["success" => true, "season" => $season[0]]);
            }
        } else {
            // If no season_id provided, return all seasons
            echo json_encode(["success" => true, "seasons" => $seasons]);
        }
    } else {
        // Public: return only the current season
        $currentSeason = array_filter($seasons, fn($s) => $s['status'] === 'current');
        $currentSeason = array_values($currentSeason);

        if (empty($currentSeason)) {
            echo json_encode(["error" => "No active season currently"]);
        } else {
            echo json_encode(["success" => true, "season" => $currentSeason[0]]);
        }
    }

} catch (Exception $e) {
    log_action($pdo, $admin_id ?? null, 'get_season', 'season', null, 'failed', $e->getMessage());
    echo json_encode(["error" => "Failed to fetch season"]);
}
