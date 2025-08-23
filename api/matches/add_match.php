<?php
header("Content-Type: application/json");
require __DIR__ . "/../connect.php";

$data = json_decode(file_get_contents("php://input"), true);

$season_id  = $data["season_id"] ?? null;
$home_id    = $data["home_player_id"] ?? null;
$away_id    = $data["away_player_id"] ?? null;
$home_goals = $data["home_goals"] ?? null;
$away_goals = $data["away_goals"] ?? null;

if (!$season_id || !$home_id || !$away_id || $home_id == $away_id) {
    echo json_encode(["error" => "Invalid match data"]);
    exit();
}

try {
    $stmt = $pdo->prepare("
        INSERT INTO matches (season_id, home_player_id, away_player_id, home_goals, away_goals)
        VALUES (?, ?, ?, ?, ?)
    ");
    $stmt->execute([$season_id, $home_id, $away_id, $home_goals, $away_goals]);

    echo json_encode(["success" => true]);
} catch (PDOException $e) {
    echo json_encode(["error" => "Failed to add match"]);
}
