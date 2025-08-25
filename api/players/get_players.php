<?php
session_start();
header("Content-Type: application/json");
require __DIR__ . "/../connect.php";
require __DIR__ . "/../systemlogs/logger.php"; // log_admin_action()

$admin_id = $_SESSION['admin_id'] ?? null;

if (!$admin_id) {
    http_response_code(401);
    echo json_encode(["error" => "Unauthorized"]);
    exit();
}

// Optional filter by status
$status_filter = $_GET['status'] ?? null; // pending/approved/rejected

try {
    if ($status_filter && in_array($status_filter, ['pending','approved','rejected'])) {
        $stmt = $pdo->prepare("
            SELECT id, gamer_tag, phone, status
            FROM players
            WHERE status = ?
            ORDER BY gamer_tag ASC
        ");
        $stmt->execute([$status_filter]);
    } else {
        $stmt = $pdo->prepare("
            SELECT id, gamer_tag, phone, status
            FROM players
            ORDER BY status ASC, gamer_tag ASC
        ");
        $stmt->execute();
    }

    $players = $stmt->fetchAll(PDO::FETCH_ASSOC);

    log_admin_action($pdo, $admin_id, 'get_players', 'player', null, 'success', 'Viewed all players');

    echo json_encode($players);

} catch (Exception $e) {
    log_admin_action($pdo, $admin_id, 'get_players', 'player', null, 'failed', $e->getMessage());
    echo json_encode(["error" => "Failed to fetch players"]);
}
