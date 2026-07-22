from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import os
import tempfile
from dotenv import load_dotenv
import re
import json
from datetime import datetime
from pathlib import Path

load_dotenv()

from modules.scam_classifier import classify_text, get_metrics
from modules.fraud_shield import get_chat_response
from modules.fraud_graph import get_network, get_stats, search_network, generate_report
from modules.crime_map import get_all as get_heatmap_all, get_summary as get_heatmap_summary, get_states as get_heatmap_states, get_state as get_heatmap_state
from modules.voice_analyzer import transcribe_and_analyze, get_mock_result
from modules import db_adapter

# ── Pipeline Configuration ─────────────────────────────────────

PIPELINE_DIR        = Path(__file__).parent / "pipeline_data"
TRAINING_DATA_FILE  = PIPELINE_DIR / "new_training_data.json"
COMPLAINTS_LOG_FILE = PIPELINE_DIR / "complaints_log.json"

PIPELINE_DIR.mkdir(exist_ok=True)
if not TRAINING_DATA_FILE.exists():
    TRAINING_DATA_FILE.write_text("[]")
if not COMPLAINTS_LOG_FILE.exists():
    COMPLAINTS_LOG_FILE.write_text("[]")

# Try to load persisted state from Supabase (seamless production data)
if db_adapter.is_available():
    network_supabase = db_adapter.load_app_state("network_data")
    if network_supabase:
        from modules.fraud_graph import NETWORK_DATA, DATA_PATH
        NETWORK_DATA.clear()
        NETWORK_DATA.update(network_supabase)
        with open(DATA_PATH, "w") as f:
            json.dump(NETWORK_DATA, f, indent=2)
        print("Network data loaded from Supabase ✅")

    heatmap_supabase = db_adapter.load_app_state("heatmap_data")
    if heatmap_supabase:
        from modules.crime_map import HEATMAP_DATA, DATA_PATH as HEATMAP_PATH
        HEATMAP_DATA.clear()
        HEATMAP_DATA.update(heatmap_supabase)
        with open(HEATMAP_PATH, "w") as f:
            json.dump(HEATMAP_DATA, f, indent=2)
        print("Heatmap data loaded from Supabase ✅")

app = FastAPI(
    title       = "Fraud Shield API",
    description = "Unified fraud detection intelligence API",
    version     = "1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins  = ["*"],
    allow_methods  = ["*"],
    allow_headers  = ["*"],
)

class ClassifyRequest(BaseModel):
    text: str

class Message(BaseModel):
    role:    str
    content: str

class ChatRequest(BaseModel):
    message: str
    history: List[Message] = []

class SearchRequest(BaseModel):
    query: str

class ReportRequest(BaseModel):
    node_id: str

class ComplaintRequest(BaseModel):
    message:      str
    location:     Optional[str] = None
    phone_number: Optional[str] = None

# ── Pipeline Helpers ──────────────────────────────────────────

def extract_phone_numbers(text: str) -> list:
    patterns = [
        r'\b[6-9]\d{9}\b',
        r'\b0\d{10}\b',
        r'\+91[\s-]?\d{10}\b',
        r'\b\d{4}[\s-]\d{3}[\s-]\d{3}\b',
    ]
    found = []
    for pattern in patterns:
        matches = re.findall(pattern, text)
        for m in matches:
            clean = re.sub(r'[\s\-\+]', '', m)
            if clean.startswith('91') and len(clean) == 12:
                clean = clean[2:]
            if clean not in found:
                found.append(clean)
    return found

def detect_state_from_text(text: str) -> str:
    STATE_KEYWORDS = {
        "Andhra Pradesh":   ["andhra pradesh", "visakhapatnam", "vijayawada", "guntur", "nellore", "kurnool", "kakinada", "tirupati"],
        "Arunachal Pradesh":["arunachal pradesh", "itanagar", "tawang", "namsai"],
        "Assam":            ["assam", "guwahati", "dispur", "silchar", "jorhat", "dibrugarh"],
        "Bihar":            ["bihar", "patna", "gaya", "bhagalpur", "muzaffarpur", "darbhanga", "purnia"],
        "Chhattisgarh":     ["chhattisgarh", "raipur", "bilaspur", "bhilai", "korba", "raigarh"],
        "Delhi":            ["delhi", "new delhi", "ncr", "noida", "gurgaon", "faridabad", "dwarka", "rohini"],
        "Goa":              ["goa", "panaji", "panjim", "margao", "vasco", "ponda"],
        "Gujarat":          ["gujarat", "ahmedabad", "surat", "vadodara", "rajkot", "bhavnagar", "jamnagar"],
        "Haryana":          ["haryana", "gurugram", "faridabad", "panipat", "ambala", "hisar", "karnal", "sonipat"],
        "Himachal Pradesh": ["himachal pradesh", "shimla", "manali", "dharamshala", "kullu", "mandi", "hamirpur"],
        "Jharkhand":        ["jharkhand", "ranchi", "jamshedpur", "dhanbad", "bokaro", "deoghar", "hazaribagh"],
        "Karnataka":        ["karnataka", "bangalore", "bengaluru", "mysuru", "hubli", "mangalore", "mangaluru", "belgaum", "davangere"],
        "Kerala":           ["kerala", "kochi", "cochin", "trivandrum", "thiruvananthapuram", "kozhikode", "calicut", "kollam", "alappuzha"],
        "Madhya Pradesh":   ["madhya pradesh", "bhopal", "indore", "gwalior", "jabalpur", "ujjain", "sagar", "rewa"],
        "Maharashtra":      ["maharashtra", "mumbai", "pune", "nagpur", "nashik", "thane", "aurangabad", "solapur", "kolhapur", "navi mumbai"],
        "Manipur":          ["manipur", "imphal", "bishnupur", "thoubal"],
        "Meghalaya":        ["meghalaya", "shillong", "tura", "nongstoin"],
        "Mizoram":          ["mizoram", "aizawl", "lunglei", "champhai"],
        "Nagaland":         ["nagaland", "kohima", "dimapur", "mokokchung"],
        "Odisha":           ["odisha", "orissa", "bhubaneswar", "bhubaneshwar", "cuttack", "rourkela", "puri", "sambalpur"],
        "Punjab":           ["punjab", "chandigarh", "ludhiana", "amritsar", "jalandhar", "patiala", "bathinda", "mohali"],
        "Rajasthan":        ["rajasthan", "jaipur", "jodhpur", "udaipur", "kota", "ajmer", "bikaner", "jaisalmer"],
        "Sikkim":           ["sikkim", "gangtok", "namchi", "mangan"],
        "Tamil Nadu":       ["tamil nadu", "chennai", "madras", "coimbatore", "madurai", "salem", "trichy", "tiruchirappalli", "tirunelveli"],
        "Telangana":        ["telangana", "hyderabad", "secunderabad", "warangal", "nizamabad", "karimnagar", "khammam"],
        "Tripura":          ["tripura", "agartala", "dharamnagar", "kailashahar"],
        "Uttar Pradesh":    ["uttar pradesh", "lucknow", "kanpur", "agra", "varanasi", "allahabad", "prayagraj", "ghaziabad", "meerut", "noida", "bareilly", "aligarh", "moradabad"],
        "Uttarakhand":      ["uttarakhand", "dehradun", "haridwar", "rishikesh", "nainital", "haldwani", "roorkee"],
        "West Bengal":      ["west bengal", "kolkata", "calcutta", "howrah", "siliguri", "durgapur", "asansol", "bardhaman"],
    }
    text_lower = text.lower()
    for state, keywords in STATE_KEYWORDS.items():
        for kw in keywords:
            if kw in text_lower:
                return state
    return None

def update_fraud_graph(phone_numbers: list, scam_type: str, complaint_id: str) -> dict:
    if not phone_numbers:
        return {"updated": False, "reason": "no_phone_numbers_found", "nodes_added": 0, "nodes_updated": 0}

    from modules.fraud_graph import NETWORK_DATA, DATA_PATH

    nodes_added = 0
    nodes_updated = 0
    affected_ids = []

    for phone in phone_numbers:
        existing = next(
            (n for n in NETWORK_DATA["nodes"]
             if str(n.get("phone", "")) == phone or
                str(n.get("number", "")) == phone),
            None
        )

        if existing:
            existing["complaints"] = existing.get("complaints", 0) + 1
            existing["last_reported"] = datetime.now().isoformat()
            existing["scam_types"] = list(set(existing.get("scam_types", []) + [scam_type]))
            nodes_updated += 1
            affected_ids.append(existing["id"])
        else:
            RING_COLORS = ["#ef4444", "#f97316", "#8b5cf6"]
            new_node_id = f"suspect_{complaint_id}_{phone[-4:]}"
            ring_id = len([n for n in NETWORK_DATA["nodes"] if n["type"] == "mastermind"]) % 3

            new_node = {
                "id": new_node_id,
                "type": "operator",
                "ring": ring_id,
                "ring_color": RING_COLORS[ring_id],
                "phone": phone,
                "scam_types": [scam_type],
                "complaints": 1,
                "status": "under_investigation",
                "risk_score": 75,
                "first_reported": datetime.now().isoformat(),
                "last_reported": datetime.now().isoformat(),
                "source": "citizen_complaint",
                "complaint_id": complaint_id,
            }
            NETWORK_DATA["nodes"].append(new_node)
            nodes_added += 1
            affected_ids.append(new_node_id)

    with open(DATA_PATH, "w") as f:
        json.dump(NETWORK_DATA, f, indent=2)

    try:
        db_adapter.save_app_state("network_data", NETWORK_DATA)
    except Exception:
        pass

    return {
        "updated": True,
        "nodes_added": nodes_added,
        "nodes_updated": nodes_updated,
        "affected_ids": affected_ids,
        "phones_found": phone_numbers,
    }

STATE_COORDS = {
    "Andhra Pradesh":    [15.91, 79.73],
    "Arunachal Pradesh": [27.00, 93.50],
    "Assam":             [26.20, 92.94],
    "Bihar":             [25.10, 85.31],
    "Chhattisgarh":      [21.28, 81.63],
    "Delhi":             [28.70, 77.10],
    "Goa":               [15.49, 73.83],
    "Gujarat":           [22.25, 71.19],
    "Haryana":           [29.06, 76.09],
    "Himachal Pradesh":  [31.10, 77.17],
    "Jharkhand":         [23.61, 85.28],
    "Karnataka":         [15.31, 75.71],
    "Kerala":            [10.85, 76.27],
    "Madhya Pradesh":    [23.47, 77.96],
    "Maharashtra":       [19.75, 75.71],
    "Manipur":           [24.66, 93.91],
    "Meghalaya":         [25.47, 91.37],
    "Mizoram":           [23.16, 92.94],
    "Nagaland":          [25.67, 94.11],
    "Odisha":            [20.95, 84.23],
    "Punjab":            [30.90, 75.86],
    "Rajasthan":         [27.02, 74.21],
    "Sikkim":            [27.53, 88.51],
    "Tamil Nadu":        [11.12, 78.65],
    "Telangana":         [18.11, 79.01],
    "Tripura":           [23.94, 91.98],
    "Uttar Pradesh":     [26.84, 80.94],
    "Uttarakhand":       [30.06, 79.02],
    "West Bengal":       [22.98, 87.85],
}

def update_heatmap(state: str, scam_type: str) -> dict:
    if not state:
        return {"updated": False, "reason": "state_not_detected"}

    from modules.crime_map import HEATMAP_DATA, DATA_PATH as HEATMAP_PATH

    state_entry = next((s for s in HEATMAP_DATA["states"] if s["sender_state"] == state), None)

    if state_entry:
        state_entry["fraud_count"] += 1
        state_entry["total_transactions"] += 1
        state_entry["fraud_rate"] = round(state_entry["fraud_count"] / state_entry["total_transactions"] * 100, 3)
        if state_entry["fraud_count"] >= 60:
            state_entry["risk_level"] = "high"
        elif state_entry["fraud_count"] >= 30:
            state_entry["risk_level"] = "medium"
        else:
            state_entry["risk_level"] = "low"
        state_entry["last_updated"] = datetime.now().isoformat()
    else:
        coords = STATE_COORDS.get(state, [20.0, 78.0])
        state_entry = {
            "sender_state": state,
            "total_transactions": 1,
            "fraud_count": 1,
            "total_amount": 0,
            "avg_amount": 0,
            "fraud_amount": 0,
            "fraud_rate": 100.0,
            "risk_level": "low",
            "lat": coords[0],
            "lng": coords[1],
            "top_fraud_type": scam_type,
            "top_merchant_category": "Unknown",
            "last_updated": datetime.now().isoformat(),
        }
        HEATMAP_DATA["states"].append(state_entry)
        HEATMAP_DATA["summary"]["states_affected"] = len(HEATMAP_DATA["states"])

    HEATMAP_DATA["summary"]["total_fraud"] += 1
    HEATMAP_DATA["summary"]["total_transactions"] += 1

    with open(HEATMAP_PATH, "w") as f:
        json.dump(HEATMAP_DATA, f, indent=2)

    try:
        db_adapter.save_app_state("heatmap_data", HEATMAP_DATA)
    except Exception:
        pass

    return {
        "updated": True,
        "state": state,
        "new_count": state_entry["fraud_count"],
        "risk_level": state_entry["risk_level"],
    }

async def generate_alert(complaint_text: str, bert_result: dict, phone_numbers: list, state: str, complaint_id: str) -> dict:
    from groq import Groq
    import os

    client = Groq(api_key=os.getenv("GROQ_API_KEY"))

    phone_str = ", ".join(phone_numbers) if phone_numbers else "Not detected"
    state_str = state or "Not detected"

    prompt = f"""
You are a cyber crime intelligence analyst for India.
Generate a structured law enforcement alert based on
this citizen complaint.

COMPLAINT ID: {complaint_id}
TIMESTAMP: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
SCAM TYPE: {bert_result['label']}
           ({bert_result['confidence']}% confidence)
LOCATION: {state_str}
SUSPECT NUMBERS: {phone_str}
COMPLAINT TEXT: {complaint_text}

Return ONLY valid JSON with no markdown:
{{
  "alert_id": "{complaint_id}",
  "timestamp": "{datetime.now().isoformat()}",
  "priority": "HIGH" or "MEDIUM" or "LOW",
  "scam_type": "{bert_result['label']}",
  "confidence": {bert_result['confidence']},
  "location": "{state_str}",
  "suspect_numbers": {json.dumps(phone_numbers)},
  "summary": "2 sentence summary of the complaint",
  "red_flags": ["list of specific red flags detected"],
  "recommended_actions": [
    "specific action 1 for law enforcement",
    "specific action 2",
    "specific action 3"
  ],
  "case_type": "IPC section or IT Act section that applies",
  "escalate_to": "which agency should handle this",
  "victim_advisory": "what the victim should do right now",
  "report_to": "cybercrime.gov.in",
  "helpline": "1930"
}}
"""

    try:
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2,
            max_tokens=800,
        )

        raw = response.choices[0].message.content.strip()

        if "```" in raw:
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]

        alert = json.loads(raw.strip())
        return {"success": True, "alert": alert}

    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "alert": {
                "alert_id": complaint_id,
                "timestamp": datetime.now().isoformat(),
                "priority": "HIGH" if bert_result["is_scam"] else "LOW",
                "scam_type": bert_result["label"],
                "confidence": bert_result["confidence"],
                "location": state_str,
                "suspect_numbers": phone_numbers,
                "summary": f"Citizen reported {bert_result['label']} from {state_str}",
                "red_flags": [],
                "recommended_actions": [
                    "Verify complaint details",
                    "Cross-reference suspect numbers",
                    "File case if verified",
                ],
                "report_to": "cybercrime.gov.in",
                "helpline": "1930",
            },
        }

def save_training_example(text: str, label: str, confidence: float, complaint_id: str) -> dict:
    try:
        with open(TRAINING_DATA_FILE) as f:
            existing = json.load(f)

        new_example = {
            "id": complaint_id,
            "text": text,
            "label": label,
            "confidence": confidence,
            "source": "citizen_complaint",
            "verified": confidence >= 90,
            "timestamp": datetime.now().isoformat(),
        }

        existing.append(new_example)

        with open(TRAINING_DATA_FILE, "w") as f:
            json.dump(existing, f, indent=2)

        try:
            db_adapter.save_training_example(new_example)
        except Exception:
            pass

        return {"saved": True, "total_examples": len(existing), "example_id": complaint_id}

    except Exception as e:
        return {"saved": False, "error": str(e)}

# ── Health ────────────────────────────────────────────────────

@app.get("/")
def root():
    return {
        "status":  "Fraud Shield API running",
        "version": "1.0.0",
        "modules": ["scam_classifier", "fraud_shield", "fraud_graph", "crime_map", "voice_analyzer"]
    }

@app.get("/health")
def health():
    return {
        "status":        "online",
        "bert_model":    "loaded",
        "bert_accuracy": "94.34%",
        "modules":       5
    }

# ── Scam Classifier ───────────────────────────────────────────

@app.post("/classify")
def classify(req: ClassifyRequest):
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")
    return classify_text(req.text)

@app.get("/metrics")
def metrics():
    return get_metrics()

# ── Fraud Shield Chatbot ──────────────────────────────────────

@app.post("/chat")
async def chat(req: ChatRequest):
    if not req.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")
    history = [{"role": m.role, "content": m.content} for m in req.history]
    return await get_chat_response(req.message, history)

# ── Fraud Network Graph ───────────────────────────────────────

@app.get("/network")
def network():
    return get_network()

@app.get("/network/stats")
def network_stats():
    return get_stats()

@app.post("/network/search")
def network_search(req: SearchRequest):
    if not req.query.strip():
        raise HTTPException(status_code=400, detail="Search query cannot be empty")
    return search_network(req.query)

@app.post("/network/report")
def network_report(req: ReportRequest):
    return generate_report(req.node_id)

# ── Crime Map ─────────────────────────────────────────────────

@app.get("/heatmap")
def heatmap():
    return get_heatmap_all()

@app.get("/heatmap/summary")
def heatmap_summary():
    return get_heatmap_summary()

@app.get("/heatmap/states")
def heatmap_states():
    return get_heatmap_states()

@app.get("/heatmap/state/{state_name}")
def heatmap_state(state_name: str):
    return get_heatmap_state(state_name)

# ── Voice Analyzer ────────────────────────────────────────────

@app.post("/voice/analyze")
async def voice_analyze(audio: UploadFile = File(...)):
    allowed = ["audio/mpeg", "audio/wav", "audio/mp4", "audio/ogg", "audio/webm", "audio/m4a"]
    suffix_map = {
        "audio/mpeg": ".mp3", "audio/wav": ".wav", "audio/mp4": ".m4a",
        "audio/ogg": ".ogg", "audio/webm": ".webm", "audio/m4a": ".m4a"
    }
    suffix = suffix_map.get(audio.content_type, ".mp3")

    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        content = await audio.read()
        tmp.write(content)
        tmp_path = tmp.name

    try:
        result = await transcribe_and_analyze(tmp_path)
    finally:
        os.unlink(tmp_path)

    return result

@app.get("/voice/demo/{scenario}")
def voice_demo(scenario: str = "digital_arrest"):
    return get_mock_result(scenario)

@app.get("/voice/health")
def voice_health():
    return {"status": "Voice Analyzer ready"}

# ── Intelligence Pipeline ─────────────────────────────────────

@app.post("/analyze-complaint")
async def analyze_complaint(req: ComplaintRequest):
    if not req.message.strip():
        raise HTTPException(status_code=400, detail="Complaint text cannot be empty")

    complaint_id = f"CMP{datetime.now().strftime('%Y%m%d%H%M%S')}"
    start_time = datetime.now()

    # Step 1: Classify with BERT
    bert_result = classify_text(req.message)

    # Step 2: Extract entities
    phone_numbers = extract_phone_numbers(req.message)
    if req.phone_number:
        clean = re.sub(r'[\s\-\+]', '', req.phone_number)
        if clean not in phone_numbers:
            phone_numbers.insert(0, clean)

    state = req.location or detect_state_from_text(req.message)

    # Step 3: Update fraud graph
    graph_update = update_fraud_graph(
        phone_numbers=phone_numbers,
        scam_type=bert_result["label"],
        complaint_id=complaint_id,
    )

    # Step 4: Update heatmap
    heatmap_update = update_heatmap(state=state, scam_type=bert_result["label"])

    # Step 5: Generate alert
    alert_result = await generate_alert(
        complaint_text=req.message,
        bert_result=bert_result,
        phone_numbers=phone_numbers,
        state=state,
        complaint_id=complaint_id,
    )

    # Step 6: Save training example
    training_result = save_training_example(
        text=req.message,
        label=bert_result["label"],
        confidence=bert_result["confidence"],
        complaint_id=complaint_id,
    )

    # Log the complaint
    try:
        with open(COMPLAINTS_LOG_FILE) as f:
            log = json.load(f)
        log.append({
            "complaint_id": complaint_id,
            "timestamp": datetime.now().isoformat(),
            "label": bert_result["label"],
            "confidence": bert_result["confidence"],
            "state": state,
            "phones": phone_numbers,
            "graph_updated": graph_update["updated"],
            "heatmap_updated": heatmap_update["updated"],
            "alert_generated": alert_result["success"],
            "training_saved": training_result["saved"],
        })
        with open(COMPLAINTS_LOG_FILE, "w") as f:
            json.dump(log, f, indent=2)

        try:
            db_adapter.save_complaint({
                "complaint_id": complaint_id,
                "timestamp": datetime.now().isoformat(),
                "label": bert_result["label"],
                "confidence": bert_result["confidence"],
                "state": state,
                "phones": phone_numbers,
                "graph_updated": graph_update["updated"],
                "heatmap_updated": heatmap_update["updated"],
                "alert_generated": alert_result["success"],
                "training_saved": training_result["saved"],
            })
        except Exception:
            pass

    except Exception:
        pass

    processing_ms = int((datetime.now() - start_time).total_seconds() * 1000)

    return {
        "complaint_id": complaint_id,
        "processing_ms": processing_ms,
        "timestamp": datetime.now().isoformat(),
        "classification": {
            "label": bert_result["label"],
            "confidence": bert_result["confidence"],
            "is_scam": bert_result["is_scam"],
            "all_scores": bert_result["all_scores"],
        },
        "entities": {
            "phone_numbers": phone_numbers,
            "state": state,
        },
        "graph_update": graph_update,
        "heatmap_update": heatmap_update,
        "alert": alert_result["alert"],
        "training": training_result,
    }

@app.get("/pipeline/stats")
def pipeline_stats():
    try:
        with open(COMPLAINTS_LOG_FILE) as f:
            log = json.load(f)
        with open(TRAINING_DATA_FILE) as f:
            training = json.load(f)

        total = len(log)
        scam_count = sum(1 for c in log if c.get("label") != "legitimate")
        state_counts = {}
        for c in log:
            s = c.get("state")
            if s:
                state_counts[s] = state_counts.get(s, 0) + 1

        return {
            "total_complaints": total,
            "scam_complaints": scam_count,
            "legitimate_complaints": total - scam_count,
            "training_examples": len(training),
            "states_reported": state_counts,
            "graph_updates": sum(1 for c in log if c.get("graph_updated")),
            "heatmap_updates": sum(1 for c in log if c.get("heatmap_updated")),
            "alerts_generated": sum(1 for c in log if c.get("alert_generated")),
        }
    except Exception as e:
        return {"error": str(e), "total_complaints": 0}

# ── Run ───────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True, log_level="info")
