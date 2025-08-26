<?php
session_start();
require __DIR__ . "/../connect.php";
require __DIR__ . "/../systemlogs/logger.php"; // log_action()

$admin_id = $_SESSION['admin_id'] ?? null;
$player_id_session = $_SESSION['player_id'] ?? null;

$data = json_decode(file_get_contents("php://input"), true);
$gamer_tag = trim($data['gamer_tag'] ?? '');
$phone = trim($data['phone'] ?? ''); // new phone field

$logTargetTable = 'players'; // always pass a valid target_table

if (!$gamer_tag) {
    log_action($pdo, $admin_id ?? $player_id_session, null, 'add_player', $logTargetTable, 'Missing gamer_tag', 'failed');
    echo json_encode(["error" => "Gamer tag is required"]);
    exit();
}

if (!$phone) {
    log_action($pdo, $admin_id ?? $player_id_session, null, 'add_player', $logTargetTable, 'Missing phone number', 'failed');
    echo json_encode(["error" => "Phone number is required"]);
    exit();
}

try {
    // Check for unique gamer_tag
    $check = $pdo->prepare("SELECT id FROM players WHERE gamer_tag = ?");
    $check->execute([$gamer_tag]);
    if ($check->fetch()) {
        log_action($pdo, $admin_id ?? $player_id_session, null, 'add_player', $logTargetTable, 'Duplicate gamer_tag', 'failed');
        echo json_encode(["error" => "Gamer tag already exists"]);
        exit();
    }

    // Determine default status
    $status = $admin_id ? 'approved' : 'pending';

    // Insert new player
    $stmt = $pdo->prepare("INSERT INTO players (gamer_tag, phone, status) VALUES (?, ?, ?)");
    $stmt->execute([$gamer_tag, $phone, $status]);
    $player_id = $pdo->lastInsertId();

    // If self-registration, set session
    if (!$admin_id) {
        $_SESSION['player_id'] = $player_id;
    }

    // ✅ Use sprintf for readable log message
    $details = sprintf(
        "Added player: gamer_tag='%s', phone='%s', status='%s'",
        $gamer_tag,
        $phone,
        $status
    );

    log_action(
        $pdo,
        $admin_id ?? $player_id,
        $player_id,
        'add_player',
        $logTargetTable,
        $details,
        'success'
    );

    echo json_encode([
        "success" => true,
        "message" => $admin_id 
            ? "Player registered and approved successfully" 
            : "Player registered successfully, pending approval",
        "player_id" => $player_id,
        "status" => $status
    ]);

} catch (Exception $e) {
    log_action($pdo, $admin_id ?? $player_id_session, null, 'add_player', $logTargetTable, $e->getMessage(), 'failed');
    echo json_encode(["error" => "Failed to add player"]);
}
