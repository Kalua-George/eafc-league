<?php
session_start();
require __DIR__ . "/../connect.php";

$admin_id = $_SESSION['admin_id'] ?? null;

if (!$admin_id) {
    http_response_code(401);
    echo json_encode(["error" => "Unauthorized"]);
    exit();
}

// Fetch filter parameters from query string
$actor = $_GET['actor'] ?? null;
$action = $_GET['action'] ?? null;
$target_table = $_GET['target_table'] ?? null;
$status = $_GET['status'] ?? null;
$from = $_GET['from'] ?? null;
$to = $_GET['to'] ?? null;
$page = max(1, intval($_GET['page'] ?? 1));
$limit = max(1, intval($_GET['limit'] ?? 50));
$offset = ($page - 1) * $limit;

try {
    $conditions = [];
    $params = [];

    if ($actor) {
        $conditions[] = "admin_id = ?";
        $params[] = $actor;
    }
    if ($action) {
        $conditions[] = "action = ?";
        $params[] = $action;
    }
    if ($target_table) {
        $conditions[] = "target_table = ?";
        $params[] = $target_table;
    }
    if ($status) {
        $conditions[] = "status = ?";
        $params[] = $status;
    }
    if ($from) {
        $conditions[] = "created_at >= ?";
        $params[] = $from;
    }
    if ($to) {
        $conditions[] = "created_at <= ?";
        $params[] = $to;
    }

    $where = count($conditions) ? "WHERE " . implode(" AND ", $conditions) : "";

    // Get total records for pagination
    $stmtTotal = $pdo->prepare("SELECT COUNT(*) FROM system_logs $where");
    $stmtTotal->execute($params);
    $total_records = intval($stmtTotal->fetchColumn());
    $total_pages = ceil($total_records / $limit);

    // Get logs for current page
    $sql = "SELECT id, admin_id, action, target_table, target_id, status, details, created_at
            FROM system_logs
            $where
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?";

    $stmt = $pdo->prepare($sql);
    $i = 1;
    foreach ($params as $p) {
        $stmt->bindValue($i++, $p);
    }
    $stmt->bindValue($i++, $limit, PDO::PARAM_INT);
    $stmt->bindValue($i++, $offset, PDO::PARAM_INT);

    $stmt->execute();
    $logs = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "page" => $page,
        "limit" => $limit,
        "total_records" => $total_records,
        "total_pages" => $total_pages,
        "logs" => $logs
    ]);

} catch (Exception $e) {
    echo json_encode(["error" => "Failed to fetch logs"]);
}
