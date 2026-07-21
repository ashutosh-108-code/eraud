# Fraud Shield — AI-Powered Digital Public Safety Intelligence Platform

---

## 1. Executive Summary

Fraud Shield is a unified, AI-powered platform that equips **citizens, financial institutions, and law enforcement agencies** with proactive tools to detect, disrupt, and respond to digital fraud networks. It shifts fraud prevention from **reactive case investigation** to **predictive threat neutralisation** by combining:

- A **fine-tuned BERT model** (94.34% accuracy on 13,200 Indian scam samples)
- A **Groq LLM** (llama-3.1-8b-instant) for contextual understanding and citizen-friendly explanations
- **AssemblyAI** for audio transcription and scam analysis
- **Network graph intelligence** for organised fraud ring mapping
- **Geographic fraud heatmaps** with multi-dimensional analytics (hour, age, bank, merchant, device, network)
- **Indian-first design**: Hinglish support, CBI/digital arrest/KYC/lottery scam patterns, helpline 1930 integration

**5 integrated modules** work together seamlessly: Dashboard, Kavach Chatbot, Scam Classifier, Fraud Network Graph, Crime Map, Voice Analyzer.

---

## 2. Relevance to Problem Statement

### Challenge Statement

> *Build an AI-powered Digital Public Safety Intelligence platform that equips law enforcement agencies, financial institutions, and citizens with proactive tools to detect, disrupt, and respond to digital fraud networks, counterfeit currency circulation, and organised scam operations — shifting from reactive case investigation to predictive threat neutralisation.*

### 2.1 Equipping All Three Stakeholder Groups

| Stakeholder | Fraud Shield Module | Specific Feature |
|---|---|---|
| **Citizens** | Kavach Chatbot | Describe suspicious calls/messages in Hinglish, get instant verdict with helpline referral |
| **Citizens** | Voice Analyzer | Upload/record suspicious calls, get transcription + scam analysis |
| **Citizens** | Scam Classifier | Paste any message, get BERT classification with explanation |
| **Financial Institutions** | Fraud Network | Track mule accounts, shared mules across rings, operator networks |
| **Financial Institutions** | Crime Map | Bank-level fraud analytics, merchant category trends, device/network breakdown |
| **Law Enforcement** | Fraud Network | Visualise ring hierarchy (mastermind → operator → mule → SIM → victim), generate intelligence reports |
| **Law Enforcement** | Crime Map | State-level geo-intelligence, peak fraud hours, riskiest demographics, FIR integration |

### 2.2 Detect, Disrupt, and Respond

| Capability | Implementation |
|---|---|
| **Detect** | BERT classifier (94.34% accuracy, 4-class), Groq LLM voice analysis, real-time chat analysis, network pattern search |
| **Disrupt** | Cross-ring mule account linking, network graph search by phone/operator/receiver, risk scoring |
| **Respond** | Native helpline 1930 integration, cybercrime.gov.in reporting, recommended actions, FIR linkage |

### 2.3 Counterfeit Currency & Organised Scam Operations

- **Voice analyzer** catches vishing calls (fake lottery, prize, KYC, job offers)
- **Crime Map** tracks fraud by type, merchant category, device, network across 10 states
- **Network Graph** reveals organised ring hierarchies with typed nodes and edges
- **BERT model** trained on Indian-specific patterns: digital arrest, CBI impersonation, fake KYC, lottery scams

### 2.4 Predictive Threat Neutralisation (vs. Reactive Investigation)

| Reactive (current state) | Predictive (Fraud Shield) |
|---|---|
| Citizen files FIR after losing money | Citizen checks call via chatbot before acting |
| Police manually connect cases | Network graph auto-links shared mules across rings |
| Quarterly fraud trend reports | Real-time hotspot tracking by hour, location, bank, age |
| Case-by-case investigation | Pattern-based risk scoring across demographics |

---

## 3. Innovation & Creativity

### 3.1 Hybrid AI Architecture: BERT + LLM

Unlike solutions that rely solely on LLMs or simple keyword filters, Fraud Shield uses a **two-stage pipeline**:

1. **Stage 1 — BERT**: Lightweight, offline, fine-tuned on 13,200 Indian scam samples. Fast first-pass classification (digital_arrest_scam, phishing, vishing, legitimate).
2. **Stage 2 — Groq LLM**: Enriches the BERT verdict with natural language explanation, red flag extraction, risk scoring, and follow-up questions.

This hybrid approach gives the **speed and domain-specificity of a specialised model** with the **contextual understanding and flexibility of an LLM** — all at sub-second latency.

### 3.2 Unified Multi-Modality Platform

No existing Indian fraud detection solution combines **all four modalities** in a single platform:

- **Text** — Chatbot + Classifier
- **Voice** — Audio transcription + LLM analysis
- **Graph** — Force-directed fraud network visualisation
- **Geo** — Interactive India crime map with multi-dimensional analytics

### 3.3 Cross-Ring Mule Detection

The network graph algorithm identifies **shared mule accounts across separate fraud rings** — a novel intelligence signal that traditional case-by-case investigation misses. This enables law enforcement to disrupt multiple rings by freezing a single shared account.

### 3.4 Indian-First Design Philosophy

- **Language**: Hinglish and Hindi support in BERT training, LLM prompt instructs "respond in the same language"
- **Scam patterns**: CBI/digital arrest, fake KYC, lottery/KBC scams specific to Indian context
- **Infrastructure**: Native helpline 1930, cybercrime.gov.in, TRAI references
- **Ecosystem**: SBI, UPI, Aadhaar, PhonePe, Jio, Airtel baked into data models

### 3.5 Confidence-Aware Classification

The BERT classifier uses a **70% confidence threshold**: classifications below 70% are downgraded to "legitimate" to prevent false positives on ambiguous messages (e.g., TRAI awareness messages about fraud). This protects citizens from unnecessary panic while maintaining high recall on genuine scams.

---

## 4. Technical Implementation

### 4.1 System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React 18 + Vite)             │
│  Dashboard │ Chat │ Classifier │ Network │ Map │ Voice  │
│  ─────────────────────────────────────────────────────   │
│  Tailwind CSS │ Recharts │ Leaflet │ react-force-graph  │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTP (fetch)
┌──────────────────────▼──────────────────────────────────┐
│                  Backend (FastAPI)                       │
│  ┌─────────────┬──────────┬──────────┬────────────────┐  │
│  │ /classify   │ /chat    │ /network │ /heatmap       │  │
│  │ /metrics    │          │ /voice   │                │  │
│  └──────┬──────┴────┬─────┴────┬─────┴───────┬────────┘  │
│         │           │          │              │           │
│  ┌──────▼──┐ ┌──────▼──────┐ ┌▼──────────┐ ┌─▼──────────┐│
│  │  BERT   │ │  Groq LLM  │ │NetworkX   │ │ JSON Data  ││
│  │Classifier│ │(llama-3.1)  │ │Graph Logic│ │  Files     ││
│  └─────────┘ └──────┬──────┘ └───────────┘ └────────────┘│
│                     │                                     │
│              ┌──────▼──────┐                              │
│              │ AssemblyAI  │                              │
│              │Transcription│                              │
│              └─────────────┘                              │
└───────────────────────────────────────────────────────────┘
```

### 4.2 Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | React 18, Vite 5 | SPA with fast HMR |
| **Styling** | Tailwind CSS 3.4 | Dark theme, responsive |
| **Charts** | Recharts 2.10 | Fraud analytics visualisations |
| **Maps** | Leaflet + react-leaflet 4.2 | India fraud heatmap |
| **Graph** | react-force-graph-2d 1.25 | Fraud network visualisation |
| **Backend** | FastAPI (Python) | REST API, 15+ endpoints |
| **ML** | PyTorch + HuggingFace Transformers | BERT sequence classification |
| **LLM** | Groq (llama-3.1-8b-instant) | Contextual scam analysis |
| **Audio** | AssemblyAI | Speech-to-text transcription |
| **Data** | JSON files | Heatmap (573 lines), Network (1808 lines) |

### 4.3 Machine Learning Pipeline

#### BERT Scam Classifier
- **Base model**: `bert-base-multilingual-cased` (119,547 vocab, 12 layers, 768 hidden)
- **Training data**: 13,200 Indian scam/legitimate samples (English, Hindi, Hinglish)
- **Classes**: `digital_arrest_scam`, `phishing`, `vishing`, `legitimate`
- **Accuracy**: 94.34%
- **Per-class F1**: digital_arrest (1.00), phishing (0.81), vishing (0.71), legitimate (1.00)
- **Threshold**: 70% minimum confidence for scam classification
- **Inference**: Sub-100ms on CPU, no GPU required

#### Groq LLM Pipeline
- **Model**: `llama-3.1-8b-instant`
- **Temperature**: 0.3 (chatbot), 0.1 (voice analysis)
- **Max tokens**: 600 (chatbot), 500 (voice)
- **Latency**: Sub-200ms via Groq API
- **Prompt engineering**: System prompts structured with Indian scam taxonomy, JSON output schema

### 4.4 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Root health check |
| `GET` | `/health` | Detailed health status |
| `POST` | `/classify` | Classify text with BERT |
| `GET` | `/metrics` | Model metrics (accuracy, per-class F1) |
| `POST` | `/chat` | Chat with Kavach assistant |
| `GET` | `/network` | Full fraud network graph |
| `GET` | `/network/stats` | Network statistics |
| `POST` | `/network/search` | Search network by phone/receiver/user ID |
| `POST` | `/network/report` | Generate intelligence report for a node |
| `GET` | `/heatmap` | Full heatmap data |
| `GET` | `/heatmap/summary` | Summary statistics |
| `GET` | `/heatmap/states` | All state-level data |
| `GET` | `/heatmap/state/{name}` | Single state details |
| `POST` | `/voice/analyze` | Upload audio for transcription + analysis |
| `GET` | `/voice/demo/{scenario}` | Mock voice analysis result |
| `GET` | `/voice/health` | Voice module readiness |

### 4.5 Code Quality & Resilience

- **Modular architecture**: 5 backend modules in `modules/`, 6 frontend pages in `pages/`, shared UI library in `components/`
- **Graceful degradation**: Every API call has error handling with realistic fallback mock data
- **No PII stored**: All data is either static (pre-generated JSON) or ephemeral (chat history in frontend state)
- **Dark theme**: Professional, consistent UI across all pages

---

## 5. Business Viability

### 5.1 Target Market

| Segment | Specific Customers | Problem Solved |
|---|---|---|
| **Government** | Indian Cyber Crime Coordination Centre (I4C), State Police Cyber Cells | Network graph for case linkage, crime map for resource allocation |
| **Banks** | SBI, HDFC, ICICI, Axis, Yes Bank, PNB | Real-time risk scoring, mule account detection, fraud trend analytics |
| **Fintechs** | PhonePe, Google Pay, Paytm | Transaction screening API, merchant fraud monitoring |
| **Telecoms** | Jio, Airtel, VI, BSNL | SIM card fraud detection, IMEI change alerts |
| **Citizens** | General public | Free chatbot + voice checker before responding to suspicious calls |

### 5.2 Go-to-Market Strategy

| Phase | Timeline | Focus | Milestone |
|---|---|---|---|
| **Phase 1** | 0-6 months | Deploy at 3 state cyber cells as investigative tool | 3 state contracts |
| **Phase 2** | 6-12 months | API licensing to 5 banks for real-time screening | 5 bank integrations |
| **Phase 3** | 12-18 months | Public chatbot integrated with 1930 helpline | 100k+ monthly users |

### 5.3 Revenue Model

- **B2G (Government)**: State police contracts for network graph + crime map access
- **B2B (Banking)**: Per-transaction API pricing for real-time scam screening
- **B2C (Citizens)**: Free tier (government-subsidised), premium tier for priority analysis

### 5.4 Competitive Advantage

| Competitor | Gap | Fraud Shield Advantage |
|---|---|---|
| **Truecaller** | Caller ID only, no scam classification or network analysis | Full classification + graph + map |
| **Generic LLM chatbots** | No India-specific scam training, no confidence scoring | Fine-tuned BERT + 70% threshold |
| **Standalone fraud detectors** | Single-modality (text only or voice only) | Text + voice + graph + geo in one platform |
| **Bank fraud systems** | Internal only, no citizen-facing tools | Public chatbot + voice checker |

### 5.5 Regulatory & Ecosystem Alignment

- Native integration with **helpline 1930** (National Cyber Crime Reporting Portal)
- Built-in **cybercrime.gov.in** reporting links
- Designed for compatibility with **NPCI UPI** data standards
- Model trained on **Indian scam patterns**: digital arrest, fake KYC, lottery scams, courier scams

---

## 6. Presentation & Clarity

### 6.1 3-Minute Demo Flow

| Segment | Duration | Action | Visual Focus |
|---|---|---|---|
| **Dashboard** | 30s | Show live activity feed, 4 stat cards with animated counts, quick navigation | Risk gauge, fraud count |
| **Kavach Chatbot** | 45s | Type "Mujhe CBI ka call aaya, digital arrest bol rahe hain" → shows scam detection flow | Verdict badge, risk bar, red flags, helpline button |
| **Voice Analyzer** | 30s | Upload pre-recorded digital arrest sample → automatic transcription + analysis | Transcript, risk score, scam analysis panel |
| **Fraud Network** | 45s | Show 3 fraud rings, click a node, highlight cross-ring mule connection | Force-directed graph, node detail panel |
| **Crime Map** | 30s | India map → click Maharashtra → show state detail + fraud-by-hour chart | Circle markers, analytics charts |

### 6.2 Pitch Narrative

> **Hook**: "Every 10 minutes, an Indian loses money to a scam call. Most detection tools are reactive — they wait until after the crime. Fraud Shield predicts and prevents."
>
> **Problem**: 480+ fraud cases detected in our data over one year. Organised rings with masterminds, operators, mules, and shared accounts. Citizens don't know who to trust.
>
> **Solution**: A unified platform with 5 integrated modules:
> - BERT + LLM hybrid for accurate, explainable classification
> - Voice transcription + scam analysis
> - Network graph for ring intelligence
> - Crime map for geographic pattern detection
>
> **Impact**: 94.34% BERT accuracy, cross-ring disruption, citizen empowerment through free tools.

### 6.3 Key Visual Elements

| Element | Location | Purpose |
|---|---|---|
| Circular risk score gauge | Voice Analyzer | Instant visual risk assessment |
| Animated count-up stats | Dashboard | Engagement, sense of scale |
| Force-directed graph | Fraud Network | Show complex ring structures intuitively |
| Color-coded map markers | Crime Map | Geographic risk at a glance |
| Red/yellow/green badges | All pages | Consistent risk communication |

### 6.4 Communication Design Principles

- **Citizen first**: Every technical result is explained in simple language
- **Urgency without panic**: Confidence thresholds prevent false alarms
- **Action-oriented**: Every analysis ends with "what to do now"
- **Multi-language**: Hinglish supported throughout

---

## 7. Impact & Scalability

### 7.1 Current Impact (Proof of Concept)

| Metric | Value |
|---|---|
| BERT training samples | 13,200 |
| Model accuracy | 94.34% |
| States mapped | 10 |
| Fraud rings identified | 3 |
| Nodes in network graph | 82 (3 masterminds, 12 operators, 15 mules, 19 SIMs, 33 victims) |
| Edges (relationships) | 67 |
| UPI transactions analyzed | 250,000 |
| Confirmed fraud cases | 480 |
| Total fraud amount tracked | ₹719,631 |
| Languages supported | English, Hindi, Hinglish |

### 7.2 Scalability Pathways

| Dimension | Current (POC) | Scaled (12 months) |
|---|---|---|
| **Geographic** | 10 states | All 36 states/UTs (data available from NFSU/NCRB) |
| **Data** | Static JSON files | Real-time API ingestion from UPI (NPCI), telecom CDRs |
| **Model** | Static BERT weights | Continuous learning pipeline — new scam patterns → retrain → deploy |
| **Voice** | File upload + browser mic | Real-time call monitoring via telecom partner APIs |
| **Language** | English, Hindi, Hinglish | 22 scheduled Indian languages |
| **Users** | Demo/individual | 100k+ monthly active users |

### 7.3 Measurable Impact Metrics

| Metric | Current Baseline | Target (12 months) |
|---|---|---|
| Citizen scam detection time | Hours (by intuition/Google) | < 2 seconds (via chatbot) |
| False positive rate | 32% (phishing precision 0.68) | < 10% with 70% threshold |
| Fraud ring disruption | Manual case linkage | Cross-ring mule detection |
| Police investigation time | Days to connect cases | Minutes via network graph |
| Bank fraud response | Post-transaction | Real-time risk scoring |

### 7.4 Ecosystem Integration Vision

```
                    ┌─────────────────────────┐
                    │   National Fraud         │
                    │   Intelligence Grid      │
                    └──────────┬──────────────┘
                               │
       ┌───────────────────────┼───────────────────────┐
       │                       │                       │
┌──────▼──────┐        ┌──────▼──────┐        ┌──────▼──────┐
│   POLICE    │        │    BANKS    │        │   CITIZENS   │
│ Cyber Cells │        │  SBI, HDFC  │        │  General     │
│             │        │  ICICI, etc │        │  Public      │
│ • Network   │        │             │        │              │
│   Graph     │◄──────►│ • Real-time │◄──────►│ • Chatbot    │
│ • Reports   │        │   Scoring   │        │ • Voice Check│
│ • Case Link │        │ • Mule Alert│        │ • Classifier │
└─────────────┘        └─────────────┘        └──────────────┘
       │                       │                       │
       └───────────────────────┼───────────────────────┘
                               │
                    ┌──────────▼──────────┐
                    │    TELECOMS          │
                    │  Jio, Airtel, VI     │
                    │                     │
                    │ • Call metadata      │
                    │ • SIM fraud alerts   │
                    │ • IMEI tracking      │
                    └─────────────────────┘
```

### 7.5 Long-Term Vision

1. **National Fraud Intelligence Grid**: Connected network of police, banks, telecoms, and citizens sharing real-time fraud intelligence.

2. **Predictive Alerts**: "Your area has a 40% higher scam risk today due to active vishing campaigns" based on live geographic and temporal patterns.

3. **Automated Case Generation**: Citizen uploads call recording → system transcribes, classifies, identifies ring, generates FIR draft — end-to-end in under 60 seconds.

4. **Cross-Platform Learning**: Scam pattern detected in voice calls automatically updates the BERT model for text detection and vice versa.

---

## Appendix A: API Endpoint Reference

| Method | Endpoint | Request | Response |
|---|---|---|---|
| `POST` | `/classify` | `{ text: string }` | `{ label, confidence, is_scam, all_scores, explanation }` |
| `POST` | `/chat` | `{ message: string, history: array }` | `{ message, risk_score, verdict, scam_type, red_flags, action, helpline, bert_analysis }` |
| `POST` | `/voice/analyze` | `FormData (audio file)` | `{ transcription, scam_analysis, voice_analysis, overall_risk_score }` |
| `GET` | `/network` | — | `{ nodes, edges, stats }` |
| `GET` | `/network/stats` | — | `{ total_nodes, fraud_rings, total_victims, total_loss }` |
| `POST` | `/network/search` | `{ query: string }` | Matched nodes and edges |
| `POST` | `/network/report` | `{ node_id: string }` | Text report |
| `GET` | `/heatmap` | — | Full heatmap dataset |
| `GET` | `/heatmap/summary` | — | `{ total_fraud, worst_state, peak_fraud_hour, ... }` |
| `GET` | `/heatmap/states` | — | Array of state objects |
| `GET` | `/metrics` | — | `{ accuracy, total_samples, classification_report }` |

---

## Appendix B: Model Card — BERT Scam Classifier

| Attribute | Value |
|---|---|
| **Model type** | BertForSequenceClassification (Transformer) |
| **Base model** | `bert-base-multilingual-cased` |
| **Vocabulary size** | 119,547 tokens |
| **Hidden layers** | 12 |
| **Hidden size** | 768 |
| **Attention heads** | 12 |
| **Parameters** | ~177M |
| **Training samples** | 13,200 |
| **Classes** | digital_arrest_scam, phishing, vishing, legitimate |
| **Languages** | English, Hindi, Hinglish |
| **Overall accuracy** | 94.34% |
| **Digital Arrest F1** | 1.00 |
| **Phishing F1** | 0.81 |
| **Vishing F1** | 0.71 |
| **Legitimate F1** | 1.00 |
| **Inference** | CPU, < 100ms |
| **Framework** | PyTorch + HuggingFace Transformers |

---

## Appendix C: Data Schema

### heatmap_data.json

```json
{
  "summary": {
    "total_transactions": 250000,
    "total_fraud": 480,
    "overall_fraud_rate": 0.192,
    "states_affected": 10,
    "peak_fraud_hour": 19,
    "worst_state": "Maharashtra",
    "riskiest_age_group": "18-25",
    "most_fraud_bank": "SBI",
    "total_fraud_amount": 719631.0
  },
  "states": [
    {
      "sender_state": "Maharashtra",
      "fraud_count": 96,
      "fraud_rate": 0.19,
      "risk_level": "high",
      "lat": 19.75,
      "lng": 75.71,
      "top_fraud_type": "P2P"
    }
  ],
  "hourly": [ /* 24 entries */ ],
  "transaction_types": { "P2P": 0.35, "P2M": 0.28, ... },
  "age_groups": { "18-25": 0.32, "26-35": 0.28, ... },
  "banks": { "SBI": 0.22, "ICICI": 0.18, ... },
  "merchant_categories": { "Retail": 0.30, ... },
  "days_of_week": { "Monday": 0.15, ... },
  "devices": { "Android": 0.65, "Web": 0.22, "iOS": 0.13 },
  "networks": { "4G": 0.55, "5G": 0.25, "3G": 0.12, "WiFi": 0.08 }
}
```

### network_data.json

```json
{
  "nodes": [
    { "id": "M001", "type": "mastermind", "city": "Mumbai", "risk_score": 95 },
    { "id": "O001", "type": "operator", "user_id": "OP_001", "city": "Delhi", "fraud_txn_count": 12 },
    { "id": "RC001", "type": "mule_account", "receiver_id": "MRC_001", "bank": "SBI" },
    { "id": "SIM001", "type": "sim_card", "phone_number": "+91-98765xxxxx", "carrier": "Jio" },
    { "id": "V001", "type": "victim", "name": "Rajesh Kumar", "amount_lost": 45000 }
  ],
  "edges": [
    { "source": "M001", "target": "O001", "type": "controls" },
    { "source": "O001", "target": "RC001", "type": "transfers_to" },
    { "source": "SIM001", "target": "V001", "type": "calls_from" }
  ],
  "stats": {
    "total_nodes": 82,
    "total_edges": 67,
    "fraud_rings": 3,
    "total_victims": 33,
    "total_loss": 1475000
  }
}
```

---

## Appendix D: Tech Stack Summary

| Category | Technology | Version |
|---|---|---|
| **Frontend Framework** | React | 18.2 |
| **Bundler** | Vite | 5.x |
| **CSS** | Tailwind CSS | 3.4 |
| **Charts** | Recharts | 2.10 |
| **Maps** | Leaflet / react-leaflet | 1.9 / 4.2 |
| **Graph Visualisation** | react-force-graph-2d | 1.25 |
| **Icons** | lucide-react | 1.25 |
| **Backend Framework** | FastAPI | 1.x |
| **ML Framework** | PyTorch + Transformers | latest |
| **LLM** | Groq (llama-3.1-8b-instant) | — |
| **Audio Transcription** | AssemblyAI | latest |
| **Data Format** | JSON | — |
| **Server** | Uvicorn | latest |

---

## Appendix E: Screenshots

*(Screenshots to be added — one per page)*

| Page | Key Visual |
|---|---|
| Dashboard | Stat cards, live activity feed, model performance, hotspots |
| Kavach Chatbot | Chat interface, scam analysis panel, risk bar, red flags |
| Scam Classifier | Text input, results with explanation + score breakdown |
| Fraud Network | Force-directed graph, node detail panel, search + filters |
| Crime Map | India map with markers, state detail panel, analytics charts |
| Voice Analyzer | Risk gauge, transcript, scam analysis, action card |
