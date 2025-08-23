<?php
header("Content-Type: application/json");
require __DIR__ . "/../connect.php";

$data = json_decode(file_get_contents("php://input"), true);

$player_id  = intval($data["id"] ?? 0);
$new_tag    = trim($data["gamer_tag"] ?? "");

if ($player_id <= 0 || $new_tag === "") {
    echo json_encode(["error" => "Invalid player data"]);
    exit();
}

try {
    $stmt = $pdo->prepare("UPDATE players SET gamer_tag = ? WHERE id = ?");
    $stmt->execute([$new_tag, $player_id]);

    if ($stmt->rowCount() > 0) {
        echo json_encode(["success" => true, "id" => $player_id, "gamer_tag" => $new_tag]);
    } else {
        echo json_encode(["error" => "No player updated (check ID)"]);
    }
} catch (PDOException $e) {
    echo json_encode(["error" => "Failed to update player"]);
}
