<?php
session_start();
header("Content-Type: application/json");
require __DIR__ . "/../connect.php";
require __DIR__ . "/../systemlogs/logger.php"; // log_action()

$admin_id = $_SESSION['admin_id'] ?? null;

if (!$admin_id) {
    http_response_code(401);
    echo json_encode(["error" => "Unauthorized"]);
    exit();
}

$data = json_decode(file_get_contents("php://input"), true);
$player_id = intval($data['player_id'] ?? 0);
$action = strtolower(trim($data['action'] ?? ''));

if (!$player_id || !in_array($action, ['approve','reject'])) {
    echo json_encode(["error" => "Invalid input"]);
    log_action($pdo, $admin_id, 'update_player_status', 'player', $player_id, 'failed', 'Invalid input');
    exit();
}

$status = $action === 'approve' ? 'approved' : 'rejected';

try {
    // Check if player exists
    $stmtCheck = $pdo->prepare("SELECT id, status FROM players WHERE id = ?");
    $stmtCheck->execute([$player_id]);
    $player = $stmtCheck->fetch(PDO::FETCH_ASSOC);

    if (!$player) {
        log__action($pdo, $admin_id, 'update_player_status', 'player', $player_id, 'failed', 'Player not found');
        echo json_encode(["error" => "Player not found"]);
        exit();
    }

    // Prevent duplicate action
    if ($player['status'] === $status) {
        log_action($pdo, $admin_id, 'update_player_status', 'player', $player_id, 'failed', "Player already $status");
        echo json_encode(["error" => "Player already $status"]);
        exit();
    }

    // Update player status
    $stmt = $pdo->prepare("UPDATE players SET status = ? WHERE id = ?");
    $stmt->execute([$status, $player_id]);

    log_action(
        $pdo,
        $admin_id,
        'update_player_status',
        'player',
        $player_id,
        'success',
        "Player status set to $status"
    );

    echo json_encode([
        "success" => true,
        "message" => "Player registration $status successfully",
        "player_id" => $player_id,
        "status" => $status
    ]);

} catch (Exception $e) {
    log_action($pdo, $admin_id, 'update_player_status', 'player', $player_id, 'failed', $e->getMessage());
    echo json_encode(["error" => "Failed to update player status"]);
}
