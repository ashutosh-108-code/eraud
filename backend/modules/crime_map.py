import json
import os

DATA_PATH = os.path.join(
    os.path.dirname(__file__),
    "..", "data", "heatmap_data.json"
)

print("Loading heatmap data...")
with open(DATA_PATH) as f:
    HEATMAP_DATA = json.load(f)
print("Heatmap data loaded ✅")

def get_all() -> dict:
    return HEATMAP_DATA

def get_summary() -> dict:
    return HEATMAP_DATA["summary"]

def get_states() -> dict:
    return {"states": HEATMAP_DATA["states"]}

def get_state(state_name: str) -> dict:
    state = next(
        (s for s in HEATMAP_DATA["states"] if s["sender_state"].lower() == state_name.lower()),
        None
    )
    if not state:
        return {"error": "State not found"}
    return state
