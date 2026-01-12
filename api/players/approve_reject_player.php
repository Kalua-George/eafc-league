<?php
session_start();
header("Content-Type: application/json");

require __DIR__ . "/../connect.php";
require __DIR__ . "/../systemlogs/logger.php";

$admin_id = $_SESSION['admin_id'] ?? null;

if (!$admin_id) {
    http_response_code(401);
    echo json_encode(["error" => "Unauthorized"]);
    exit();
}

$data = json_decode(file_get_contents("php://input"), true);

$player_id = isset($data['player_id']) ? (int)$data['player_id'] : 0;
$action    = isset($data['action']) ? strtolower(trim($data['action'])) : '';

if ($player_id <= 0 || !in_array($action, ['approve', 'reject'], true)) {
    log_action($pdo, $admin_id, 'update_player_status', 'players', $player_id, 'failed', 'Invalid input');
    echo json_encode(["error" => "Invalid input"]);
    exit();
}

$newStatus = $action === 'approve' ? 'approved' : 'rejected';

try {
    $pdo->beginTransaction();

    // Lock row for update
    $stmt = $pdo->prepare("
        SELECT id, status
        FROM players
        WHERE id = ?
        FOR UPDATE
    ");
    $stmt->execute([$player_id]);
    $player = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$player) {
        $pdo->rollBack();
        log_action($pdo, $admin_id, 'update_player_status', 'players', $player_id, 'failed', 'Player not found');
        echo json_encode(["error" => "Player not found"]);
        exit();
    }

    // Prevent redundant update
    if ($player['status'] === $newStatus) {
        $pdo->rollBack();
        log_action(
            $pdo,
            $admin_id,
            'update_player_status',
            'players',
            $player_id,
            'failed',
            "Player already {$newStatus}"
        );
        echo json_encode(["error" => "Player already {$newStatus}"]);
        exit();
    }

    // Optional rule: only allow pending → approved/rejected
    if ($player['status'] !== 'pending') {
        $pdo->rollBack();
        log_action(
            $pdo,
            $admin_id,
            'update_player_status',
            'players',
            $player_id,
            'failed',
            "Invalid status transition from {$player['status']}"
        );
        echo json_encode(["error" => "Cannot change status from {$player['status']}"]);
        exit();
    }

    // Update status
    $update = $pdo->prepare("UPDATE players SET status = ? WHERE id = ?");
    $update->execute([$newStatus, $player_id]);

    log_action(
        $pdo,
        $admin_id,
        'update_player_status',
        'players',
        $player_id,
        'success',
        "Player status changed to {$newStatus}"
    );

    $pdo->commit();

    echo json_encode([
        "success"   => true,
        "player_id" => $player_id,
        "status"    => $newStatus,
        "message"   => "Player {$newStatus} successfully"
    ]);

} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    log_action(
        $pdo,
        $admin_id,
        'update_player_status',
        'players',
        $player_id,
        'failed',
        $e->getMessage()
    );

    echo json_encode(["error" => "Failed to update player status"]);
}
