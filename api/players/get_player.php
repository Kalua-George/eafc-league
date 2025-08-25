<?php
session_start();
require __DIR__ . "/../connect.php";
require __DIR__ . "/../systemlogs/logger.php"; // log_admin_action()

$admin_id = $_SESSION['admin_id'] ?? null;

if (!$admin_id) {
    http_response_code(401);
    echo json_encode(["error" => "Unauthorized"]);
    exit();
}

try {
    $stmt = $pdo->prepare("SELECT id, gamer_tag, phone FROM players ORDER BY gamer_tag ASC");
    $stmt->execute();
    $players = $stmt->fetchAll(PDO::FETCH_ASSOC);

    log_admin_action($pdo, $admin_id, 'get_players', 'player', null, 'success', 'Viewed all players');

    echo json_encode($players);

} catch (Exception $e) {
    log_admin_action($pdo, $admin_id, 'get_players', 'player', null, 'failed', $e->getMessage());
    echo json_encode(["error" => "Failed to fetch players"]);
}
