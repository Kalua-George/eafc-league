<?php
session_start();
require __DIR__ . "/../connect.php";
require __DIR__ . "/../systemlogs/logger.php";

$admin_id = $_SESSION['admin_id'] ?? null;

if ($admin_id) {
    // Log the logout action
    log_action($pdo, $admin_id, null, 'logout', 'admins', null, 'success', "Admin logged out");

    // Clear session
    session_unset();
    session_destroy();
}

echo json_encode(["success" => true, "message" => "Logged out successfully"]);
