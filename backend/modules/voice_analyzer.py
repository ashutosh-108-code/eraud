import assemblyai as aai
import os
import json
from dotenv import load_dotenv
from groq import Groq
from datetime import datetime

load_dotenv()
aai.settings.api_key = os.getenv("ASSEMBLYAI_API_KEY")
groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))

VOICE_ANALYSIS_SYSTEM_PROMPT = """You are a forensic audio scam analyst analyzing transcribed phone calls.

Given the transcription of an audio recording, determine if it is a scam call or legitimate.

**Guidelines:**
- If the audio is a song, music, casual conversation, birthday wishes, or any non-scam content -> classify as "legitimate" with risk_score < 15
- If the audio contains: impersonation of officials (CBI, police, bank, ED), threats of arrest, demands for money/OTP/KYC, fake lottery/prize claims, urgency/pressure tactics -> classify as the appropriate scam type

**Scam types:**
- "digital_arrest_scam": impersonation of CBI/ED/police/government officials with arrest threats
- "phishing": fake bank messages, OTP requests, KYC updates, account suspension threats
- "vishing": fake lottery wins, job offers, loan approvals, prize money scams

Return ONLY valid JSON with no markdown:
{
  "scam_type": "digital_arrest_scam" | "phishing" | "vishing" | "legitimate",
  "confidence": number 0-100,
  "is_scam": true or false,
  "risk_score": number 0-100,
  "red_flags": ["specific suspicious phrases or empty array"],
  "caller_emotion": "threatening" | "urgent" | "professional" | "neutral" | "friendly",
  "speech_pattern": "scripted" | "natural" | "aggressive",
  "recommended_action": "single most important action for the user",
  "explanation": "brief explanation of the verdict in simple language"
}"""

async def transcribe_and_analyze(audio_path: str) -> dict:
    start_time = datetime.now()

    try:
        config = aai.TranscriptionConfig(language_detection=True)
        transcriber = aai.Transcriber()
        transcript = transcriber.transcribe(audio_path, config=config)

        if transcript.status == aai.TranscriptStatus.error:
            return {"error": transcript.error, "status": "transcription_failed"}

        text = transcript.text or ""
        language = transcript.language_code or "en"
    except Exception as e:
        return {"error": str(e), "status": "transcription_failed"}

    if not text.strip():
        return {
            "transcription": {
                "transcript": "",
                "duration_seconds": 0,
                "language_detected": language,
            },
            "scam_analysis": {
                "scam_type": "legitimate",
                "confidence": 100,
                "is_scam": False,
                "risk_score": 0,
                "red_flags": [],
                "caller_emotion": "neutral",
                "speech_pattern": "natural",
                "recommended_action": "No speech detected.",
                "explanation": "No speech was detected in the audio.",
            },
            "voice_analysis": {
                "is_ai_generated": False,
                "confidence": 0,
                "indicators": [],
                "voice_quality_score": 0,
            },
            "overall_risk_score": 0,
            "timestamp": datetime.now().isoformat(),
            "_provider": "AssemblyAI + Groq",
        }

    analysis = None
    try:
        response = groq_client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": VOICE_ANALYSIS_SYSTEM_PROMPT},
                {"role": "user", "content": f"Analyze this phone call transcription:\n\n{text}"}
            ],
            temperature=0.1,
            max_tokens=500
        )
        raw = response.choices[0].message.content.strip()
        if "```" in raw:
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        raw = raw.strip()
        analysis = json.loads(raw)
    except Exception:
        pass

    if not analysis or "scam_type" not in analysis:
        analysis = {
            "scam_type": "legitimate",
            "confidence": 50,
            "is_scam": False,
            "risk_score": 5,
            "red_flags": [],
            "caller_emotion": "neutral",
            "speech_pattern": "natural",
            "recommended_action": "This appears to be a normal conversation.",
            "explanation": "Could not determine if this is a scam.",
        }

    processing_ms = int((datetime.now() - start_time).total_seconds() * 1000)

    return {
        "transcription": {
            "transcript": text,
            "duration_seconds": getattr(transcript, 'audio_duration', 0),
            "language_detected": language,
        },
        "scam_analysis": analysis,
        "voice_analysis": {
            "is_ai_generated": False,
            "confidence": 0,
            "indicators": [],
            "voice_quality_score": 0,
            "note": "Transcription analyzed via Groq LLM"
        },
        "overall_risk_score": analysis["risk_score"] if analysis["is_scam"] else max(5, analysis["risk_score"]),
        "timestamp": datetime.now().isoformat(),
        "_provider": "AssemblyAI + Groq",
    }

def get_mock_result(scenario: str = "digital_arrest") -> dict:
    MOCK = {
        "digital_arrest": {
            "transcription": {
                "transcript": "Hello I am calling from CBI headquarters. Your Aadhaar number has been used in a money laundering case. You are under digital arrest. Do not tell anyone.",
                "duration_seconds": 45,
                "language_detected": "en",
            },
            "scam_analysis": {
                "scam_type": "digital_arrest_scam",
                "confidence": 97,
                "is_scam": True,
                "risk_score": 95,
                "red_flags": [
                    "Claims to be CBI/government official",
                    "Mentions 'digital arrest'",
                    "Threatens arrest",
                    "Tells not to tell anyone",
                ],
                "caller_emotion": "threatening",
                "speech_pattern": "scripted",
                "recommended_action": "Hang up immediately. Do not transfer any money. Report to cybercrime.gov.in or call 1930.",
                "explanation": "This is a classic digital arrest scam. Government agencies never demand money over phone or place anyone under 'digital arrest'.",
            },
            "voice_analysis": {
                "is_ai_generated": False,
                "confidence": 12,
                "indicators": ["Human-like speech patterns detected", "Natural emotional variation"],
                "voice_quality_score": 88,
            },
            "overall_risk_score": 95,
            "timestamp": None,
        }
    }
    return MOCK.get(scenario, MOCK["digital_arrest"])
