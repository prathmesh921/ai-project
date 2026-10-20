// api.ts - Full-stack API client for UEFA Champions League AI Predictor
import axios from 'axios';

let rawApiUrl = (import.meta.env.VITE_API_URL as string) || '';

// If running in production on onrender.com and no env var was set, automatically connect to deployed backend
if (!rawApiUrl && typeof window !== 'undefined' && window.location.hostname.includes('onrender.com')) {
  rawApiUrl = 'https://ucl-predictor-backend.onrender.com';
} else if (!rawApiUrl) {
  rawApiUrl = 'http://localhost:8000';
}

// Ensure protocol is present
if (rawApiUrl && !rawApiUrl.startsWith('http://') && !rawApiUrl.startsWith('https://')) {
  rawApiUrl = `https://${rawApiUrl}`;
}

export const BASE_URL = rawApiUrl;

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ── Types ───────────────────────────────────────────────────────────────────

export interface TeamItem {
  id: number;
  name: string;
  country: string;
  elo: number;
  uefa_coef: number;
  squad_value_M: number;
  colour: string;
  stadium: string;
  attack_rating?: number;
  defence_rating?: number;
}

export interface TeamStats {
  name: string;
  country: string;
  elo: number;
  uefa_coef: number;
  squad_value_M: number;
  colour: string;
  stadium: string;
  total_matches: number;
  wins: number;
  draws: number;
  losses: number;
  win_rate: number;
  goals_scored: number;
  goals_conceded: number;
  goal_difference: number;
  avg_goals_scored: number;
  avg_goals_conceded: number;
  home_record: { wins: number; draws: number; losses: number };
  away_record: { wins: number; draws: number; losses: number };
  recent_form: string[];
  season_records: Record<string, { P: number; W: number; D: number; L: number; GF: number; GA: number }>;
}

export interface MatchItem {
  id: number;
  match_date: string;
  season: string;
  stage: string;
  group_name?: string;
  home_team: string;
  away_team: string;
  goals_home: number | null;
  goals_away: number | null;
  result: string | null;
  status: string;
  shots_home?: number;
  shots_away?: number;
  poss_home?: number;
  poss_away?: number;
  elo_diff?: number;
  scorers_home?: string[];
  scorers_away?: string[];
  xg_home?: number;
  xg_away?: number;
  yellow_cards_home?: number;
  yellow_cards_away?: number;
  red_cards_home?: number;
  red_cards_away?: number;
}

export interface MatchPaginatedResponse {
  data: MatchItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface DashboardStats {
  total_historical_matches: number;
  total_teams: number;
  seasons_count: number;
  total_goals_scored: number;
  avg_goals_per_match: number;
  home_win_rate: number;
  draw_rate: number;
  away_win_rate: number;
  class_distribution: { H: number; D: number; A: number };
  recent_matches: {
    id: number;
    date: string;
    season: string;
    home_team: string;
    away_team: string;
    score: string;
    result: string;
  }[];
  upcoming_fixtures: {
    id: number;
    date: string;
    season: string;
    stage: string;
    home_team: string;
    away_team: string;
    status: string;
  }[];
  latest_predictions: {
    id: number;
    timestamp: string;
    home_team: string;
    away_team: string;
    predicted_outcome: string;
    score: string;
    confidence: string;
  }[];
}

export interface PredictRequest {
  home_team: string;
  away_team: string;
  stage?: string;
  venue?: string;
  model?: string;
  form_window?: number;
  home_adv_weight?: number;
  injury_home?: boolean;
  injury_away?: boolean;
}

export interface FeatureExplanation {
  feature: string;
  label: string;
  importance: number;
  value: number;
  direction: string;
}

export interface ScorelineProbability {
  home_goals: number;
  away_goals: number;
  probability: number;
}

export interface PredictResponse {
  home_team: string;
  away_team: string;
  stage: string;
  venue: string;
  model_used: string;
  probabilities: { H: number; D: number; A: number };
  predicted_outcome: string;
  predicted_score: { home: number; away: number };
  confidence_score: number;
  confidence_level: string;
  confidence_explanation: string;
  top_features: FeatureExplanation[];
  scorelines: ScorelineProbability[];
  h2h: {
    home_wins: number;
    away_wins: number;
    draws: number;
    matches: { season: string; date: string; home: string; away: string; score: string; result: string }[];
  };
  home_form: string[];
  away_form: string[];
  bookmaker_implied_probs: { H: number; D: number; A: number };
  saved_prediction_id?: number | null;
}

export interface PredictionHistoryItem {
  id: number;
  timestamp: string;
  home_team: string;
  away_team: string;
  stage: string;
  venue: string;
  model_used: string;
  prob_home_win: number;
  prob_draw: number;
  prob_away_win: number;
  predicted_outcome: string;
  predicted_score_home: number;
  predicted_score_away: number;
  confidence_level: string;
}

export interface HeadToHeadResponse {
  team1: string;
  team2: string;
  total_meetings: number;
  team1_wins: number;
  team2_wins: number;
  draws: number;
  team1_goals: number;
  team2_goals: number;
  recent_matches: {
    id: number;
    season: string;
    date: string;
    stage: string;
    home_team: string;
    away_team: string;
    score: string;
    goals_home?: number;
    goals_away?: number;
    result: string;
    winner: string;
    scorers_home?: string[];
    scorers_away?: string[];
    xg_home?: number;
    xg_away?: number;
    yellow_cards_home?: number;
    yellow_cards_away?: number;
  }[];
  seasons_covered: string[];
}

export interface ModelMetricsResponse {
  models: Record<
    string,
    {
      accuracy: number;
      f1: number;
      log_loss: number;
      precision: number;
      recall: number;
      confusion_matrix: number[][];
      class_report: Record<string, { precision: number; recall: number; 'f1-score': number; support: number }>;
    }
  >;
  feature_importance: { feature: string; importance: number; std: number }[];
  metadata: {
    test_period: string;
    train_period: string;
    train_samples: number;
    test_samples: number;
    class_distribution_test: Record<string, number>;
    feature_count: number;
    features: string[];
    split_method: string;
  };
  calibration: { bin: string; predicted_prob: number; observed_win_rate: number; count: number }[];
  limitations: string[];
  baseline_model: string;
  primary_model: string;
  advanced_model: string;
}

export interface FixturesResponse {
  source: string;
  note: string;
  fixtures: {
    id: number;
    date: string;
    season: string;
    stage: string;
    home_team: string;
    away_team: string;
    status: string;
  }[];
  total: number;
}

export interface SimResponse {
  teams: string[];
  n_simulations: number;
  probabilities: Record<string, { qf: number; sf: number; final: number; winner: number }>;
}

// ── API Functions ───────────────────────────────────────────────────────────

export async function fetchHealth() {
  const { data } = await api.get('/api/health');
  return data;
}

export async function fetchTeams(): Promise<TeamItem[]> {
  const { data } = await api.get('/api/teams');
  return data;
}

export async function fetchTeamStats(teamName: string): Promise<TeamStats> {
  const { data } = await api.get(`/api/teams/${encodeURIComponent(teamName)}/stats`);
  return data;
}

export async function fetchMatches(params: {
  team?: string;
  season?: string;
  stage?: string;
  status?: string;
  page?: number;
  page_size?: number;
}): Promise<MatchPaginatedResponse> {
  const { data } = await api.get('/api/matches', { params });
  return data;
}

export async function fetchMatchDetail(matchId: number) {
  const { data } = await api.get(`/api/matches/${matchId}`);
  return data;
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const { data } = await api.get('/api/dashboard/stats');
  return data;
}

export async function fetchHeadToHead(team1: string, team2: string): Promise<HeadToHeadResponse> {
  const { data } = await api.get('/api/head-to-head', { params: { team1, team2 } });
  return data;
}

export async function predictMatch(payload: PredictRequest): Promise<PredictResponse> {
  const { data } = await api.post('/api/predict', payload);
  return data;
}

export async function fetchPredictionHistory(params?: { team?: string; limit?: number }): Promise<PredictionHistoryItem[]> {
  const { data } = await api.get('/api/predictions/history', { params });
  return data;
}

export async function deletePrediction(id: number) {
  const { data } = await api.delete(`/api/predictions/history/${id}`);
  return data;
}

export async function clearAllPredictions() {
  const { data } = await api.delete('/api/predictions/history');
  return data;
}

export async function fetchModelMetrics(): Promise<ModelMetricsResponse> {
  const { data } = await api.get('/api/model/metrics');
  return data;
}

export async function fetchFixtures(): Promise<FixturesResponse> {
  const { data } = await api.get('/api/fixtures');
  return data;
}

export async function simulateTournament(teams: string[], n_simulations: number = 1000): Promise<SimResponse> {
  const { data } = await api.post('/api/simulate', { teams, n_simulations });
  return data;
}

export const getTeams = fetchTeams;
export const predict = predictMatch;

export async function importMatchesCSV(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await api.post('/api/matches/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}
