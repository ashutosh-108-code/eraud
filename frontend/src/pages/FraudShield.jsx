import { useState, useRef, useEffect, useCallback } from "react";
import { Page, Container } from "../components/UI";
import { api } from "../api/client";
import { Shield, Send, AlertTriangle, ChevronDown, ChevronUp, Phone, ExternalLink } from "lucide-react";

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

export default function FraudShield() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [expandedBert, setExpandedBert] = useState({});
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const toggleBert = useCallback((i) => setExpandedBert(prev => ({...prev, [i]: !prev[i]})), []);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  useEffect(() => { if (!loading && inputRef.current) inputRef.current.focus(); }, [loading]);

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

            <div ref={bottomRef} />
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
