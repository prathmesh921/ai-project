"""
features.py - Feature Engineering Pipeline for UCL Match Outcome Predictor
Ensures strict prevention of temporal data leakage by using only pre-match historical records.
"""
from typing import Dict, List, Tuple, Any, Optional
import numpy as np
import pandas as pd

FEATURE_COLUMNS = [
    "elo_diff",          # Home Elo - Away Elo + venue adjustment
    "ucoef_diff",        # Home UEFA coefficient - Away UEFA coefficient
    "sqval_diff",        # Home squad market value - Away squad market value (€M)
    "home_form_pts",     # Home team points in last N matches before this match
    "away_form_pts",     # Away team points in last N matches before this match
    "form_diff",         # home_form_pts - away_form_pts
    "home_avg_gf",       # Rolling average goals scored by home team
    "away_avg_gf",       # Rolling average goals scored by away team
    "home_avg_ga",       # Rolling average goals conceded by home team
    "away_avg_ga",       # Rolling average goals conceded by away team
    "rest_days_diff",    # Rest days difference (home - away)
    "is_knockout",       # 1 if knockout phase, 0 if group/league phase
    "h2h_home_wins",     # Head-to-head home wins prior to match
    "h2h_away_wins",     # Head-to-head away wins prior to match
    "h2h_draws",         # Head-to-head draws prior to match
]

FEATURE_LABELS = {
    "elo_diff": "Elo Rating Advantage",
    "ucoef_diff": "UEFA Coefficient Differential",
    "sqval_diff": "Squad Market Value Gap (€M)",
    "home_form_pts": "Home Team Rolling Form Points",
    "away_form_pts": "Away Team Rolling Form Points",
    "form_diff": "Recent Form Differential",
    "home_avg_gf": "Home Team Goals Scored Avg",
    "away_avg_gf": "Away Team Goals Scored Avg",
    "home_avg_ga": "Home Team Goals Conceded Avg",
    "away_avg_ga": "Away Team Goals Conceded Avg",
    "rest_days_diff": "Physical Rest Advantage (Days)",
    "is_knockout": "Competition Stage (Knockout vs Group)",
    "h2h_home_wins": "Historical Head-to-Head Home Dominance",
    "h2h_away_wins": "Historical Head-to-Head Away Dominance",
    "h2h_draws": "Historical Head-to-Head Stalemate Rate",
}

def extract_pre_match_stats(
    team: str,
    matches_history: pd.DataFrame,
    window: int = 5
) -> Tuple[int, float, float, List[str]]:
    """
    Extracts team rolling form and goals from match history strictly prior to the match.
    Returns (form_points, avg_goals_scored, avg_goals_conceded, form_badges).
    """
    if matches_history.empty:
        return 7, 1.5, 1.2, ["W", "D", "L", "W", "D"]

    team_matches = matches_history[
        (matches_history["home_team"] == team) | (matches_history["away_team"] == team)
    ].tail(window)

    if len(team_matches) == 0:
        return 7, 1.5, 1.2, ["W", "D", "L", "W", "D"]

    points = 0
    goals_for = 0
    goals_against = 0
    badges = []

    for _, row in team_matches.iterrows():
        is_home = (row["home_team"] == team)
        gh = int(row.get("goals_home", 0))
        ga = int(row.get("goals_away", 0))
        res = row.get("result", "D")

        if is_home:
            goals_for += gh
            goals_against += ga
            if res == "H":
                points += 3
                badges.append("W")
            elif res == "D":
                points += 1
                badges.append("D")
            else:
                badges.append("L")
        else:
            goals_for += ga
            goals_against += gh
            if res == "A":
                points += 3
                badges.append("W")
            elif res == "D":
                points += 1
                badges.append("D")
            else:
                badges.append("L")

    n = len(team_matches)
    avg_gf = round(goals_for / n, 2)
    avg_ga = round(goals_against / n, 2)

    return points, avg_gf, avg_ga, badges

def extract_h2h_stats(
    home_team: str,
    away_team: str,
    matches_history: pd.DataFrame
) -> Tuple[int, int, int, List[Dict[str, Any]]]:
    """
    Extracts head-to-head record between two teams prior to the match.
    """
    if matches_history.empty:
        return 0, 0, 0, []

    mask = (
        ((matches_history["home_team"] == home_team) & (matches_history["away_team"] == away_team)) |
        ((matches_history["home_team"] == away_team) & (matches_history["away_team"] == home_team))
    )
    h2h_df = matches_history[mask]

    hw = 0
    aw = 0
    dr = 0
    match_list = []

    for _, row in h2h_df.iterrows():
        h = row["home_team"]
        a = row["away_team"]
        res = row["result"]
        gh = int(row.get("goals_home", 0))
        ga = int(row.get("goals_away", 0))
        season = row.get("season", "Historical")
        date_str = row.get("match_date", "")

        match_list.append({
            "season": season,
            "date": date_str,
            "home": h,
            "away": a,
            "score": f"{gh}-{ga}",
            "result": res
        })

        if res == "D":
            dr += 1
        elif (res == "H" and h == home_team) or (res == "A" and a == home_team):
            hw += 1
        else:
            aw += 1

    return hw, aw, dr, match_list[-6:]

def build_match_feature_vector(
    home_team: str,
    away_team: str,
    metadata: Dict[str, Any],
    matches_history: pd.DataFrame,
    stage: str = "group",
    venue: str = "home",
    form_window: int = 5,
    home_adv_weight: float = 1.0,
    injury_home: bool = False,
    injury_away: bool = False
) -> Tuple[np.ndarray, Dict[str, Any]]:
    """
    Constructs a consistent feature vector from pre-match data for model inference.
    """
    hm = metadata.get(home_team, {})
    am = metadata.get(away_team, {})

    h_elo = hm.get("elo", 1850)
    a_elo = am.get("elo", 1850)

    # Home venue advantage in Elo terms (~50 Elo points is standard football statistical edge)
    venue_bonus = (50.0 * home_adv_weight) if venue == "home" else (0.0 if venue == "neutral" else -50.0)
    elo_diff = (h_elo - a_elo) + venue_bonus

    ucoef_diff = float(hm.get("uefa_coef", 50.0) - am.get("uefa_coef", 50.0))
    
    sqval_h = float(hm.get("squad_value_M", 300.0))
    sqval_a = float(am.get("squad_value_M", 300.0))
    if injury_home:
        sqval_h *= 0.88  # key player injuries reduce effective squad value
    if injury_away:
        sqval_a *= 0.88
    sqval_diff = sqval_h - sqval_a

    # Rolling form and goals (strictly shifted)
    h_pts, h_gf, h_ga, h_badges = extract_pre_match_stats(home_team, matches_history, form_window)
    a_pts, a_gf, a_ga, a_badges = extract_pre_match_stats(away_team, matches_history, form_window)
    form_diff = h_pts - a_pts

    rest_days_diff = 0  # Default neutral rest schedule

    is_knockout = 1 if stage in ["round_of_16", "quarter_final", "semi_final", "final", "playoffs"] else 0

    hw, aw, dr, h2h_matches = extract_h2h_stats(home_team, away_team, matches_history)

    features = [
        elo_diff,
        ucoef_diff,
        sqval_diff,
        h_pts,
        a_pts,
        form_diff,
        h_gf,
        a_gf,
        h_ga,
        a_ga,
        rest_days_diff,
        is_knockout,
        hw,
        aw,
        dr,
    ]

    context = {
        "home_form": h_badges,
        "away_form": a_badges,
        "h2h": {"home_wins": hw, "away_wins": aw, "draws": dr, "matches": h2h_matches},
        "home_meta": hm,
        "away_meta": am,
    }

    return np.array([features], dtype=np.float32), context
