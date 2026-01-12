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

// Get input from POST request
$match_id = $_POST['match_id'] ?? null;
$home_goals = $_POST['home_goals'] ?? null;
$away_goals = $_POST['away_goals'] ?? null;

if (!$match_id || $home_goals === null || $away_goals === null) {
    log_action($pdo, $admin_id, null, 'record_result', 'match', 'Missing input', 'failed');
    echo json_encode(["error" => "Missing input"]);
    exit();
}

try {
    // Check if match exists and not already completed
    $stmt = $pdo->prepare("SELECT status FROM matches WHERE id = ?");
    $stmt->execute([$match_id]);
    $match = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$match) {
        throw new Exception("Match not found");
    }

    if (($match['status'] ?? '') === 'completed') {
        throw new Exception("Match results already recorded");
    }

    // Update match results
    $stmt = $pdo->prepare("UPDATE matches SET home_goals = ?, away_goals = ?, status = 'completed', played_at = NOW() WHERE id = ?");
    $stmt->execute([$home_goals, $away_goals, $match_id]);

    log_action($pdo, $admin_id, $match_id, 'record_result', 'match', json_encode(['home_goals'=>$home_goals,'away_goals'=>$away_goals]), 'success');

    echo json_encode(["success" => true, "message" => "Match results recorded successfully"]);

} catch (Exception $e) {
    log_action($pdo, $admin_id, $match_id, 'record_result', 'match', $e->getMessage(), 'failed');
    echo json_encode(["error" => $e->getMessage()]);
}
