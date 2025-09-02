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

$data = json_decode(file_get_contents("php://input"), true);
$name = trim($data['name'] ?? '');
$start_date = $data['start_date'] ?? null;
$end_date = $data['end_date'] ?? null;

if (!$name || !$start_date || !$end_date) {
    // Log a simple string message
    log_action($pdo, $admin_id, null, 'add_season', 'seasons', 'Missing required fields', 'failed');
    echo json_encode(["success" => false, "error" => "All fields are required"]);
    exit();
}

try {
    $stmt = $pdo->prepare("INSERT INTO seasons (name, start_date, end_date) VALUES (?, ?, ?)");
    $stmt->execute([$name, $start_date, $end_date]);
    $season_id = $pdo->lastInsertId();

    // Log a simple, descriptive string message
    $log_details = "Added new season: '{$name}' with ID '{$season_id}'";
    log_action($pdo, $admin_id, $season_id, 'add_season', 'seasons', $log_details, 'success');

    echo json_encode([
        "success" => true,
        "message" => "Season added successfully",
        "season_id" => $season_id
    ]);

} catch (Exception $e) {
    // Log the error message as a simple string
    log_action($pdo, $admin_id, null, 'add_season', 'seasons', $e->getMessage(), 'failed');
    echo json_encode([
        "success" => false,
        "error" => "Failed to add season: " . $e->getMessage()
    ]);
}