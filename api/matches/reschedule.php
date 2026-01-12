<?php
session_start();
require __DIR__ . "/../connect.php";
require __DIR__ . "/../systemlogs/logger.php"; // log_action()

if (!isset($_SESSION['admin_id'])) {
    http_response_code(401);
    echo json_encode(["error" => "Unauthorized"]);
    exit();
}

$admin_id = $_SESSION['admin_id'];

// Get input from POST request
$match_id = $_POST['match_id'] ?? null;
$new_date = $_POST['new_date'] ?? null;

if (!$match_id || !$new_date) {
    log_action($pdo, $admin_id, null, 'reschedule', 'match', 'Missing input', 'failed');
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

    // Update match date
    $stmt = $pdo->prepare("UPDATE matches SET scheduled_date = ? WHERE id = ?");
    $stmt->execute([$new_date, $match_id]);

    log_action($pdo, $admin_id, $match_id, 'reschedule', 'match', "New date: $new_date", 'success');

    echo json_encode(["success" => true, "message" => "Match rescheduled successfully"]);

} catch (Exception $e) {
    log_action($pdo, $admin_id, $match_id, 'reschedule', 'match', $e->getMessage(), 'failed');
    echo json_encode(["error" => $e->getMessage()]);
}
