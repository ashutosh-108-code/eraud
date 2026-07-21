from groq import Groq
from modules.scam_classifier import classify_text
import os
import json
from dotenv import load_dotenv

load_dotenv()
groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))

LABEL_CONTEXT = {
    "digital_arrest_scam": "digital arrest scam where caller impersonates CBI ED Police or government officials and threatens arrest",
    "phishing": "phishing scam involving fake bank messages OTP requests KYC updates or account suspension threats",
    "vishing": "vishing scam involving fake lottery wins job offers loan approvals or prize money",
    "legitimate": "legitimate message with no fraud indicators"
}

SYSTEM_PROMPT_TEMPLATE = """
You are Kavach — an AI fraud protection assistant for Indian citizens built by the Fraud Shield platform.

CRITICAL: The BERT classification below applies ONLY to the user's LATEST message. Ignore all previous conversation context when responding. Base your answer solely on the latest message and its classification.

Our custom BERT model has classified the user's LATEST message as:
{label} — {context}
Confidence: {confidence}%

Your job is to:
1. Explain this verdict warmly to the citizen based ONLY on their latest message
2. Extract specific red flag phrases from their latest message
3. Tell them exactly what to do right now
4. Respond in the same language they used

Return ONLY valid JSON with no markdown:
{{
  "message": "warm clear explanation in citizen language",
  "risk_score": number 0-100,
  "verdict": "SCAM" or "LEGITIMATE",
  "scam_type": "{label}",
  "red_flags": ["specific suspicious phrases from latest message only"],
  "action": "single most important thing to do now",
  "helpline": "1930" or null,
  "report_url": "https://cybercrime.gov.in" or null,
  "follow_up_question": "clarifying question or null"
}}

Risk score guide:
  digital_arrest + confidence 90%+ -> 95
  digital_arrest + confidence 70%+ -> 85
  phishing + confidence 90%+       -> 80
  phishing + confidence 70%+       -> 70
  vishing + confidence 90%+        -> 75
  legitimate any confidence         -> 5

Be warm and supportive. Never make the user feel stupid.
"""

async def get_chat_response(message: str, history: list) -> dict:
    bert_result = classify_text(message)
    label       = bert_result["label"]
    confidence  = bert_result["confidence"]
    is_scam     = bert_result["is_scam"]
    context     = LABEL_CONTEXT.get(label, "")

    system_prompt = SYSTEM_PROMPT_TEMPLATE.format(
        label      = label,
        context    = context,
        confidence = confidence
    )

    messages = [{"role": "system", "content": system_prompt}]

    for msg in history[-6:]:
        messages.append({
            "role":    msg["role"],
            "content": msg["content"]
        })

    messages.append({"role": "user", "content": message})

    response = groq_client.chat.completions.create(
        model       = "llama-3.1-8b-instant",
        messages    = messages,
        temperature = 0.3,
        max_tokens  = 600
    )

    raw = response.choices[0].message.content.strip()

    if "```" in raw:
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    raw = raw.strip()

    try:
        groq_result = json.loads(raw)
    except json.JSONDecodeError:
        groq_result = {
            "message":            raw,
            "risk_score":         bert_result["confidence"] if is_scam else 5,
            "verdict":            "SCAM" if is_scam else "LEGITIMATE",
            "scam_type":          label,
            "red_flags":          [],
            "action":             "Call 1930 if being scammed",
            "helpline":           "1930" if is_scam else None,
            "report_url":         "https://cybercrime.gov.in" if is_scam else None,
            "follow_up_question": None
        }

    return {
        **groq_result,
        "bert_analysis": {
            "label":      label,
            "confidence": confidence,
            "is_scam":    is_scam,
            "all_scores": bert_result["all_scores"],
            "model_info": "Custom BERT - 13,200 Indian samples"
        }
    }
