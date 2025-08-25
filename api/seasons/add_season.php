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

$data = json_decode(file_get_contents("php://input"), true);
$name = trim($data['name'] ?? '');
$start_date = $data['start_date'] ?? null;
$end_date = $data['end_date'] ?? null;

if (!$name || !$start_date || !$end_date) {
    log_admin_action($pdo, $admin_id, 'add_season', 'season', null, 'failed', 'Missing required fields');
    echo json_encode(["error" => "All fields are required"]);
    exit();
}

try {
    $stmt = $pdo->prepare("INSERT INTO seasons (name, start_date, end_date) VALUES (?, ?, ?)");
    $stmt->execute([$name, $start_date, $end_date]);
    $season_id = $pdo->lastInsertId();

    log_admin_action($pdo, $admin_id, 'add_season', 'season', $season_id, 'success', json_encode(['name'=>$name,'start_date'=>$start_date,'end_date'=>$end_date]));

    echo json_encode(["success" => true, "message" => "Season added successfully", "season_id" => $season_id]);

} catch (Exception $e) {
    log_admin_action($pdo, $admin_id, 'add_season', 'season', null, 'failed', $e->getMessage());
    echo json_encode(["error" => "Failed to add season"]);
}
