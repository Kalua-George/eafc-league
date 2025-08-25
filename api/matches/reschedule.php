<?php
session_start();
require __DIR__ . "/../connect.php";
require __DIR__ . "/../systemlogs/logger.php"; // log_admin_action()

if (!isset($_SESSION['admin_id'])) {
    http_response_code(401);
    echo json_encode(["error" => "Unauthorized"]);
    exit();
}

$admin_id = $_SESSION['admin_id'];

// Get input: match_id, new_datetime
$data = json_decode(file_get_contents("php://input"), true);
$match_id = $data['match_id'] ?? null;
$new_datetime = $data['new_datetime'] ?? null;

if (!$match_id || !$new_datetime) {
    log_admin_action($pdo, $admin_id, 'reschedule', 'match', $match_id, 'failed', 'Missing input');
    echo json_encode(["error" => "Missing input"]);
    exit();
}

try {
    // Check if match exists
    $stmt = $pdo->prepare("SELECT status FROM matches WHERE id = ?");
    $stmt->execute([$match_id]);
    $match = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$match) {
        throw new Exception("Match not found");
    }

    if (($match['status'] ?? '') === 'completed') {
        throw new Exception("Cannot reschedule a completed match");
    }

    // Update match date/time
    $stmt = $pdo->prepare("UPDATE matches SET played_at = ? WHERE id = ?");
    $stmt->execute([$new_datetime, $match_id]);

    log_admin_action($pdo, $admin_id, 'reschedule', 'match', $match_id, 'success', "New date/time: $new_datetime");

    echo json_encode(["success" => true, "message" => "Match rescheduled successfully"]);

} catch (Exception $e) {
    log_admin_action($pdo, $admin_id, 'reschedule', 'match', $match_id, 'failed', $e->getMessage());
    echo json_encode(["error" => $e->getMessage()]);
}
