<div align="center">
  <img src="https://img.shields.io/badge/status-active-success.svg" alt="Status">
  <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License">
</div>

#  Fraud Shield — AI-Powered Digital Public Safety Intelligence Platform

## Installation

This repository uses **Git LFS (Large File Storage)** to manage the model weights (`model.safetensors`). 

Before cloning, ensure you have Git LFS installed:
1. Download and install it from [git-lfs.com](https://git-lfs.com)
2. Set it up globally: `git lfs install`
3. Clone the repo normally: `git clone https://github.com`


An AI-powered platform that equips **citizens, financial institutions, and law enforcement** with proactive tools to detect, disrupt, and respond to digital fraud. Combines a fine-tuned **BERT** classifier, **Groq LLM**, **network graph intelligence**, and **geographic heatmaps** into a single unified dashboard.

---

##  Features

###  Kavach Chatbot
Describe suspicious calls or messages in English or Hinglish — get an instant verdict, risk score, red flags, and recommended actions. Powered by a hybrid BERT + Groq LLM pipeline.

###  Voice Analyzer
Upload or record suspicious audio calls. Automatic transcription via AssemblyAI followed by scam analysis with risk scoring.

###  Scam Classifier
Paste any message text and get a 4-class BERT classification (`digital_arrest_scam`, `phishing`, `vishing`, `legitimate`) with confidence scores.

###  Fraud Network Graph
Visualise organised fraud rings (mastermind → operator → mule → SIM → victim) with force-directed graphs. Search by phone number and generate intelligence reports.

###  Crime Map (India)
Interactive Leaflet map with color-coded circle markers per state showing fraud volume and risk level. Includes multi-dimensional analytics (hourly trends, age groups, banks, merchant categories, devices, networks).

###  Dashboard
Live activity feed, animated stat counters, model performance metrics, and geographic hotspot summaries.

---

##  Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite 5, Tailwind CSS 3.4 |
| **Charts** | Recharts 2.10 |
| **Maps** | Leaflet + react-leaflet 4.2 |
| **Graph** | react-force-graph-2d |
| **Backend** | FastAPI (Python) |
| **ML** | PyTorch + HuggingFace Transformers (BERT) |
| **LLM** | Groq (llama-3.1-8b-instant) |
| **Audio** | AssemblyAI |
| **Icons** | lucide-react |

---

##  Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+
- Groq API key ([groq.com](https://groq.com))
- AssemblyAI API key ([assemblyai.com](https://assemblyai.com))
- (Optional) Supabase project for persistent state

### Backend Setup

```bash
# Clone and enter backend
cd backend

# Create virtual environment
python -m venv venv
.\venv\Scripts\activate      # Windows
source venv/bin/activate     # Linux/macOS

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Add your GROQ_API_KEY, ASSEMBLYAI_API_KEY, SUPABASE_URL, SUPABASE_KEY
```

```bash
# Start the server
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

> **Note:** If you see Unicode encoding errors on Windows, run with:
> ```powershell
> $env:PYTHONIOENCODING='utf-8'; uvicorn main:app --host 0.0.0.0 --port 8000 --reload
> ```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend runs on `http://localhost:3000` and the backend on `http://localhost:8000`.

---

## 📁 Project Structure

```
fraud-shield/
├── backend/
│   ├── main.py                 # FastAPI app with all routes
│   ├── modules/
│   │   ├── scam_classifier.py  # BERT classification
│   │   ├── fraud_shield.py     # Kavach chatbot logic
│   │   ├── fraud_graph.py      # Network graph intelligence
│   │   ├── crime_map.py        # Heatmap data access
│   │   ├── voice_analyzer.py   # Audio transcription + analysis
│   │   └── db_adapter.py       # Supabase persistence
│   ├── data/
│   │   ├── heatmap_data.json   # Crime map state data
│   │   └── network_data.json   # Fraud network graph data
│   └── pipeline_data/
│       ├── new_training_data.json
│       └── complaints_log.json
├── frontend/
│   └── src/
│       ├── pages/              # Dashboard, FraudShield, CrimeMap, etc.
│       ├── components/         # Reusable UI and crime_map components
│       └── api/client.js       # Backend API client
├── DOCUMENTATION.md            # Full system documentation
└── README.md
```

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | System health check |
| `POST` | `/classify` | Classify text with BERT |
| `GET` | `/metrics` | Model performance metrics |
| `POST` | `/chat` | Chat with Kavach assistant |
| `POST` | `/analyze-complaint` | Full intelligence pipeline (classify + graph + heatmap + alert) |
| `GET` | `/pipeline/stats` | Pipeline statistics |
| `GET` | `/network` | Fraud network graph data |
| `POST` | `/network/search` | Search network by phone/ID |
| `POST` | `/network/report` | Generate intelligence report |
| `GET` | `/heatmap` | Full crime map data |
| `GET` | `/heatmap/states` | Per-state fraud data |
| `POST` | `/voice/analyze` | Upload audio for scam analysis |

---

## Pages

| Route | Page | Description |
|---|---|---|
| `/` | Dashboard | Live activity feed, stats, model metrics |
| `/chat` | Fraud Shield (Kavach) | Scam analysis chatbot |
| `/classify` | Scam Classifier | Text classification with BERT |
| `/network` | Fraud Network | Interactive graph of fraud rings |
| `/map` | Crime Map | India fraud heatmap with analytics |
| `/voice` | Voice Analyzer | Audio upload + scam analysis |

---

## How It Works

1. **User submits a message** via the chatbot or classifier
2. **BERT model** classifies it into one of 4 categories (94.34% accuracy)
3. **Groq LLM** enriches the result with red flags, risk score, and action plan
4. **Location is extracted** from the message text (28+ states supported via city/state keywords)
5. **Heatmap is updated** — new states get dynamically added with correct coordinates
6. **Fraud graph** tracks suspect phone numbers across rings
7. **Alert** is generated for law enforcement

---

## License

MIT
