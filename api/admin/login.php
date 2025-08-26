<?php
session_start();
require __DIR__ . "/../connect.php";
require __DIR__ . "/../systemlogs/logger.php";

$data = json_decode(file_get_contents("php://input"), true);
$username = trim($data['username'] ?? '');
$password = $data['password'] ?? '';

if (!$username || !$password) {
    echo json_encode(["error" => "Username and password required"]);
    exit();
}

try {
    $stmt = $pdo->prepare("SELECT id, username, password FROM admins WHERE username = ?");
    $stmt->execute([$username]);
    $admin = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$admin) {
        log_action($pdo, null, null, 'login', 'admins', "Invalid username: $username", 'failed');
        echo json_encode(["error" => "Invalid credentials"]);
        exit();
    }

    if (!password_verify($password, $admin['password'])) {
        log_action($pdo, $admin['id'], null, 'login', 'admins', "Incorrect password", 'failed');
        echo json_encode(["error" => "Invalid credentials"]);
        exit();
    }

    $_SESSION['admin_id'] = $admin['id'];
    log_action($pdo, $admin['id'], null, 'login', 'admins', "Admin logged in", 'success');

    echo json_encode(["success" => true, "message" => "Logged in successfully"]);

} catch (Exception $e) {
    echo json_encode(["error" => "Login failed", "details" => $e->getMessage()]);
}
