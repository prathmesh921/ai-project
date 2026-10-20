"""
schemas.py - Pydantic validation and serialization schemas
"""
from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, field_validator

class TeamBase(BaseModel):
    name: str
    country: Optional[str] = "Europe"
    elo: int
    uefa_coef: float
    squad_value_M: float
    colour: str
    attack_rating: Optional[float] = 1.5
    defence_rating: Optional[float] = 0.8
    stadium: Optional[str] = "UEFA Stadium"

class TeamStats(BaseModel):
    name: str
    country: str
    elo: int
    uefa_coef: float
    squad_value_M: float
    colour: str
    stadium: str
    total_matches: int
    wins: int
    draws: int
    losses: int
    win_rate: float
    goals_scored: int
    goals_conceded: int
    goal_difference: int
    avg_goals_scored: float
    avg_goals_conceded: float
    home_record: Dict[str, int]
    away_record: Dict[str, int]
    recent_form: List[str]
    season_records: Dict[str, Dict[str, int]]

class MatchBase(BaseModel):
    id: int
    match_date: Optional[str] = None
    season: str
    stage: str
    group_name: Optional[str] = None
    home_team: str
    away_team: str
    goals_home: Optional[int] = None
    goals_away: Optional[int] = None
    result: Optional[str] = None
    status: str
    shots_home: Optional[int] = 0
    shots_away: Optional[int] = 0
    poss_home: Optional[float] = 50.0
    poss_away: Optional[float] = 50.0
    elo_diff: Optional[int] = 0
    scorers_home: Optional[List[str]] = []
    scorers_away: Optional[List[str]] = []
    xg_home: Optional[float] = 1.5
    xg_away: Optional[float] = 1.2
    yellow_cards_home: Optional[int] = 2
    yellow_cards_away: Optional[int] = 2

class MatchFilterParams(BaseModel):
    team: Optional[str] = None
    season: Optional[str] = None
    stage: Optional[str] = None
    status: Optional[str] = None
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)

class MatchPaginatedResponse(BaseModel):
    data: List[MatchBase]
    total: int
    page: int
    page_size: int
    total_pages: int

class PredictRequest(BaseModel):
    home_team: str
    away_team: str
    stage: str = Field(default="group", description="Competition phase: league_phase, group, round_of_16, quarter_final, semi_final, final")
    venue: str = Field(default="home", description="home, neutral, or away")
    model: str = Field(default="random_forest", description="random_forest, logistic_regression, xgboost, or ensemble")
    form_window: int = Field(default=5, ge=3, le=10)
    home_adv_weight: float = Field(default=1.0, ge=0.0, le=2.0)
    injury_home: bool = False
    injury_away: bool = False

    @field_validator("away_team")
    @classmethod
    def check_distinct_teams(cls, v, info):
        if "home_team" in info.data and v == info.data["home_team"]:
            raise ValueError("Home team and away team must be distinct teams.")
        return v

class FeatureExplanation(BaseModel):
    feature: str
    label: str
    importance: float
    value: float
    direction: str  # "favours home" or "favours away"

class ScorelineProbability(BaseModel):
    home_goals: int
    away_goals: int
    probability: float

class PredictResponse(BaseModel):
    home_team: str
    away_team: str
    stage: str
    venue: str
    model_used: str
    probabilities: Dict[str, float]  # H, D, A summing to 100%
    predicted_outcome: str  # "Home Win", "Draw", "Away Win"
    predicted_score: Dict[str, int]  # {"home": 2, "away": 1}
    confidence_score: float
    confidence_level: str  # "High", "Moderate", "Low"
    confidence_explanation: str
    top_features: List[FeatureExplanation]
    scorelines: List[ScorelineProbability]
    h2h: Dict[str, Any]
    home_form: List[str]
    away_form: List[str]
    bookmaker_implied_probs: Dict[str, float]
    saved_prediction_id: Optional[int] = None

class PredictionHistoryItem(BaseModel):
    id: int
    timestamp: datetime
    home_team: str
    away_team: str
    stage: str
    venue: str
    model_used: str
    prob_home_win: float
    prob_draw: float
    prob_away_win: float
    predicted_outcome: str
    predicted_score_home: int
    predicted_score_away: int
    confidence_level: str

class HeadToHeadResponse(BaseModel):
    team1: str
    team2: str
    total_meetings: int
    team1_wins: int
    team2_wins: int
    draws: int
    team1_goals: int
    team2_goals: int
    recent_matches: List[Dict[str, Any]]
    seasons_covered: List[str]

class ModelMetricsResponse(BaseModel):
    models: Dict[str, Any]
    test_period: str
    test_samples: int
    class_distribution: Dict[str, int]
    feature_importance: List[Dict[str, Any]]
    limitations: List[str]
