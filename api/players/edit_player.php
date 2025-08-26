<?php
session_start();
require __DIR__ . "/../connect.php";
require __DIR__ . "/../systemlogs/logger.php"; // log_action()

$admin_id = $_SESSION['admin_id'] ?? null;
$player_id_session = $_SESSION['player_id'] ?? null;

$data = json_decode(file_get_contents("php://input"), true);
$player_id = $data['player_id'] ?? null;
$gamer_tag = trim($data['gamer_tag'] ?? '');
$phone = trim($data['phone'] ?? '');

$logTargetTable = 'players';

// Authorization check
if (!$player_id || (!$admin_id && $player_id_session != $player_id)) {
    log_action($pdo, $admin_id ?? $player_id_session, $player_id, 'edit_player', $logTargetTable, 'Unauthorized edit attempt', 'failed');
    echo json_encode(["error" => "Unauthorized"]);
    exit();
}

// Validation
if (!$gamer_tag) {
    log_action($pdo, $admin_id ?? $player_id_session, $player_id, 'edit_player', $logTargetTable, 'Missing gamer_tag', 'failed');
    echo json_encode(["error" => "Gamer tag is required"]);
    exit();
}
if (!$phone) {
    log_action($pdo, $admin_id ?? $player_id_session, $player_id, 'edit_player', $logTargetTable, 'Missing phone number', 'failed');
    echo json_encode(["error" => "Phone number is required"]);
    exit();
}

try {
    // Ensure gamer_tag is unique (except this player)
    $dup = $pdo->prepare("SELECT id FROM players WHERE gamer_tag = ? AND id != ?");
    $dup->execute([$gamer_tag, $player_id]);
    if ($dup->fetch()) {
        log_action($pdo, $admin_id ?? $player_id_session, $player_id, 'edit_player', $logTargetTable, 'Duplicate gamer_tag', 'failed');
        echo json_encode(["error" => "Gamer tag already exists"]);
        exit();
    }

    // Update player info
    $stmt = $pdo->prepare("UPDATE players SET gamer_tag = ?, phone = ? WHERE id = ?");
    $stmt->execute([$gamer_tag, $phone, $player_id]);

    log_action($pdo, $admin_id ?? $player_id_session, $player_id, 'edit_player', $logTargetTable, "Updated gamer_tag={$gamer_tag}, phone={$phone}", 'success');

    echo json_encode(["success" => true, "message" => "Player updated successfully"]);

} catch (Exception $e) {
    log_action($pdo, $admin_id ?? $player_id_session, $player_id, 'edit_player', $logTargetTable, $e->getMessage(), 'failed');
    echo json_encode(["error" => "Failed to update player"]);
}
