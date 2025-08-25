<?php
require __DIR__ . "/../connect.php";
require __DIR__ . "/../vendor/autoload.php";

use Dompdf\Dompdf;

$season_id = intval($_GET['season_id'] ?? 0);
if (!$season_id) {
    echo json_encode(["error" => "Missing season_id"]);
    exit();
}

try {
    // --- Season info ---
    $stmt = $pdo->prepare("SELECT id, name, start_date, end_date FROM seasons WHERE id = ?");
    $stmt->execute([$season_id]);
    $season = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$season) exit(json_encode(["error" => "Season not found"]));

    // --- Standings / Rank table ---
    $stmt = $pdo->prepare("
        WITH results AS (
            SELECT m.home_player_id AS player_id, m.home_goals AS gf, m.away_goals AS ga,
                   CASE WHEN m.home_goals > m.away_goals THEN 3
                        WHEN m.home_goals = m.away_goals THEN 1 ELSE 0 END AS pts
            FROM matches m WHERE m.season_id = ?
            UNION ALL
            SELECT m.away_player_id AS player_id, m.away_goals AS gf, m.home_goals AS ga,
                   CASE WHEN m.away_goals > m.home_goals THEN 3
                        WHEN m.away_goals = m.home_goals THEN 1 ELSE 0 END AS pts
            FROM matches m WHERE m.season_id = ?
        )
        SELECT p.id, p.gamer_tag, p.phone,
               SUM(r.pts) AS points,
               SUM(r.gf) - SUM(r.ga) AS goal_diff,
               SUM(r.gf) AS goals_for,
               SUM(r.ga) AS goals_against,
               SUM(CASE WHEN r.pts=3 THEN 1 ELSE 0 END) AS wins,
               SUM(CASE WHEN r.pts=1 THEN 1 ELSE 0 END) AS draws,
               SUM(CASE WHEN r.pts=0 THEN 1 ELSE 0 END) AS losses
        FROM players p
        LEFT JOIN results r ON r.player_id = p.id
        GROUP BY p.id, p.gamer_tag, p.phone
        ORDER BY points DESC, goal_diff DESC
    ");
    $stmt->execute([$season_id, $season_id]);
    $standings = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $winner = $standings[0]['gamer_tag'] ?? "N/A";

    // --- Top Goal Scorers ---
    $goal_rank = $standings;
    usort($goal_rank, fn($a, $b) => $b['goals_for'] <=> $a['goals_for']);
    $top_scorer = $goal_rank[0]['gamer_tag'] ?? "N/A";

    // --- Most Clean Sheets ---
    $stmt = $pdo->prepare("
        SELECT p.gamer_tag, COUNT(*) AS clean_sheets
        FROM matches m
        JOIN players p ON p.id = m.home_player_id
        WHERE m.season_id = ? AND m.away_goals = 0
        GROUP BY p.id
        UNION ALL
        SELECT p.gamer_tag, COUNT(*) AS clean_sheets
        FROM matches m
        JOIN players p ON p.id = m.away_player_id
        WHERE m.season_id = ? AND m.home_goals = 0
        GROUP BY p.id
        ORDER BY clean_sheets DESC
    ");
    $stmt->execute([$season_id, $season_id]);
    $clean_sheets_data = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $most_clean_sheets = $clean_sheets_data[0]['gamer_tag'] ?? "N/A";

    // --- All matches ---
    $stmt = $pdo->prepare("
        SELECT m.id, p1.gamer_tag AS home_player, p2.gamer_tag AS away_player,
               m.home_goals, m.away_goals, m.played_at
        FROM matches m
        JOIN players p1 ON p1.id = m.home_player_id
        JOIN players p2 ON p2.id = m.away_player_id
        WHERE m.season_id = ?
        ORDER BY m.played_at ASC
    ");
    $stmt->execute([$season_id]);
    $matches = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // --- Build HTML ---
    $html = "<h1>Season Report: {$season['name']}</h1>";
    $html .= "<p>From {$season['start_date']} to {$season['end_date']}</p>";
    $html .= "<h2>Winner: <strong>{$winner}</strong></h2>";
    $html .= "<h3>Top Scorer: <strong>{$top_scorer}</strong></h3>";
    $html .= "<h3>Most Clean Sheets: <strong>{$most_clean_sheets}</strong></h3>";

    // --- Standings table with top 3 highlight ---
    $html .= "<h3>Rank Table / Standings</h3><table border='1' cellpadding='5' cellspacing='0'>
                <thead>
                    <tr>
                        <th>Rank</th><th>Gamer Tag</th><th>Points</th><th>Goal Diff</th>
                        <th>Goals For</th><th>Goals Against</th><th>Wins</th>
                        <th>Draws</th><th>Losses</th>
                    </tr>
                </thead><tbody>";
    $rank = 1;
    foreach ($standings as $row) {
        $style = ($rank===1)?"background-color:#ffd700;":(($rank===2)?"background-color:#c0c0c0;":(($rank===3)?"background-color:#cd7f32;":""));
        $html .= "<tr style='{$style}'>
                    <td>{$rank}</td><td>{$row['gamer_tag']}</td><td>{$row['points']}</td>
                    <td>{$row['goal_diff']}</td><td>{$row['goals_for']}</td><td>{$row['goals_against']}</td>
                    <td>{$row['wins']}</td><td>{$row['draws']}</td><td>{$row['losses']}</td>
                  </tr>";
        $rank++;
    }
    $html .= "</tbody></table>";

    // --- Goal scoring rank ---
    $html .= "<h3>Goal Scoring Rank</h3><table border='1' cellpadding='5' cellspacing='0'>
                <thead><tr><th>Rank</th><th>Gamer Tag</th><th>Goals For</th></tr></thead><tbody>";
    $rank=1;
    foreach($goal_rank as $row){
        $style = ($rank===1)?"background-color:#ffd700;":(($rank===2)?"background-color:#c0c0c0;":(($rank===3)?"background-color:#cd7f32;":""));
        $html .= "<tr style='{$style}'><td>{$rank}</td><td>{$row['gamer_tag']}</td><td>{$row['goals_for']}</td></tr>";
        $rank++;
    }
    $html .= "</tbody></table>";

    // --- Clean sheets rank ---
    $html .= "<h3>Clean Sheets Ranking</h3><table border='1' cellpadding='5' cellspacing='0'>
                <thead><tr><th>Rank</th><th>Gamer Tag</th><th>Clean Sheets</th></tr></thead><tbody>";
    $rank=1;
    foreach($clean_sheets_data as $row){
        $style = ($rank===1)?"background-color:#ffd700;":(($rank===2)?"background-color:#c0c0c0;":(($rank===3)?"background-color:#cd7f32;":""));
        $html .= "<tr style='{$style}'><td>{$rank}</td><td>{$row['gamer_tag']}</td><td>{$row['clean_sheets']}</td></tr>";
        $rank++;
    }
    $html .= "</tbody></table>";

    // --- All matches ---
    $html .= "<h3>All Match Results</h3><table border='1' cellpadding='5' cellspacing='0'>
                <thead><tr><th>Date</th><th>Home Player</th><th>Away Player</th><th>Score</th></tr></thead><tbody>";
    foreach ($matches as $m){
        $html .= "<tr><td>{$m['played_at']}</td><td>{$m['home_player']}</td><td>{$m['away_player']}</td><td>{$m['home_goals']} - {$m['away_goals']}</td></tr>";
    }
    $html .= "</tbody></table>";

    // --- Generate PDF ---
    $dompdf = new Dompdf();
    $dompdf->loadHtml($html);
    $dompdf->setPaper('A4','landscape');
    $dompdf->render();
    $dompdf->stream("season_report_{$season['id']}.pdf", ["Attachment"=>true]);
    exit;

} catch(Exception $e){
    echo json_encode(["error"=>"Failed to generate season report"]);
}
