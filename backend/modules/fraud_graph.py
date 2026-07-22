import json
import os

DATA_PATH = os.path.join(
    os.path.dirname(__file__),
    "..", "data", "network_data.json"
)

print("Loading fraud network data...")
with open(DATA_PATH) as f:
    NETWORK_DATA = json.load(f)
print(f"Network loaded: {len(NETWORK_DATA['nodes'])} nodes ✅")

def compute_stats() -> dict:
    nodes    = NETWORK_DATA["nodes"]
    victims  = [n for n in nodes if n["type"] == "victim"]
    masters  = [n for n in nodes if n["type"] == "mastermind"]
    mules    = [n for n in nodes if n["type"] == "mule_account"]
    total_loss = sum(v.get("amount_lost", 0) for v in victims)
    return {
        "total_nodes":    len(nodes),
        "fraud_rings":    len(masters),
        "total_victims":  len(victims),
        "mule_accounts":  len(mules),
        "total_loss":     round(total_loss, 2),
        "amount_crore":   round(total_loss / 10000000, 4)
    }

STATS = compute_stats()

def get_network() -> dict:
    return {
        "nodes": NETWORK_DATA["nodes"],
        "edges": NETWORK_DATA["edges"],
        "stats": STATS
    }

def get_stats() -> dict:
    return STATS

def search_network(query: str) -> dict:
    query = query.strip().lower()
    matched = []

    for node in NETWORK_DATA["nodes"]:
        phone   = str(node.get("phone_number", "")).lower()
        account = str(node.get("receiver_id", "")).lower()
        user_id = str(node.get("user_id", "")).lower()
        node_id = str(node.get("id", "")).lower()

        if query in phone or query in account or query in user_id or query == node_id:
            matched.append(node["id"])

    if not matched:
        return {"found": False, "matches": [], "connected_nodes": []}

    connected = set(matched)
    for edge in NETWORK_DATA["edges"]:
        src = edge["source"] if isinstance(edge["source"], str) else edge["source"]["id"]
        tgt = edge["target"] if isinstance(edge["target"], str) else edge["target"]["id"]
        if src in matched:
            connected.add(tgt)
        if tgt in matched:
            connected.add(src)

    return {
        "found":           True,
        "matches":         matched,
        "connected_nodes": [n for n in NETWORK_DATA["nodes"] if n["id"] in connected],
        "total_connected": len(connected)
    }

def generate_report(node_id: str) -> dict:
    node = next((n for n in NETWORK_DATA["nodes"] if n["id"] == node_id), None)
    if not node:
        return {"error": "Node not found"}

    connected_ids = set()
    for edge in NETWORK_DATA["edges"]:
        src = edge["source"] if isinstance(edge["source"], str) else edge["source"]["id"]
        tgt = edge["target"] if isinstance(edge["target"], str) else edge["target"]["id"]
        if src == node_id:
            connected_ids.add(tgt)
        if tgt == node_id:
            connected_ids.add(src)

    connected_nodes = [n for n in NETWORK_DATA["nodes"] if n["id"] in connected_ids]

    lines = [
        "FRAUD INTELLIGENCE REPORT",
        "=" * 40,
        f"Node: {node_id}",
        f"Type: {node.get('type','').upper()}",
        f"Risk Score: {node.get('risk_score', 'N/A')}",
        "",
        "NODE DETAILS:",
    ]
    for k, v in node.items():
        if k not in ["id", "type", "ring", "ring_color"]:
            lines.append(f"  {k}: {v}")

    lines += ["", f"CONNECTED NODES: {len(connected_nodes)}"]
    for cn in connected_nodes:
        lines.append(f"  {cn['type'].upper()}: {cn['id']}")

    lines += ["", "Fraud Shield Intelligence Platform", "Helpline: 1930 | cybercrime.gov.in"]

    return {"report": "\n".join(lines)}
