import assemblyai as aai
import os
from dotenv import load_dotenv
from modules.scam_classifier import classify_text
from datetime import datetime

load_dotenv()
aai.settings.api_key = os.getenv("ASSEMBLYAI_API_KEY")

SCAM_SAFETY_LABELS = {"crime_violence", "financials"}
SAFETY_THRESHOLD = 0.5

MUSIC_IAB_KEYWORDS = ["music", "audio", "entertainment"]

def _is_music_from_iab(summary: dict) -> bool:
    for label in summary:
        lower = label.lower()
        if any(kw in lower for kw in MUSIC_IAB_KEYWORDS):
            return True
    return False

def _has_scam_safety_labels(summary: dict) -> bool:
    for label, confidence in summary.items():
        if label.value in SCAM_SAFETY_LABELS and confidence >= SAFETY_THRESHOLD:
            return True
    return False

async def transcribe_and_analyze(audio_path: str) -> dict:
    start_time = datetime.now()

    try:
        config = aai.TranscriptionConfig(
            language_detection=True,
            content_safety=True,
            iab_categories=True,
        )
        transcriber = aai.Transcriber()
        transcript = transcriber.transcribe(audio_path, config=config)

        if transcript.status == aai.TranscriptStatus.error:
            return {"error": transcript.error, "status": "transcription_failed"}

        text = transcript.text or ""
        language = transcript.language_code or "en"
    except Exception as e:
        return {"error": str(e), "status": "transcription_failed"}

    bert_result = classify_text(text) if text else {
        "label": "legitimate", "confidence": 0, "is_scam": False, "all_scores": {}
    }

    cs = transcript.content_safety
    iab = transcript.iab_categories

    is_music = False
    has_safety_flag = False

    if cs and cs.summary:
        has_safety_flag = _has_scam_safety_labels(cs.summary)

    if iab and iab.summary:
        is_music = _is_music_from_iab(iab.summary)

    if bert_result["is_scam"] and (is_music or not has_safety_flag):
        bert_result["label"] = "legitimate"
        bert_result["confidence"] = round(100.0 - bert_result["confidence"], 1)
        bert_result["is_scam"] = False

    processing_ms = int((datetime.now() - start_time).total_seconds() * 1000)

    return {
        "transcription": {
            "transcript": text,
            "language": language,
            "duration": getattr(transcript, 'audio_duration', 0),
        },
        "scam_analysis": {
            "label": bert_result["label"],
            "confidence": bert_result["confidence"],
            "is_scam": bert_result["is_scam"],
            "all_scores": bert_result["all_scores"],
            "cross_validation": {
                "content_safety_flagged": has_safety_flag,
                "iab_music_detected": is_music,
            },
        },
        "voice_analysis": {
            "is_ai_generated": False,
            "confidence": 0,
            "indicators": [],
            "note": "AI voice detection requires dedicated model - transcript analysis performed instead"
        },
        "overall_risk_score": bert_result["confidence"] if bert_result["is_scam"] else max(5, 100 - bert_result["confidence"]),
        "processing_time_ms": processing_ms,
        "_provider": "AssemblyAI + BERT"
    }

def get_mock_result(scenario: str = "digital_arrest") -> dict:
    MOCK = {
        "digital_arrest": {
            "transcription": {
                "transcript": "Hello I am calling from CBI headquarters. Your Aadhaar number has been used in a money laundering case. You are under digital arrest. Do not tell anyone.",
                "language": "en",
                "duration": 45
            },
            "scam_analysis": {
                "label":      "digital_arrest_scam",
                "confidence": 96.2,
                "is_scam":    True,
                "all_scores": {
                    "digital_arrest_scam": 96.2,
                    "phishing": 2.1,
                    "vishing": 1.4,
                    "legitimate": 0.3
                }
            },
            "overall_risk_score": 96
        }
    }
    return MOCK.get(scenario, MOCK["digital_arrest"])
