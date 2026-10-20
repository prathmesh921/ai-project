"""
models.py - SQLAlchemy ORM models for UEFA Champions League Predictor
"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, Text
from .database import Base

class TeamModel(Base):
    __tablename__ = "teams"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, index=True, nullable=False)
    country = Column(String(50), default="Europe")
    elo = Column(Integer, default=1850)
    uefa_coef = Column(Float, default=50.0)
    squad_value_M = Column(Float, default=300.0)
    colour = Column(String(20), default="#003087")
    attack_rating = Column(Float, default=1.5)
    defence_rating = Column(Float, default=0.8)
    stadium = Column(String(100), default="UEFA Stadium")

class MatchModel(Base):
    __tablename__ = "matches"

    id = Column(Integer, primary_key=True, index=True)
    match_date = Column(String(20), index=True)
    season = Column(String(20), index=True, nullable=False)
    stage = Column(String(50), index=True, nullable=False)
    group_name = Column(String(20), default="A")
    home_team = Column(String(100), index=True, nullable=False)
    away_team = Column(String(100), index=True, nullable=False)
    goals_home = Column(Integer, default=0)
    goals_away = Column(Integer, default=0)
    result = Column(String(5), default="D")  # 'H', 'D', 'A'
    status = Column(String(20), default="FINISHED")  # 'FINISHED', 'SCHEDULED'
    shots_home = Column(Integer, default=0)
    shots_away = Column(Integer, default=0)
    poss_home = Column(Float, default=50.0)
    poss_away = Column(Float, default=50.0)
    rest_days_home = Column(Integer, default=6)
    rest_days_away = Column(Integer, default=6)
    home_elo = Column(Integer, default=1850)
    away_elo = Column(Integer, default=1850)
    elo_diff = Column(Integer, default=0)
    home_form5 = Column(Integer, default=7)
    away_form5 = Column(Integer, default=7)
    form_diff = Column(Integer, default=0)
    scorers_home = Column(Text, default="[]")  # JSON list of goalscorers e.g. ["Vinicius Jr 34'", "Bellingham 82'"]
    scorers_away = Column(Text, default="[]")  # JSON list of goalscorers e.g. ["Haaland 19'"]
    xg_home = Column(Float, default=1.5)
    xg_away = Column(Float, default=1.2)
    yellow_cards_home = Column(Integer, default=2)
    yellow_cards_away = Column(Integer, default=2)
    red_cards_home = Column(Integer, default=0)
    red_cards_away = Column(Integer, default=0)
    corners_home = Column(Integer, default=6)
    corners_away = Column(Integer, default=4)

class PredictionModel(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    home_team = Column(String(100), index=True, nullable=False)
    away_team = Column(String(100), index=True, nullable=False)
    stage = Column(String(50), default="group")
    venue = Column(String(20), default="home")
    model_used = Column(String(50), default="random_forest")
    prob_home_win = Column(Float, nullable=False)
    prob_draw = Column(Float, nullable=False)
    prob_away_win = Column(Float, nullable=False)
    predicted_outcome = Column(String(10), nullable=False)  # 'HOME_WIN', 'DRAW', 'AWAY_WIN'
    predicted_score_home = Column(Integer, default=1)
    predicted_score_away = Column(Integer, default=1)
    confidence_score = Column(Float, default=0.5)
    confidence_level = Column(String(20), default="Moderate")
    top_features_json = Column(Text, default="[]")

class DatasetMetaModel(Base):
    __tablename__ = "dataset_metadata"

    id = Column(Integer, primary_key=True)
    source_name = Column(String(100), default="UEFA Official Historical Match Database & Open Football Data")
    last_updated = Column(DateTime, default=datetime.utcnow)
    total_matches = Column(Integer, default=0)
    total_teams = Column(Integer, default=0)
    seasons_covered = Column(String(200), default="2015-16 to 2024-25")
    model_train_date = Column(DateTime, default=datetime.utcnow)
    baseline_accuracy = Column(Float, default=0.5405)
    best_model_accuracy = Column(Float, default=0.5405)
