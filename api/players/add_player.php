<?php
header("Content-Type: application/json");
require __DIR__ . "/../connect.php";

$data = json_decode(file_get_contents("php://input"), true);
$gamer_tag = trim($data["gamer_tag"] ?? "");

if ($gamer_tag === "") {
    echo json_encode(["error" => "Missing gamer_tag"]);
    exit();
}

try {
    $stmt = $pdo->prepare("INSERT INTO players (gamer_tag) VALUES (?)");
    $stmt->execute([$gamer_tag]);

    echo json_encode([
        "success" => true,
        "player_id" => $pdo->lastInsertId()
    ]);
} catch (PDOException $e) {
    echo json_encode(["error" => "Failed to add player"]);
}
