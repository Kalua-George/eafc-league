<?php
session_start();
header('Content-Type: application/json');

require __DIR__ . '/../connect.php';
require __DIR__ . '/../systemlogs/logger.php'; // log_action(...)

//  Pull admin_id directly from session
$admin_id = $_SESSION['admin_id'] ?? null;

if (!$admin_id) {
    http_response_code(401);
    echo json_encode(["error" => "Unauthorized"]);
    exit();
}

// Optional filter by status
$status_filter = $_GET['status'] ?? null;

try {
    if ($status_filter && in_array($status_filter, ['pending','approved','rejected'], true)) {
        $stmt = $pdo->prepare("
            SELECT id, gamer_tag, phone, status, created_at
            FROM players
            WHERE status = ?
            ORDER BY gamer_tag ASC
        ");
        $stmt->execute([$status_filter]);
    } else {
        $stmt = $pdo->prepare("
            SELECT id, gamer_tag, phone, status, created_at
            FROM players
            ORDER BY status ASC, gamer_tag ASC
        ");
        $stmt->execute();
    }

    $players = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $count   = count($players);

    //  Log with admin_id from session
    $message = $status_filter
        ? "Admin {$admin_id} viewed {$count} players with status '{$status_filter}'"
        : "Admin {$admin_id} viewed {$count} total players";

    log_action(
        $pdo,
        $admin_id,     // who (admin)
        null,          // target_id (list view has none)
        'get_players', // action
        'players',     // target_table
        $message,      // details
        'success'
    );

    echo json_encode($players);

} catch (Exception $e) {
    // Log failure with admin_id from session
    log_action($pdo, $admin_id, null, 'get_players', 'players', $e->getMessage(), 'failed');
    http_response_code(500);
    echo json_encode(["error" => "Failed to fetch players"]);
}
