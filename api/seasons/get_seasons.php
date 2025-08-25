<?php
header("Content-Type: application/json");
require __DIR__ . "/../connect.php";

try {
    // Fetch all seasons
    $stmt = $pdo->prepare("SELECT id, name, start_date, end_date FROM seasons ORDER BY start_date DESC");
    $stmt->execute();
    $seasons = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $result = [];

    foreach ($seasons as $season) {
        // Get winner for this season
        $stmt2 = $pdo->prepare("
            WITH results AS (
                SELECT m.home_player_id AS player_id,
                       m.home_goals AS gf,
                       m.away_goals AS ga,
                       CASE WHEN m.home_goals > m.away_goals THEN 3
                            WHEN m.home_goals = m.away_goals THEN 1
                            ELSE 0
                       END AS pts
                FROM matches m
                WHERE m.season_id = ?
                UNION ALL
                SELECT m.away_player_id AS player_id,
                       m.away_goals AS gf,
                       m.home_goals AS ga,
                       CASE WHEN m.away_goals > m.home_goals THEN 3
                            WHEN m.away_goals = m.home_goals THEN 1
                            ELSE 0
                       END AS pts
                FROM matches m
                WHERE m.season_id = ?
            )
            SELECT p.id, p.gamer_tag,
                   SUM(r.pts) AS points,
                   SUM(r.gf)-SUM(r.ga) AS goal_diff
            FROM players p
            LEFT JOIN results r ON r.player_id = p.id
            GROUP BY p.id, p.gamer_tag
            ORDER BY points DESC, goal_diff DESC
            LIMIT 1
        ");
        $stmt2->execute([$season['id'], $season['id']]);
        $winner = $stmt2->fetch(PDO::FETCH_ASSOC);

        $season['winner'] = $winner ? $winner['gamer_tag'] : null;
        $result[] = $season;
    }

    echo json_encode($result);

} catch (Exception $e) {
    echo json_encode(["error" => "Failed to fetch seasons"]);
}
