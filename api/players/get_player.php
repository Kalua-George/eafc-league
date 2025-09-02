<?php
session_start();
header("Content-Type: application/json");
require __DIR__ . "/../connect.php";
require __DIR__ . "/../systemlogs/logger.php"; // log_action()

// Identify the user (admin or player)
$admin_id = $_SESSION['admin_id'] ?? null;
$player_id = $_SESSION['player_id'] ?? null;

$search = trim($_GET['q'] ?? '');

if (!$search) {
    log_action($pdo, $admin_id ?? $player_id, 'get_player', 'player', null, 'failed', 'Missing search query');
    echo json_encode(["error" => "Missing search query"]);
    exit();
}

try {
    $stmt = $pdo->prepare("
        SELECT id, gamer_tag, phone, status
        FROM players
        WHERE gamer_tag = ? OR phone = ?
        LIMIT 1
    ");
    $stmt->execute([$search, $search]);
    $player = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($player) {
        log_action($pdo, $admin_id ?? $player_id, 'get_player', 'player', $player['id'], 'success', 'Viewed player');
        echo json_encode($player);
    } else {
        log_action($pdo, $admin_id ?? $player_id, 'get_player', 'player', null, 'failed', 'Player not found');
        echo json_encode(["error" => "Player not found"]);
    }

} catch (Exception $e) {
    log_action($pdo, $admin_id ?? $player_id, 'get_player', 'player', null, 'failed', $e->getMessage());
    echo json_encode(["error" => "Failed to fetch player"]);
}
