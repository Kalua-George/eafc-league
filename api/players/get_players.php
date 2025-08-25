<?php
header("Content-Type: application/json");
require __DIR__ . "/../connect.php";

try {
    $stmt = $pdo->query("SELECT id, gamer_tag, created_at FROM players ORDER BY gamer_tag ASC");
    $players = $stmt->fetchAll();
    echo json_encode($players);
} catch (PDOException $e) {
    echo json_encode(["error" => "Failed to fetch players"]);
}
