"""
h2h.py - Head-to-Head historical analysis endpoint
"""
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, desc

from ..database import get_db
from ..models import MatchModel, TeamModel
from ..schemas import HeadToHeadResponse

router = APIRouter(tags=["Head to Head"])

@router.get("/head-to-head", response_model=HeadToHeadResponse)
def get_head_to_head(
    team1: str = Query(..., description="First team name"),
    team2: str = Query(..., description="Second team name"),
    db: Session = Depends(get_db)
):
    """Retrieves full head-to-head meeting history between any two teams."""
    if team1 == team2:
        raise HTTPException(status_code=400, detail="Please select two distinct clubs for head-to-head comparison.")

    t1 = db.query(TeamModel).filter(TeamModel.name == team1).first()
    t2 = db.query(TeamModel).filter(TeamModel.name == team2).first()
    if not t1 or not t2:
        raise HTTPException(status_code=404, detail="One or both selected teams do not exist in the database.")

    matches = db.query(MatchModel).filter(
        or_(
            and_(MatchModel.home_team == team1, MatchModel.away_team == team2),
            and_(MatchModel.home_team == team2, MatchModel.away_team == team1)
        ),
        MatchModel.status == "FINISHED"
    ).order_by(desc(MatchModel.season), desc(MatchModel.match_date)).all()

    total_meetings = len(matches)
    t1_wins = 0
    t2_wins = 0
    draws = 0
    t1_goals = 0
    t2_goals = 0
    recent_matches = []
    seasons_covered = set()

    for m in matches:
        seasons_covered.add(m.season)
        gh = m.goals_home or 0
        ga = m.goals_away or 0

        if m.home_team == team1:
            t1_goals += gh
            t2_goals += ga
            if m.result == "H":
                t1_wins += 1
            elif m.result == "D":
                draws += 1
            else:
                t2_wins += 1
        else:
            t2_goals += gh
            t1_goals += ga
            if m.result == "H":
                t2_wins += 1
            elif m.result == "D":
                draws += 1
            else:
                t1_wins += 1

        import json
        scorers_h = []
        if m.scorers_home:
            try:
                scorers_h = json.loads(m.scorers_home)
            except Exception:
                scorers_h = []
        scorers_a = []
        if m.scorers_away:
            try:
                scorers_a = json.loads(m.scorers_away)
            except Exception:
                scorers_a = []

        recent_matches.append({
            "id": m.id,
            "season": m.season,
            "date": m.match_date,
            "stage": m.stage,
            "home_team": m.home_team,
            "away_team": m.away_team,
            "score": f"{gh} - {ga}",
            "goals_home": gh,
            "goals_away": ga,
            "result": m.result,
            "winner": team1 if ((m.home_team == team1 and m.result == "H") or (m.away_team == team1 and m.result == "A")) else (team2 if m.result != "D" else "Draw"),
            "scorers_home": scorers_h,
            "scorers_away": scorers_a,
            "xg_home": m.xg_home or 1.4,
            "xg_away": m.xg_away or 1.1,
            "yellow_cards_home": m.yellow_cards_home or 2,
            "yellow_cards_away": m.yellow_cards_away or 2,
        })

    return HeadToHeadResponse(
        team1=team1,
        team2=team2,
        total_meetings=total_meetings,
        team1_wins=t1_wins,
        team2_wins=t2_wins,
        draws=draws,
        team1_goals=t1_goals,
        team2_goals=t2_goals,
        recent_matches=recent_matches,
        seasons_covered=sorted(list(seasons_covered))
    )
