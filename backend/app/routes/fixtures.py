"""
fixtures.py - Upcoming fixture integration with optional Football-Data.org API and SQLite fallback
"""
import os
import requests
from typing import List, Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import MatchModel

router = APIRouter(tags=["Fixtures"])

FOOTBALL_DATA_API_KEY = os.getenv("FOOTBALL_DATA_API_KEY", "")
API_BASE_URL = "https://api.football-data.org/v4"

@router.get("/fixtures")
def get_upcoming_fixtures(db: Session = Depends(get_db)):
    """
    Returns verified upcoming UEFA Champions League fixtures.
    Attempts authorized API if key is present; otherwise gracefully falls back to local database.
    """
    live_fixtures = []
    source = "local_verified_schedule"
    note = "Using verified UEFA Champions League schedule from database (no external API key required)."

    if FOOTBALL_DATA_API_KEY:
        try:
            headers = {"X-Auth-Token": FOOTBALL_DATA_API_KEY}
            # UEFA Champions League competition code is 'CL'
            res = requests.get(
                f"{API_BASE_URL}/competitions/CL/matches?status=SCHEDULED",
                headers=headers,
                timeout=5
            )
            if res.status_code == 200:
                data = res.json()
                for m in data.get("matches", [])[:10]:
                    live_fixtures.append({
                        "id": m.get("id"),
                        "date": m.get("utcDate", "")[:10],
                        "season": "2024-25",
                        "stage": m.get("stage", "LEAGUE_PHASE"),
                        "home_team": m.get("homeTeam", {}).get("name", "TBD"),
                        "away_team": m.get("awayTeam", {}).get("name", "TBD"),
                        "status": "SCHEDULED"
                    })
                if live_fixtures:
                    source = "football_data_org_api"
                    note = "Live fixtures fetched directly from Football-Data.org API."
            elif res.status_code == 429:
                note = "Football-Data.org API rate limit reached. Displaying local verified schedule."
        except requests.exceptions.RequestException as e:
            note = f"External API request timed out or unavailable ({str(e)}). Displaying local verified schedule."

    if not live_fixtures:
        db_fixtures = db.query(MatchModel).filter(MatchModel.status == "SCHEDULED")\
                        .order_by(MatchModel.match_date.asc()).limit(12).all()
        live_fixtures = [
            {
                "id": f.id,
                "date": f.match_date,
                "season": f.season,
                "stage": f.stage,
                "home_team": f.home_team,
                "away_team": f.away_team,
                "status": "SCHEDULED"
            }
            for f in db_fixtures
        ]

    return {
        "source": source,
        "note": note,
        "fixtures": live_fixtures,
        "total": len(live_fixtures)
    }
