<?php
session_start();
require __DIR__ . "/../connect.php";
require __DIR__ . "/../systemlogs/logger.php"; // log_admin_action()

$admin_id = $_SESSION['admin_id'] ?? null;

$page = max(1, intval($_GET['page'] ?? 1));
$limit = max(1, intval($_GET['limit'] ?? 50));
$offset = ($page - 1) * $limit;

try {
    // Count total logs
    $stmtTotal = $pdo->query("SELECT COUNT(*) FROM system_logs");
    $total_records = (int) $stmtTotal->fetchColumn();
    $total_pages = ceil($total_records / $limit);

    // Fetch logs
    $stmt = $pdo->prepare("
        SELECT id, admin_id, action, target_table, target_id, status, details, created_at
        FROM system_logs
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
    ");
    $stmt->bindValue(1, $limit, PDO::PARAM_INT);
    $stmt->bindValue(2, $offset, PDO::PARAM_INT);
    $stmt->execute();
    $logs = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Log success if admin
    if ($admin_id) {
        log_admin_action($pdo, $admin_id, 'view_logs', 'system_logs', null, 'success', 'Viewed system logs');
    }

    echo json_encode([
        "page" => $page,
        "limit" => $limit,
        "total_records" => $total_records,
        "total_pages" => $total_pages,
        "logs" => $logs
    ]);

} catch (Exception $e) {
    if ($admin_id) {
        log_admin_action($pdo, $admin_id, 'view_logs', 'system_logs', null, 'failed', $e->getMessage());
    }
    echo json_encode(["error" => "Failed to fetch logs"]);
}
