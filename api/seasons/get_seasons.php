<?php
session_start();
require __DIR__ . "/../connect.php";
require __DIR__ . "/../systemlogs/logger.php";

header('Content-Type: application/json');

$admin_id = $_SESSION['admin_id'] ?? null;

if (!$admin_id) {
    http_response_code(401);
    echo json_encode(["success" => false, "error" => "Unauthorized"]);
    exit();
}

try {
    $stmt = $pdo->prepare("SELECT id, name, start_date, end_date FROM seasons ORDER BY start_date DESC");
    $stmt->execute();
    $seasons = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Log the successful action
    $log_details = "Admin retrieved " . count($seasons) . " total seasons";
    log_action($pdo, $admin_id, null, 'get_seasons', 'seasons', $log_details, 'success');

    echo json_encode([
        "success" => true,
        "message" => "Seasons retrieved successfully",
        "seasons" => $seasons
    ]);

} catch (Exception $e) {
    // Log the failed action
    log_action($pdo, $admin_id, null, 'get_seasons', 'seasons', $e->getMessage(), 'failed');
    
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "error" => "Failed to retrieve seasons: " . $e->getMessage()
    ]);
    exit();
}
