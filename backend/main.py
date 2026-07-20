from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import os
import tempfile
from dotenv import load_dotenv

load_dotenv()

from modules.scam_classifier import classify_text, get_metrics
from modules.fraud_shield import get_chat_response
from modules.fraud_graph import get_network, get_stats, search_network, generate_report
from modules.crime_map import get_all as get_heatmap_all, get_summary as get_heatmap_summary, get_states as get_heatmap_states, get_state as get_heatmap_state
from modules.voice_analyzer import transcribe_and_analyze, get_mock_result

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

# ── Run ───────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True, log_level="info")
