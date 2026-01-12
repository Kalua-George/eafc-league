<?php
session_start();
header("Content-Type: application/json");

require __DIR__ . "/../connect.php";
require __DIR__ . "/../systemlogs/logger.php";

$admin_id  = $_SESSION['admin_id'] ?? null;
$player_id = $_SESSION['player_id'] ?? null;

// new... FIX: match frontend parameter
$search = trim($_GET['identifier'] ?? '');

if (!$search) {
    log_action(
        $pdo,
        $admin_id ?? $player_id,
        'get_player',
        'players',
        null,
        'failed',
        'Missing search identifier'
    );
    echo json_encode(["error" => "Missing search identifier"]);
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

    if (!$player) {
        log_action(
            $pdo,
            $admin_id ?? $player_id,
            'get_player',
            'players',
            null,
            'failed',
            'Player not found'
        );
        echo json_encode(["error" => "Player not found"]);
        exit();
    }

    log_action(
        $pdo,
        $admin_id ?? $player_id,
        'get_player',
        'players',
        $player['id'],
        'success',
        'Viewed player status'
    );

    // ONLY return status-level info
    echo json_encode($player);

} catch (Exception $e) {
    log_action(
        $pdo,
        $admin_id ?? $player_id,
        'get_player',
        'players',
        null,
        'failed',
        $e->getMessage()
    );

    echo json_encode(["error" => "Failed to fetch player"]);
}
