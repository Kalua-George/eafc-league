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

// Get input: season_id and max_games_per_pair (number of times each player plays against each other)
$data = json_decode(file_get_contents("php://input"), true);
$season_id = $data['season_id'] ?? null;
$max_games_per_pair = $data['max_games_per_pair'] ?? 1;

if (!$season_id || $max_games_per_pair < 1) {
    log_admin_action($pdo, $admin_id, 'create_fixture', 'season', $season_id, 'failed', 'Invalid input');
    echo json_encode(["error" => "Invalid input"]);
    exit();
}

try {
    // Fetch all players for the season
    $stmt = $pdo->prepare("SELECT id FROM players ORDER BY id ASC");
    $stmt->execute();
    $players = $stmt->fetchAll(PDO::FETCH_COLUMN);

    if (count($players) < 2) {
        throw new Exception("Not enough players to generate fixtures");
    }

    // Generate fixtures: each pair plays max_games_per_pair times
    $matches = [];
    foreach ($players as $i => $home) {
        for ($j = $i + 1; $j < count($players); $j++) {
            $away = $players[$j];
            for ($k = 0; $k < $max_games_per_pair; $k++) {
                $matches[] = [$season_id, $home, $away, 0, 0]; // goals initialized to 0
            }
        }
    }

    // Shuffle matches for randomness
    shuffle($matches);

    // Insert into database
    $stmt = $pdo->prepare("INSERT INTO matches (season_id, home_player_id, away_player_id, home_goals, away_goals) VALUES (?, ?, ?, ?, ?)");
    foreach ($matches as $m) {
        $stmt->execute($m);
    }

    log_admin_action($pdo, $admin_id, 'create_fixture', 'season', $season_id, 'success', "Generated ".count($matches)." fixtures");

    echo json_encode(["success" => true, "message" => "Fixtures created successfully", "total_matches"=>count($matches)]);

} catch (Exception $e) {
    log_admin_action($pdo, $admin_id, 'create_fixture', 'season', $season_id, 'failed', $e->getMessage());
    echo json_encode(["error" => $e->getMessage()]);
}
