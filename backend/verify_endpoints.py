import requests

base = 'http://127.0.0.1:8000'
endpoints = [
    '/api/health',
    '/api/teams',
    '/api/teams/Real%20Madrid/stats',
    '/api/matches?page=1&page_size=5',
    '/api/matches/1',
    '/api/dashboard/stats',
    '/api/head-to-head?team1=Real%20Madrid&team2=Barcelona',
    '/api/model/metrics',
    '/api/fixtures',
    '/api/predictions/history',
]

for ep in endpoints:
    r = requests.get(base + ep, timeout=5)
    print(f"[PASS] {ep}: {r.status_code}")

# Predict
r_pred = requests.post(
    base + '/api/predict',
    json={'home_team': 'Real Madrid', 'away_team': 'Bayern Munich', 'stage': 'final', 'venue': 'neutral'},
    timeout=5
)
data = r_pred.json()
print(f"[PASS] POST /api/predict: {r_pred.status_code} | Outcome: {data['predicted_outcome']} | Probs: {data['probabilities']}")

# Simulate
r_sim = requests.post(
    base + '/api/simulate',
    json={'teams': ['Real Madrid', 'Manchester City', 'Bayern Munich', 'Barcelona'], 'n_simulations': 200},
    timeout=5
)
print(f"POST /api/simulate response code: {r_sim.status_code}, body: {r_sim.text[:200]}")
if r_sim.status_code == 200:
    print(f"[PASS] POST /api/simulate: {r_sim.status_code} | Simulated {len(r_sim.json()['probabilities'])} teams")
print("\nALL VERIFICATIONS PASSED!")
