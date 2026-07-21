from transformers import (
    BertTokenizer,
    BertForSequenceClassification
)
import torch
import torch.nn.functional as F
import os

MODEL_PATH = os.path.join(
    os.path.dirname(__file__),
    "..", "models", "scam_classifier"
)

print("Loading BERT scam classifier...")
tokenizer = BertTokenizer.from_pretrained(MODEL_PATH)
model     = BertForSequenceClassification.from_pretrained(MODEL_PATH)
model.eval()
print("BERT model loaded ✅")

LABELS = {
    0: "digital_arrest_scam",
    1: "phishing",
    2: "vishing",
    3: "legitimate"
}

EXPLANATIONS = {
    "digital_arrest_scam": "This message impersonates law enforcement (CBI/ED/police), threatens 'digital arrest', and demands money — classic government-impersonation scam tactics.",
    "phishing": "This message contains urgent bank/account alerts, KYC/OTP demands, or suspicious links designed to steal personal information or credentials.",
    "vishing": "This message offers fake prizes, lottery wins, job/loan approvals, or asks you to call back to claim rewards — typical vishing fraud lures.",
    "legitimate": "No scam indicators detected. The message lacks impersonation, threats, urgent money/OTP demands, or suspicious links commonly used in fraud attempts.",
}

SCAM_CONFIDENCE_THRESHOLD = 70.0

def classify_text(text: str) -> dict:
    inputs = tokenizer(
        text,
        return_tensors  = "pt",
        truncation      = True,
        padding         = True,
        max_length      = 128
    )
    with torch.no_grad():
        outputs = model(**inputs)

    probs      = F.softmax(outputs.logits, dim=-1)[0]
    pred_id    = torch.argmax(probs).item()
    pred_label = model.config.id2label[pred_id]
    confidence = round(probs[pred_id].item() * 100, 1)

    all_scores = {
        model.config.id2label[i]: round(probs[i].item() * 100, 1)
        for i in range(len(probs))
    }

    is_scam = pred_label != "legitimate" and confidence >= SCAM_CONFIDENCE_THRESHOLD

    if pred_label != "legitimate" and not is_scam:
        pred_label = "legitimate"
        confidence = round(100.0 - confidence, 1)

    return {
        "label":           pred_label,
        "confidence":      confidence,
        "is_scam":         is_scam,
        "all_scores":      all_scores,
        "explanation":     EXPLANATIONS.get(pred_label, "No explanation available."),
    }

def get_metrics() -> dict:
    return {
        "accuracy":         0.9434,
        "overall_accuracy": 94.34,
        "total_samples":    13200,
        "languages":        ["English", "Hindi", "Hinglish"],
        "model_base":       "bert-base-multilingual-cased",
        "classification_report": {
            "digital_arrest_scam": {
                "precision": 1.00,
                "recall":    1.00,
                "f1-score":  1.00
            },
            "phishing": {
                "precision": 0.68,
                "recall":    1.00,
                "f1-score":  0.81
            },
            "vishing": {
                "precision": 1.00,
                "recall":    0.56,
                "f1-score":  0.71
            },
            "legitimate": {
                "precision": 1.00,
                "recall":    1.00,
                "f1-score":  1.00
            },
            "accuracy": 0.9434
        }
    }
