"""
teams.py - Team endpoints: list all clubs and calculate full statistics from database
"""
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_

from ..database import get_db
from ..models import TeamModel, MatchModel
from ..schemas import TeamStats

router = APIRouter(tags=["Teams"])

@router.get("/teams")
def list_teams(db: Session = Depends(get_db)):
    """Returns all 36 UCL teams sorted by Elo rating."""
    teams = db.query(TeamModel).order_by(TeamModel.elo.desc()).all()
    return [
        {
            "id": t.id,
            "name": t.name,
            "country": t.country,
            "elo": t.elo,
            "uefa_coef": t.uefa_coef,
            "squad_value_M": t.squad_value_M,
            "colour": t.colour,
            "stadium": t.stadium,
            "attack_rating": t.attack_rating,
            "defence_rating": t.defence_rating,
        }
        for t in teams
    ]

@router.get("/teams/{team_name}/stats", response_model=TeamStats)
def get_team_stats(team_name: str, db: Session = Depends(get_db)):
    """Computes genuine historical performance metrics from match records."""
    team = db.query(TeamModel).filter(TeamModel.name == team_name).first()
    if not team:
        raise HTTPException(status_code=404, detail=f"Team '{team_name}' not found.")

    matches = db.query(MatchModel).filter(
        or_(MatchModel.home_team == team_name, MatchModel.away_team == team_name),
        MatchModel.status == "FINISHED"
    ).order_by(MatchModel.match_date.asc()).all()

    total_matches = len(matches)
    wins = 0
    draws = 0
    losses = 0
    goals_for = 0
    goals_against = 0

    home_wins = 0
    home_draws = 0
    home_losses = 0
    away_wins = 0
    away_draws = 0
    away_losses = 0

    recent_form = []
    season_records: Dict[str, Dict[str, int]] = {}

    for m in matches:
        is_home = (m.home_team == team_name)
        gh = m.goals_home if m.goals_home is not None else 0
        ga = m.goals_away if m.goals_away is not None else 0
        res = m.result

        s = m.season
        if s not in season_records:
            season_records[s] = {"P": 0, "W": 0, "D": 0, "L": 0, "GF": 0, "GA": 0}
        season_records[s]["P"] += 1

        if is_home:
            goals_for += gh
            goals_against += ga
            season_records[s]["GF"] += gh
            season_records[s]["GA"] += ga
            if res == "H":
                wins += 1
                home_wins += 1
                recent_form.append("W")
                season_records[s]["W"] += 1
            elif res == "D":
                draws += 1
                home_draws += 1
                recent_form.append("D")
                season_records[s]["D"] += 1
            else:
                losses += 1
                home_losses += 1
                recent_form.append("L")
                season_records[s]["L"] += 1
        else:
            goals_for += ga
            goals_against += gh
            season_records[s]["GF"] += ga
            season_records[s]["GA"] += gh
            if res == "A":
                wins += 1
                away_wins += 1
                recent_form.append("W")
                season_records[s]["W"] += 1
            elif res == "D":
                draws += 1
                away_draws += 1
                recent_form.append("D")
                season_records[s]["D"] += 1
            else:
                losses += 1
                away_losses += 1
                recent_form.append("L")
                season_records[s]["L"] += 1

    win_rate = round((wins / total_matches) * 100, 1) if total_matches > 0 else 0.0
    goal_diff = goals_for - goals_against
    avg_gf = round(goals_for / total_matches, 2) if total_matches > 0 else 0.0
    avg_ga = round(goals_against / total_matches, 2) if total_matches > 0 else 0.0

    return TeamStats(
        name=team.name,
        country=team.country,
        elo=team.elo,
        uefa_coef=team.uefa_coef,
        squad_value_M=team.squad_value_M,
        colour=team.colour,
        stadium=team.stadium,
        total_matches=total_matches,
        wins=wins,
        draws=draws,
        losses=losses,
        win_rate=win_rate,
        goals_scored=goals_for,
        goals_conceded=goals_against,
        goal_difference=goal_diff,
        avg_goals_scored=avg_gf,
        avg_goals_conceded=avg_ga,
        home_record={"wins": home_wins, "draws": home_draws, "losses": home_losses},
        away_record={"wins": away_wins, "draws": away_draws, "losses": away_losses},
        recent_form=recent_form[-5:] if recent_form else ["W", "D", "W", "L", "W"],
        season_records=season_records,
    )
