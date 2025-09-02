<?php
session_start();
require __DIR__ . "/../connect.php";
require __DIR__ . "/../systemlogs/logger.php"; // the log_action() function

if (!isset($_SESSION['admin_id'])) {
    http_response_code(401);
    echo json_encode(["error" => "Unauthorized"]);
    exit();
}

$admin_id = $_SESSION['admin_id'];

// Determine the request method
$requestMethod = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

// Fix: Declare variables at the top to ensure they are always in scope for the catch block
$match_id = null;
$result_str = null;
$new_date = null;

try {
    if ($requestMethod === 'GET') {
        // Handle GET request to fetch all matches
        $stmt = $pdo->prepare("
            SELECT 
                m.id, 
                m.scheduled_date, 
                m.home_goals, 
                m.away_goals,
                p1.gamer_tag AS home_team, 
                p2.gamer_tag AS away_team
            FROM matches m
            JOIN players p1 ON m.home_player_id = p1.id
            JOIN players p2 ON m.away_player_id = p2.id
            ORDER BY m.scheduled_date DESC, m.id DESC
        ");
        $stmt->execute();
        $matches = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Format the result string
        foreach ($matches as &$m) {
            $m['result'] = ($m['home_goals'] !== null && $m['away_goals'] !== null) ? "{$m['home_goals']}-{$m['away_goals']}" : null;
            $m['match_date'] = $m['scheduled_date']; // Add this for consistency with the frontend
        }

        echo json_encode($matches);

    } elseif ($requestMethod === 'POST') {
        // Handle POST request for actions (record result or reschedule)
        $data = $_POST;
        
        switch ($action) {
            case 'result':
                // Record match result and update status to completed
                $match_id = $data['match_id'] ?? null;
                $result_str = $data['result'] ?? null;
                
                if (!$match_id || !$result_str) {
                    throw new Exception("Match ID and result are required.");
                }

                $parts = explode('-', $result_str);
                if (count($parts) !== 2 || !is_numeric($parts[0]) || !is_numeric($parts[1])) {
                    throw new Exception("Invalid result format. Use e.g., '2-1'.");
                }
                $home_goals = (int)$parts[0];
                $away_goals = (int)$parts[1];

                $stmt = $pdo->prepare("UPDATE matches SET home_goals = ?, away_goals = ?, status = 'completed', played_at = NOW() WHERE id = ?");
                $stmt->execute([$home_goals, $away_goals, $match_id]);

                // Corrected parameter order for log_action
                log_action($pdo, $admin_id, $match_id, 'record_result', 'match', "Recorded result for match {$match_id}: {$result_str}", 'success');
                echo json_encode(["success" => true, "message" => "Result recorded successfully."]);
                break;

            case 'reschedule':
                // Reschedule a match and update status to postponed
                $match_id = $data['match_id'] ?? null;
                $new_date = $data['new_date'] ?? null;

                if (!$match_id || !$new_date) {
                    throw new Exception("Match ID and new date are required.");
                }

                $stmt = $pdo->prepare("UPDATE matches SET scheduled_date = ?, status = 'postponed' WHERE id = ?");
                $stmt->execute([$new_date, $match_id]);

                // Corrected parameter order for log_action
                log_action($pdo, $admin_id, $match_id, 'reschedule_match', 'match', "Rescheduled match {$match_id} to {$new_date}", 'success');
                echo json_encode(["success" => true, "message" => "Match rescheduled successfully."]);
                break;

            default:
                http_response_code(400);
                echo json_encode(["error" => "Invalid action."]);
                exit(); // This is the crucial fix!
        }
    } else {
        http_response_code(405);
        echo json_encode(["error" => "Method not allowed."]);
    }
} catch (Exception $e) {
    http_response_code(500);
    // Corrected parameter order for log_action in the catch block
    $targetIdToLog = is_numeric($match_id) ? $match_id : null;
    log_action($pdo, $admin_id, $targetIdToLog, $action, 'match', $e->getMessage(), 'failed');
    echo json_encode(["error" => $e->getMessage()]);
}
