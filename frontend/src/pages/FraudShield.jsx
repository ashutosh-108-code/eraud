import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Page, Container } from "../components/UI";
import { api } from "../api/client";
import { Shield, Send, AlertTriangle, ChevronDown, ChevronUp, Phone, ExternalLink, Download, Map, Share2, BarChart3 } from "lucide-react";

const QUICK_ACTIONS = [
  { label: "Got a CBI call", msg: "I got a call from someone claiming to be a CBI officer. He said a parcel with drugs was found in my name and I will be arrested if I don't pay Rs 50,000." },
  { label: "Fake bank OTP", msg: "I got an SMS saying my bank account will be frozen unless I update KYC immediately. There's a link to enter my debit card number and PIN." },
  { label: "Courier parcel scam", msg: "Got a call from FedEx saying my parcel from Mumbai to Dubai is stuck in customs and I need to pay Rs 15,000 to release it." },
];

const EXAMPLE_CHIPS = [
  "Someone is threatening me with digital arrest",
  "I got a lottery winning message",
  "Mujhe CBI banakar phone aaya hai",
];

function getRiskColor(score) {
  if (score >= 85) return "bg-red-500";
  if (score >= 60) return "bg-yellow-500";
  return "bg-green-500";
}

function formatTime() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

const PIPELINE_STEPS = [
  "Scam classified",
  "Entities extracted",
  "Fraud graph updated",
  "Crime heatmap updated",
  "Alert generated",
  "Training data saved",
];

const INDIAN_STATES = [
  "Andhra Pradesh", "Bihar", "Delhi", "Gujarat", "Haryana",
  "Jharkhand", "Karnataka", "Madhya Pradesh", "Maharashtra",
  "Punjab", "Rajasthan", "Tamil Nadu", "Telangana",
  "Uttar Pradesh", "West Bengal",
];

export default function FraudShield() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [expandedBert, setExpandedBert] = useState({});
  const [pipelineResult, setPipelineResult] = useState(null);
  const [pipelineLoading, setPipelineLoading] = useState(false);
  const [showPipeline, setShowPipeline] = useState(false);
  const [userState, setUserState] = useState("");
  const [userPhone, setUserPhone] = useState("");
  const [showInputFields, setShowInputFields] = useState(false);
  const [pipelineStats, setPipelineStats] = useState(null);
  const [pipelineSteps, setPipelineSteps] = useState([]);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const toggleBert = useCallback((i) => setExpandedBert(prev => ({...prev, [i]: !prev[i]})), []);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  useEffect(() => { if (!loading && inputRef.current) inputRef.current.focus(); }, [loading]);
  useEffect(() => {
    api.getPipelineStats().then(setPipelineStats).catch(() => {});
  }, []);

  async function sendMessage(text) {
    if (!text.trim() || loading) return;
    setShowWelcome(false);
    const history = messages.map(m => ({ role: m.role, content: m.content }));
    const userMsg = { role: "user", content: text.trim(), time: formatTime() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const data = await api.chat(text.trim(), history);

      if (data?.bert_analysis?.is_scam) {
        runPipeline(text.trim());
      }

      setMessages(prev => [...prev, {
        role: "assistant",
        content: data.message,
        analysis: {
          risk_score: data.risk_score,
          verdict: data.verdict,
          scam_type: data.scam_type,
          red_flags: data.red_flags || [],
          action: data.action,
          follow_up_question: data.follow_up_question,
        },
        bert_analysis: data.bert_analysis || null,
        timestamp: formatTime(),
      }]);
    } catch {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "I'm having trouble connecting right now. If you suspect a scam, please call 1930 (National Cyber Helpline) immediately or report at cybercrime.gov.in",
        timestamp: formatTime(),
        isError: true,
      }]);
    } finally {
      setLoading(false);
    }
  }

  async function runPipeline(messageText) {
    setPipelineLoading(true);
    setShowPipeline(true);
    setPipelineResult(null);
    setPipelineSteps([]);

    const stepTimer = (index) => {
      setTimeout(() => {
        setPipelineSteps(prev => [...prev, index]);
      }, index * 800);
    };
    for (let i = 0; i < PIPELINE_STEPS.length; i++) stepTimer(i);

    try {
      const result = await api.analyzeComplaint(messageText, userState || null, userPhone || null);
      setPipelineResult(result);
      api.getPipelineStats().then(setPipelineStats).catch(() => {});
    } catch {
      setPipelineResult({ error: "Pipeline unavailable" });
    }
    setPipelineLoading(false);
  }

  function handleKeyDown(e) { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }

  return (
    <Page>
      <Container className="h-[calc(100vh-3rem)] flex items-start justify-center pt-4">
        <div className="flex flex-col w-full max-w-2xl h-full bg-[#1a2332] rounded-lg overflow-hidden">
          {/* Header */}
          <div className="bg-[#0f172a] px-4 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-400" />
              <span className="font-semibold text-white text-sm">Kavach</span>
              <span className="text-xs text-[#475569]">Fraud Shield Assistant</span>
            </div>
            <a href="tel:1930" className="flex items-center gap-1.5 bg-red-900/30 text-red-400 text-xs font-medium px-3 py-1.5 rounded-md">
              <Phone className="w-3 h-3" />
              1930 Helpline
            </a>
          </div>

          {/* Pipeline stats */}
          {pipelineStats && (
            <div className="flex gap-3 px-4 py-1.5 bg-[#0f172a]/30 border-b border-[#1e293b] shrink-0">
              <span className="text-[10px] text-[#64748b]">
                <span className="text-[#94a3b8] font-medium">{pipelineStats.total_complaints}</span> complaints
              </span>
              <span className="text-[10px] text-[#64748b]">
                <span className="text-red-400 font-medium">{pipelineStats.scam_complaints}</span> scams
              </span>
              <span className="text-[10px] text-[#64748b]">
                <span className="text-blue-400 font-medium">{pipelineStats.graph_updates}</span> graph updates
              </span>
              <span className="text-[10px] text-[#64748b]">
                <span className="text-emerald-400 font-medium">{pipelineStats.training_examples}</span> training
              </span>
            </div>
          )}

          {/* Quick actions */}
          <div className="flex gap-2 px-4 py-2 bg-[#0f172a]/50 overflow-x-auto shrink-0">
            {QUICK_ACTIONS.map((qa, i) => (
              <button
                key={i}
                onClick={() => sendMessage(qa.msg)}
                disabled={loading}
                className="text-xs bg-[#1e293b] text-[#94a3b8] rounded-md px-3 py-1.5 whitespace-nowrap hover:bg-[#334155] disabled:opacity-50 transition-colors"
              >
                {qa.label}
              </button>
            ))}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-[#1a2332]">
            {showWelcome && (
              <div className="text-center py-12">
                <Shield className="w-10 h-10 text-blue-400 mx-auto mb-3" />
                <h2 className="text-lg font-semibold text-white mb-2">Welcome to Kavach</h2>
                <p className="text-[#64748b] text-sm mb-6 max-w-md mx-auto">
                  Describe any suspicious call, message, or situation. I will tell you if it is a scam and what to do next.
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {EXAMPLE_CHIPS.map((chip, i) => (
                    <button
                      key={i}
                      onClick={() => sendMessage(chip)}
                      disabled={loading}
                      className="text-sm bg-[#1e293b] text-[#94a3b8] rounded-md px-4 py-2 hover:bg-[#334155] disabled:opacity-50 transition-colors"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i}>
                {msg.role === "user" && (
                  <div className="flex justify-end mb-3">
                    <div className="bg-blue-600 text-white rounded-lg px-4 py-2.5 max-w-[75%]">
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      <p className="text-[10px] text-blue-300 text-right mt-1">{msg.timestamp}</p>
                    </div>
                  </div>
                )}

                {msg.role === "assistant" && (
                  <div className="flex justify-start mb-3">
                    <div className={`max-w-[85%] ${msg.isError ? "bg-red-900/20" : "bg-[#0f172a]"} rounded-lg px-4 py-3`}>
                      <div className="text-sm text-[#e2e8f0] whitespace-pre-wrap mb-2 leading-relaxed">{msg.content}</div>

                      {msg.isError && (
                        <div className="mt-2 flex gap-2">
                          <a href="tel:1930" className="flex items-center gap-1 bg-red-600 text-white text-xs font-medium px-3 py-1.5 rounded-md hover:bg-red-700 transition-colors">
                            <Phone className="w-3 h-3" /> Call 1930
                          </a>
                          <a href="https://cybercrime.gov.in" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 bg-[#1e293b] text-[#94a3b8] text-xs px-3 py-1.5 rounded-md hover:bg-[#334155] transition-colors">
                            <ExternalLink className="w-3 h-3" /> Report Online
                          </a>
                        </div>
                      )}

                      {msg.analysis && (
                        <div className="bg-[#1a2332] rounded-lg p-3 mt-2">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-[#94a3b8] font-medium">{msg.analysis.verdict?.replace(/_/g, " ")}</span>
                            <span className="text-xs text-[#64748b] capitalize">{msg.analysis.scam_type?.replace(/_/g, " ")}</span>
                          </div>

                          <div className="mb-2">
                            <div className="flex justify-between text-xs text-[#64748b] mb-1">
                              <span>Risk Score</span>
                              <span className="font-medium text-white">{msg.analysis.risk_score}/100</span>
                            </div>
                            <div className="h-1.5 bg-[#1e293b] rounded-full overflow-hidden">
                              <div className={`h-full rounded-full transition-all duration-500 ${getRiskColor(msg.analysis.risk_score)}`} style={{ width: `${msg.analysis.risk_score}%` }} />
                            </div>
                          </div>

                          {msg.analysis.red_flags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-2">
                              {msg.analysis.red_flags.map((flag, fi) => (
                                <span key={fi} className="text-xs bg-red-500/10 text-red-400 px-2 py-0.5 rounded-md flex items-center gap-0.5">
                                  <AlertTriangle className="w-3 h-3" /> {flag}
                                </span>
                              ))}
                            </div>
                          )}

                          {msg.analysis.verdict !== "LEGITIMATE" && msg.analysis.action && (
                            <div className="bg-blue-900/20 rounded-lg p-2.5 mb-2">
                              <p className="text-xs font-medium text-blue-300 mb-1">Recommended action:</p>
                              <p className="text-sm text-[#e2e8f0]">{msg.analysis.action}</p>
                            </div>
                          )}

                          {msg.analysis.risk_score >= 85 && (
                            <div className="bg-red-900/20 rounded-lg p-3 text-center">
                              <p className="text-sm font-semibold text-red-400 mb-2 flex items-center justify-center gap-1.5">
                                <AlertTriangle className="w-4 h-4" /> This is a SCAM — Act Now
                              </p>
                              <div className="flex gap-2 justify-center">
                                <a href="tel:1930" className="flex items-center gap-1 bg-red-600 text-white text-xs font-medium px-3 py-1.5 rounded-md hover:bg-red-700 transition-colors">
                                  <Phone className="w-3 h-3" /> Call 1930
                                </a>
                                <a href="https://cybercrime.gov.in" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 bg-[#1e293b] text-[#94a3b8] text-xs px-3 py-1.5 rounded-md hover:bg-[#334155] transition-colors">
                                  <ExternalLink className="w-3 h-3" /> Report Online
                                </a>
                              </div>
                            </div>
                          )}

                          {msg.analysis.follow_up_question && (
                            <button
                              onClick={() => sendMessage(msg.analysis.follow_up_question)}
                              className="text-sm text-blue-400 hover:text-blue-300 mt-1 transition-colors"
                            >
                              {msg.analysis.follow_up_question}
                            </button>
                          )}
                        </div>
                      )}

                      {msg.bert_analysis && (
                        <div className="mt-2">
                          <button
                            onClick={() => toggleBert(i)}
                            className="flex items-center gap-1 text-xs text-[#475569] hover:text-[#94a3b8] transition-colors py-1"
                          >
                            AI Analysis {expandedBert[i] ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          </button>
                          {expandedBert[i] && (
                            <div className="bg-[#1a2332] rounded-lg p-3 mt-1">
                              {msg.bert_analysis.all_scores && Object.entries(msg.bert_analysis.all_scores).map(([cat, score]) => (
                                <div key={cat} className="mb-1.5">
                                  <div className="flex justify-between text-[10px] text-[#64748b] mb-0.5">
                                    <span className="capitalize">{cat.replace(/_/g, " ")}</span>
                                    <span>{score}%</span>
                                  </div>
                                  <div className="h-1 bg-[#1e293b] rounded-full overflow-hidden">
                                    <div className="h-full rounded-full bg-blue-500 transition-all duration-500" style={{ width: `${score}%` }} />
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      <p className="text-[10px] text-[#475569] mt-1">{msg.timestamp}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex justify-start mb-3">
                <div className="bg-[#0f172a] rounded-lg px-4 py-3">
                  <div className="flex gap-1.5">
                    <span className="w-2 h-2 bg-[#475569] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-[#475569] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-[#475569] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}

            {/* Pipeline result panel */}
            {showPipeline && (
              <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 mt-4 animate-fade-in">

                {/* Loading state */}
                {pipelineLoading && (
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                      <span className="text-sm text-slate-300 font-medium">Intelligence pipeline running...</span>
                    </div>
                    <div className="space-y-2">
                      {PIPELINE_STEPS.map((step, i) => (
                        <div
                          key={i}
                          className={`flex items-center gap-2 text-xs transition-all duration-300 ${
                            pipelineSteps.includes(i) ? "opacity-100" : "opacity-0"
                          }`}
                        >
                          <span className="text-emerald-400">✅</span>
                          <span className="text-slate-300">{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Result state */}
                {!pipelineLoading && pipelineResult && !pipelineResult.error && (
                  <div className="space-y-4">

                    {/* Section A: Classification */}
                    <div>
                      <h4 className="text-sm font-semibold text-slate-300 mb-2">Classification</h4>
                      <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-3">
                          <span className={`text-xs font-medium px-2.5 py-0.5 rounded-md uppercase ${
                            pipelineResult.classification.is_scam
                              ? "bg-red-500/10 text-red-400"
                              : "bg-emerald-500/10 text-emerald-400"
                          }`}>
                            {pipelineResult.classification.label.replace(/_/g, " ")}
                          </span>
                          <span className="text-xs text-slate-400">{pipelineResult.classification.confidence}% confidence</span>
                        </div>
                        {pipelineResult.classification.all_scores && Object.entries(pipelineResult.classification.all_scores).map(([cat, score]) => (
                          <div key={cat} className="mb-1.5">
                            <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
                              <span className="capitalize">{cat.replace(/_/g, " ")}</span>
                              <span>{score}%</span>
                            </div>
                            <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
                              <div className="h-full rounded-full bg-blue-500 transition-all duration-500" style={{ width: `${score}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Section B: Intelligence Update */}
                    <div>
                      <h4 className="text-sm font-semibold text-slate-300 mb-2">Intelligence Update</h4>
                      <div className="grid grid-cols-2 gap-3">

                        {/* Card 1: Graph */}
                        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
                          <p className="text-xs font-medium text-slate-300 mb-2">🕸️ Fraud Graph</p>
                          {pipelineResult.graph_update.updated ? (
                            <div>
                              <p className="text-xs text-emerald-400 mb-1">✅ Network updated</p>
                              {pipelineResult.graph_update.nodes_added > 0 && (
                                <p className="text-[10px] text-slate-400">{pipelineResult.graph_update.nodes_added} new suspect node added</p>
                              )}
                              {pipelineResult.graph_update.nodes_updated > 0 && (
                                <p className="text-[10px] text-slate-400">{pipelineResult.graph_update.nodes_updated} existing node updated</p>
                              )}
                              {pipelineResult.graph_update.phones_found?.length > 0 && (
                                <p className="text-[10px] text-slate-500 mt-1">
                                  Phones: {pipelineResult.graph_update.phones_found.join(", ")}
                                </p>
                              )}
                            </div>
                          ) : (
                            <div>
                              <p className="text-xs text-yellow-400 mb-1">ℹ️ No phone numbers detected</p>
                              <p className="text-[10px] text-slate-500">Provide suspect number for graph update</p>
                            </div>
                          )}
                        </div>

                        {/* Card 2: Heatmap */}
                        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
                          <p className="text-xs font-medium text-slate-300 mb-2">🗺️ Crime Map</p>
                          {pipelineResult.heatmap_update.updated ? (
                            <div>
                              <p className="text-xs text-emerald-400 mb-1">✅ {pipelineResult.heatmap_update.state} updated</p>
                              <p className="text-[10px] text-slate-400">Fraud count: {pipelineResult.heatmap_update.new_count}</p>
                              <span className={`inline-block text-[10px] font-medium px-2 py-0.5 rounded mt-1 ${
                                pipelineResult.heatmap_update.risk_level === "high"
                                  ? "bg-red-500/10 text-red-400"
                                  : pipelineResult.heatmap_update.risk_level === "medium"
                                  ? "bg-yellow-500/10 text-yellow-400"
                                  : "bg-emerald-500/10 text-emerald-400"
                              }`}>
                                {pipelineResult.heatmap_update.risk_level?.toUpperCase() || "N/A"}
                              </span>
                            </div>
                          ) : (
                            <div>
                              <p className="text-xs text-yellow-400 mb-1">ℹ️ Location not detected</p>
                              <p className="text-[10px] text-slate-500">Select your state for heatmap update</p>
                            </div>
                          )}
                        </div>

                      </div>
                    </div>

                    {/* Section C: Law Enforcement Alert */}
                    <div>
                      <h4 className="text-sm font-semibold text-slate-300 mb-2">Law Enforcement Alert</h4>
                      <div className="bg-red-950/30 border-l-4 border-l-red-500 border border-red-800/50 rounded-xl p-5">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-semibold text-red-400">🚨 Intelligence Alert Generated</p>
                          {pipelineResult.alert?.priority && (
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              pipelineResult.alert.priority === "HIGH"
                                ? "bg-red-500/20 text-red-400"
                                : pipelineResult.alert.priority === "MEDIUM"
                                ? "bg-yellow-500/20 text-yellow-400"
                                : "bg-yellow-500/10 text-yellow-300"
                            }`}>
                              {pipelineResult.alert.priority}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500 mb-3">Alert ID: {pipelineResult.alert?.alert_id || "N/A"}</p>

                        {pipelineResult.alert?.summary && (
                          <p className="text-xs text-slate-300 mb-3">{pipelineResult.alert.summary}</p>
                        )}

                        {pipelineResult.alert?.red_flags?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {pipelineResult.alert.red_flags.map((flag, fi) => (
                              <span key={fi} className="text-[10px] bg-red-500/10 text-red-400 px-2 py-0.5 rounded-md">
                                ⚠️ {flag}
                              </span>
                            ))}
                          </div>
                        )}

                        {pipelineResult.alert?.recommended_actions?.length > 0 && (
                          <div className="mb-3">
                            <p className="text-[10px] font-medium text-slate-400 mb-1">Recommended actions:</p>
                            <ol className="list-decimal list-inside space-y-0.5">
                              {pipelineResult.alert.recommended_actions.map((action, ai) => (
                                <li key={ai} className="text-[10px] text-slate-400">{action}</li>
                              ))}
                            </ol>
                          </div>
                        )}

                        <div className="flex gap-3 mb-3 text-[10px] text-slate-400">
                          {pipelineResult.alert?.case_type && <span>Case: {pipelineResult.alert.case_type}</span>}
                          {pipelineResult.alert?.escalate_to && <span>Escalate: {pipelineResult.alert.escalate_to}</span>}
                        </div>

                        {pipelineResult.alert?.victim_advisory && (
                          <div className="bg-blue-900/20 rounded-lg p-3 mb-3">
                            <p className="text-[10px] font-medium text-blue-300 mb-1">Victim advisory:</p>
                            <p className="text-xs text-slate-300">{pipelineResult.alert.victim_advisory}</p>
                          </div>
                        )}

                        <button
                          onClick={() => {
                            const alert = pipelineResult.alert;
                            const content = [
                              "═══════════════════════════════════════",
                              "FRAUD SHIELD INTELLIGENCE ALERT",
                              "═══════════════════════════════════════",
                              `Alert ID:    ${alert.alert_id}`,
                              `Timestamp:   ${alert.timestamp}`,
                              `Priority:    ${alert.priority}`,
                              `Scam Type:   ${alert.scam_type} (${alert.confidence}%)`,
                              `Location:    ${alert.location}`,
                              `Suspect Nos: ${(alert.suspect_numbers || []).join(", ")}`,
                              "",
                              "SUMMARY:",
                              `  ${alert.summary}`,
                              "",
                              "RED FLAGS:",
                              ...(alert.red_flags || []).map((f, i) => `  ${i + 1}. ${f}`),
                              "",
                              "RECOMMENDED ACTIONS:",
                              ...(alert.recommended_actions || []).map((a, i) => `  ${i + 1}. ${a}`),
                              "",
                              `CASE TYPE: ${alert.case_type || "N/A"}`,
                              `ESCALATE TO: ${alert.escalate_to || "N/A"}`,
                              "",
                              "VICTIM ADVISORY:",
                              `  ${alert.victim_advisory || "N/A"}`,
                              "",
                              "Report at: cybercrime.gov.in",
                              "Helpline:  1930",
                              "═══════════════════════════════════════",
                              "Generated by Fraud Shield Intelligence Platform",
                            ].join("\n");
                            const blob = new Blob([content], { type: "text/plain" });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement("a");
                            a.href = url;
                            a.download = `alert_${alert.alert_id}.txt`;
                            a.click();
                            URL.revokeObjectURL(url);
                          }}
                          className="bg-red-600 hover:bg-red-700 text-white text-xs px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5"
                        >
                          <Download className="w-3 h-3" /> Download Alert
                        </button>
                      </div>
                    </div>

                    {/* Section D: Training Data */}
                    <div className="bg-emerald-950/30 border border-emerald-800/50 rounded-xl p-4">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-medium text-slate-300">📚 Training Data</p>
                        {pipelineResult.training?.saved ? (
                          <span className="text-[10px] text-emerald-400">✅ Saved</span>
                        ) : (
                          <span className="text-[10px] text-yellow-400">⚠️ Not saved</span>
                        )}
                      </div>
                      {pipelineResult.training?.saved ? (
                        <div className="mt-1">
                          <p className="text-[10px] text-slate-400">Total examples: {pipelineResult.training.total_examples}</p>
                          <p className="text-[10px] text-slate-500">This helps improve our model for future detections</p>
                        </div>
                      ) : (
                        <p className="text-[10px] text-slate-500 mt-1">Could not save training example</p>
                      )}
                    </div>

                    {/* Section E: Action Buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => navigate("/network")}
                        className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs px-3 py-2 rounded-lg transition-colors"
                      >
                        <Share2 className="w-3 h-3" /> View in Graph
                      </button>
                      <button
                        onClick={() => navigate("/map")}
                        className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs px-3 py-2 rounded-lg transition-colors"
                      >
                        <Map className="w-3 h-3" /> View on Map
                      </button>
                      <button
                        onClick={() => {
                          api.getPipelineStats().then(s => {
                            const msg = [
                              "📊 INTELLIGENCE PIPELINE STATS",
                              "════════════════════════════",
                              `Total complaints analyzed: ${s.total_complaints}`,
                              `Scams detected: ${s.scam_complaints}`,
                              `Legitimate: ${s.legitimate_complaints}`,
                              `Training examples: ${s.training_examples}`,
                              `Graph updates: ${s.graph_updates}`,
                              `Heatmap updates: ${s.heatmap_updates}`,
                              `Alerts generated: ${s.alerts_generated}`,
                              "",
                              "States reported:",
                              ...Object.entries(s.states_reported || {}).map(([st, cnt]) => `  ${st}: ${cnt}`),
                            ].join("\n");
                            alert(msg);
                          }).catch(() => {});
                        }}
                        className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs px-3 py-2 rounded-lg transition-colors"
                      >
                        <BarChart3 className="w-3 h-3" /> View Stats
                      </button>
                    </div>

                  </div>
                )}

                {/* Error state */}
                {!pipelineLoading && pipelineResult?.error && (
                  <div className="text-center py-4">
                    <p className="text-xs text-red-400 mb-2">⚠️ Pipeline unavailable</p>
                    <p className="text-[10px] text-slate-500">The intelligence pipeline is not responding. Your chat message was still sent successfully.</p>
                  </div>
                )}

              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Optional input fields */}
          <div className="bg-[#0f172a] px-4 py-2 shrink-0">
            <button
              onClick={() => setShowInputFields(!showInputFields)}
              className="text-[10px] text-[#475569] hover:text-[#94a3b8] transition-colors flex items-center gap-1"
            >
              <span className={showInputFields ? "rotate-90" : ""}>▶</span>
              {showInputFields ? "Hide" : "Add details for intelligence report"}
            </button>
            {showInputFields && (
              <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 mb-3 mt-2 flex gap-3">
                <select
                  value={userState}
                  onChange={e => setUserState(e.target.value)}
                  className="flex-1 bg-[#1e293b] text-white placeholder-[#475569] rounded-lg px-3 py-2 text-xs outline-none"
                >
                  <option value="">Select your state (optional)</option>
                  {INDIAN_STATES.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <input
                  value={userPhone}
                  onChange={e => setUserPhone(e.target.value)}
                  placeholder="Suspect phone number (optional)"
                  className="flex-1 bg-[#1e293b] text-white placeholder-[#475569] rounded-lg px-3 py-2 text-xs outline-none"
                />
              </div>
            )}
          </div>

          {/* Input */}
          <div className="bg-[#0f172a] px-4 py-3 shrink-0">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Describe what happened..."
                disabled={loading}
                className="flex-1 bg-[#1e293b] text-white placeholder-[#475569] rounded-lg px-4 py-2.5 text-sm outline-none disabled:opacity-50 transition-all"
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || loading}
                className="bg-blue-600 text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-blue-500 disabled:bg-[#1e293b] disabled:text-[#475569] disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
              >
                <Send className="w-4 h-4" />
                Send
              </button>
            </div>
          </div>
        </div>
      </Container>
    </Page>
  );
}
