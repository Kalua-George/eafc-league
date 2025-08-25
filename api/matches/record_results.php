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

// Get input: match_id, home_goals, away_goals
$data = json_decode(file_get_contents("php://input"), true);
$match_id = $data['match_id'] ?? null;
$home_goals = $data['home_goals'] ?? null;
$away_goals = $data['away_goals'] ?? null;

if (!$match_id || $home_goals === null || $away_goals === null) {
    log_admin_action($pdo, $admin_id, 'record_result', 'match', $match_id, 'failed', 'Missing input');
    echo json_encode(["error" => "Missing input"]);
    exit();
}

try {
    // Check if match exists and not already completed
    $stmt = $pdo->prepare("SELECT home_goals, away_goals, status FROM matches WHERE id = ?");
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

    log_admin_action($pdo, $admin_id, 'record_result', 'match', $match_id, 'success', json_encode(['home_goals'=>$home_goals,'away_goals'=>$away_goals]));

    echo json_encode(["success" => true, "message" => "Match results recorded successfully"]);

} catch (Exception $e) {
    log_admin_action($pdo, $admin_id, 'record_result', 'match', $match_id, 'failed', $e->getMessage());
    echo json_encode(["error" => $e->getMessage()]);
}
