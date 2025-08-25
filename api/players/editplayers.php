<?php
session_start();
require __DIR__ . "/../connect.php";
require __DIR__ . "/../systemlogs/logger.php"; // log_admin_action()

$admin_id = $_SESSION['admin_id'] ?? null;
$player_id_session = $_SESSION['player_id'] ?? null;

$data = json_decode(file_get_contents("php://input"), true);
$player_id = $data['player_id'] ?? null;
$gamer_tag = trim($data['gamer_tag'] ?? '');
$phone = trim($data['phone'] ?? '');

if (!$player_id || (!$admin_id && $player_id_session != $player_id)) {
    log_admin_action($pdo, $admin_id ?? null, 'edit_player', 'player', $player_id, 'failed', 'Unauthorized edit attempt');
    echo json_encode(["error" => "Unauthorized"]);
    exit();
}

if (!$gamer_tag) {
    log_admin_action($pdo, $admin_id ?? null, 'edit_player', 'player', $player_id, 'failed', 'Missing gamer_tag');
    echo json_encode(["error" => "Gamer tag is required"]);
    exit();
}

if (!$phone) {
    log_admin_action($pdo, $admin_id ?? null, 'edit_player', 'player', $player_id, 'failed', 'Missing phone number');
    echo json_encode(["error" => "Phone number is required"]);
    exit();
}

try {
    // Update player info
    $stmt = $pdo->prepare("UPDATE players SET gamer_tag = ?, phone = ? WHERE id = ?");
    $stmt->execute([$gamer_tag, $phone, $player_id]);

    log_admin_action($pdo, $admin_id ?? $player_id_session, 'edit_player', 'player', $player_id, 'success', json_encode(['gamer_tag'=>$gamer_tag,'phone'=>$phone]));

    echo json_encode(["success" => true, "message" => "Player updated successfully"]);

} catch (Exception $e) {
    log_admin_action($pdo, $admin_id ?? $player_id_session, 'edit_player', 'player', $player_id, 'failed', $e->getMessage());
    echo json_encode(["error" => "Failed to update player"]);
}
