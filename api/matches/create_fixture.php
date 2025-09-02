<?php
session_start();
require __DIR__ . "/../connect.php";
require __DIR__ . "/../systemlogs/logger.php"; // the log_admin_action() function

if (!isset($_SESSION['admin_id'])) {
    http_response_code(401);
    echo json_encode(["error" => "Unauthorized"]);
    exit();
}

$admin_id = $_SESSION['admin_id'];

// Get input: season_id, max_games_per_pair, and the start_date
$data = $_POST;
$season_id = $data['season_id'] ?? null;
$max_games_per_pair = $data['games_per_pair'] ?? 1;
$start_date = $data['start_date'] ?? null;
$games_per_day = $data['games_per_day'] ?? 2;

if (!$season_id || $max_games_per_pair < 1 || !$start_date) {
    log_action($pdo, $admin_id, null, 'create_fixture', 'season', 'Invalid input', 'failed');
    echo json_encode(["error" => "Invalid input. Please provide a season, games per pair, and a start date."]);
    exit();
}

try {
    // Fetch all players for the season
    $stmt = $pdo->prepare("SELECT id FROM players WHERE status = 'approved' ORDER BY id ASC");
    $stmt->execute();
    $players = $stmt->fetchAll(PDO::FETCH_COLUMN);

    if (count($players) < 2) {
        throw new Exception("Not enough approved players to generate fixtures");
    }

    $current_date = new DateTime($start_date);
    $games_on_current_day = 0;

    // Generate fixtures: each pair plays max_games_per_pair times
    $matches = [];
    foreach ($players as $i => $home) {
        for ($j = $i + 1; $j < count($players); $j++) {
            $away = $players[$j];
            for ($k = 0; $k < $max_games_per_pair; $k++) {
                $matches[] = [
                    'season_id' => $season_id,
                    'home_player_id' => $home,
                    'away_player_id' => $away,
                    'scheduled_date' => $current_date->format('Y-m-d H:i:s')
                ];

                $games_on_current_day++;

                // If the game count for the current day reaches the limit, move to the next day.
                if ($games_on_current_day >= $games_per_day) {
                    $current_date->modify('+1 day');
                    $games_on_current_day = 0; // Reset the counter for the new day
                }
            }
        }
    }

    // Shuffle matches for randomness
    shuffle($matches);

    // Insert into database
    $stmt = $pdo->prepare("INSERT INTO matches (season_id, home_player_id, away_player_id, scheduled_date) VALUES (?, ?, ?, ?)");
    foreach ($matches as $m) {
        $stmt->execute([$m['season_id'], $m['home_player_id'], $m['away_player_id'], $m['scheduled_date']]);
    }

    log_action($pdo, $admin_id, $season_id, 'create_fixture', 'season', "Generated ".count($matches)." fixtures", 'success');

    echo json_encode(["success" => true, "message" => "Fixtures created successfully", "total_matches"=>count($matches)]);

} catch (Exception $e) {
    log_action($pdo, $admin_id, $season_id, 'create_fixture', 'season', $e->getMessage(), 'failed');
    echo json_encode(["error" => $e->getMessage()]);
}
