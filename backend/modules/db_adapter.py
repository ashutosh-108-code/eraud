import os
from datetime import datetime, timezone
from supabase import create_client, Client

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

_client: Client | None = None


def _get_client() -> Client | None:
    global _client
    if _client is None and SUPABASE_URL and SUPABASE_KEY:
        _client = create_client(SUPABASE_URL, SUPABASE_KEY)
    return _client


def is_available() -> bool:
    return _get_client() is not None


# ── App State (key-value JSON blobs) ──────────────────────────

def load_app_state(key: str) -> dict | list | None:
    client = _get_client()
    if not client:
        return None
    try:
        result = (
            client.table("app_state")
            .select("data")
            .eq("key", key)
            .limit(1)
            .execute()
        )
        if result.data and len(result.data) > 0:
            return result.data[0]["data"]
    except Exception:
        pass
    return None


def save_app_state(key: str, data: dict | list) -> bool:
    client = _get_client()
    if not client:
        return False
    try:
        existing = (
            client.table("app_state")
            .select("id")
            .eq("key", key)
            .limit(1)
            .execute()
        )
        now = datetime.now(timezone.utc).isoformat()
        if existing.data and len(existing.data) > 0:
            client.table("app_state").update({
                "data": data,
                "updated_at": now,
            }).eq("key", key).execute()
        else:
            client.table("app_state").insert({
                "key": key,
                "data": data,
                "updated_at": now,
            }).execute()
        return True
    except Exception:
        return False


# ── Complaints Log ────────────────────────────────────────────

def save_complaint(entry: dict) -> bool:
    client = _get_client()
    if not client:
        return False
    try:
        client.table("complaints_log").insert({
            "complaint_id": entry.get("complaint_id", ""),
            "timestamp": entry.get("timestamp", datetime.now(timezone.utc).isoformat()),
            "label": entry.get("label", ""),
            "confidence": entry.get("confidence", 0),
            "state": entry.get("state"),
            "phones": entry.get("phones", []),
            "graph_updated": entry.get("graph_updated", False),
            "heatmap_updated": entry.get("heatmap_updated", False),
            "alert_generated": entry.get("alert_generated", False),
            "training_saved": entry.get("training_saved", False),
        }).execute()
        return True
    except Exception:
        return False


def get_all_complaints() -> list:
    client = _get_client()
    if not client:
        return []
    try:
        result = (
            client.table("complaints_log")
            .select("*")
            .order("timestamp", desc=True)
            .execute()
        )
        return result.data if result.data else []
    except Exception:
        return []


# ── Training Data ─────────────────────────────────────────────

def save_training_example(entry: dict) -> bool:
    client = _get_client()
    if not client:
        return False
    try:
        client.table("training_data").insert({
            "example_id": entry.get("id", ""),
            "text": entry.get("text", ""),
            "label": entry.get("label", ""),
            "confidence": entry.get("confidence", 0),
            "source": entry.get("source", "citizen_complaint"),
            "verified": entry.get("verified", False),
            "timestamp": entry.get("timestamp", datetime.now(timezone.utc).isoformat()),
        }).execute()
        return True
    except Exception:
        return False


def get_all_training_examples() -> list:
    client = _get_client()
    if not client:
        return []
    try:
        result = (
            client.table("training_data")
            .select("*")
            .order("timestamp", desc=True)
            .execute()
        )
        return result.data if result.data else []
    except Exception:
        return []


def count_training_examples() -> int:
    client = _get_client()
    if not client:
        return 0
    try:
        result = client.table("training_data").select("id", count="exact").execute()
        return result.count or 0
    except Exception:
        return 0
