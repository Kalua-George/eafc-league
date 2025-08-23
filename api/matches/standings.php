<?php
header("Content-Type: application/json");
require __DIR__ . "/../connect.php";

$season_id = intval($_GET["season_id"] ?? 0);
if (!$season_id) {
    echo json_encode(["error" => "Missing season_id"]);
    exit();
}

$query = "
WITH results AS (
  SELECT m.season_id,
         m.home_player_id AS player_id,
         m.home_goals AS gf,
         m.away_goals AS ga,
         CASE
           WHEN m.home_goals > m.away_goals THEN 3
           WHEN m.home_goals = m.away_goals THEN 1
           ELSE 0
         END AS pts,
         (m.home_goals > m.away_goals) AS w,
         (m.home_goals = m.away_goals) AS d,
         (m.home_goals < m.away_goals) AS l
  FROM matches m
  UNION ALL
  SELECT m.season_id,
         m.away_player_id AS player_id,
         m.away_goals AS gf,
         m.home_goals AS ga,
         CASE
           WHEN m.away_goals > m.home_goals THEN 3
           WHEN m.away_goals = m.home_goals THEN 1
           ELSE 0
         END AS pts,
         (m.away_goals > m.home_goals) AS w,
         (m.away_goals = m.home_goals) AS d,
         (m.away_goals < m.home_goals) AS l
  FROM matches m
)
SELECT p.id, p.gamer_tag,
       COALESCE(SUM(r.pts), 0) AS points,
       COALESCE(SUM(r.w), 0)   AS wins,
       COALESCE(SUM(r.d), 0)   AS draws,
       COALESCE(SUM(r.l), 0)   AS losses,
       COALESCE(SUM(r.gf), 0)  AS goals_for,
       COALESCE(SUM(r.ga), 0)  AS goals_against,
       COALESCE(SUM(r.gf), 0) - COALESCE(SUM(r.ga), 0) AS goal_diff
FROM players p
LEFT JOIN results r ON r.player_id = p.id AND r.season_id = ?
GROUP BY p.id, p.gamer_tag
ORDER BY points DESC, goal_diff DESC, p.gamer_tag ASC
";

try {
    $stmt = $pdo->prepare($query);
    $stmt->execute([$season_id]);
    $rows = $stmt->fetchAll();
    echo json_encode($rows);
} catch (PDOException $e) {
    echo json_encode(["error" => "Failed to fetch standings"]);
}
