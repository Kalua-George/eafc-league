<?php
require __DIR__ . "/../connect.php";

/**
 * Logs an action to the system_logs table.
 *
 * @param PDO $pdo
 * @param int|null $admin_id ID of the admin performing the action
 * @param int|null $target_id Optional target record ID
 * @param string $action Action name (e.g., login, delete)
 * @param string $target_table Target table affected
 * @param string|null $details Optional details / message
 * @param string $status Status: success or failed
 */
function log_action($pdo, $admin_id, $target_id, $action, $target_table, $details = null, $status = 'success') {
    if (!$admin_id) return false; // optional safety check

    $stmt = $pdo->prepare("
        INSERT INTO system_logs 
        (admin_id, action, target_table, target_id, status, details, created_at)
        VALUES (?, ?, ?, ?, ?, ?, NOW())
    ");
    $stmt->execute([$admin_id, $action, $target_table, $target_id, $status, $details]);
}
