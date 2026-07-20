import { useState, useRef, useEffect } from 'react'
import { Page, Container } from '../components/UI'
import { api } from '../api/client'
import { Shield, Mic, Upload, AlertTriangle, Copy, Download } from 'lucide-react'

function getMockResult(type) {
  const mockData = {
    digital_arrest: {
      transcription: {
        transcript: "Hello, this is officer Sharma from CBI. I am calling regarding your Aadhaar card which has been used in illegal money laundering activities worth 2.3 crores. You are under digital arrest.",
        duration_seconds: 35.2,
        language_detected: "en",
      },
      scam_analysis: {
        scam_type: "digital_arrest_scam",
        confidence: 97,
        is_scam: true,
        risk_score: 95,
        red_flags: [
          "Claims to be CBI/government official",
          "Mentions 'digital arrest'",
          "Demands immediate money transfer",
          "Threatens arrest if not obeyed",
        ],
        caller_emotion: "threatening",
        speech_pattern: "scripted",
        recommended_action: "Hang up immediately. Do not transfer any money. Report to cybercrime.gov.in or call 1930.",
        explanation: "This is a classic digital arrest scam. Government agencies never demand money over phone or place anyone under 'digital arrest'.",
      },
      voice_analysis: {
        is_ai_generated: false,
        confidence: 12,
        indicators: ["Human-like speech patterns detected", "Natural emotional variation"],
        voice_quality_score: 88,
      },
      overall_risk_score: 95,
      timestamp: new Date().toISOString(),
    },
    phishing: {
      transcription: {
        transcript: "This is an automated message from SBI Bank. Your account has been suspended due to suspicious activity. Please call us immediately at 1800-XXX-XXXX to reactivate your account.",
        duration_seconds: 28.7,
        language_detected: "en",
      },
      scam_analysis: {
        scam_type: "phishing",
        confidence: 92,
        is_scam: true,
        risk_score: 88,
        red_flags: [
          "Fake bank alert claiming account suspension",
          "Urgent KYC update demand",
          "Request to call back or click link",
        ],
        caller_emotion: "urgent",
        speech_pattern: "scripted",
        recommended_action: "Do not call the number or click any link. Contact your bank directly using the number on your debit card.",
        explanation: "This is a phishing attempt. Banks never send automated calls threatening account closure without prior notice.",
      },
      voice_analysis: {
        is_ai_generated: true,
        confidence: 85,
        indicators: ["Abnormally consistent pronunciation", "Lack of natural pauses", "Synthesized speech patterns"],
        voice_quality_score: 92,
      },
      overall_risk_score: 88,
      timestamp: new Date().toISOString(),
    },
    legitimate: {
      transcription: {
        transcript: "Hi, this is Priya from HDFC Bank's customer service. I'm calling to confirm a recent transaction of Rs. 2,499 made at Flipkart using your debit card ending in 4821.",
        duration_seconds: 42.1,
        language_detected: "en",
      },
      scam_analysis: {
        scam_type: "legitimate",
        confidence: 95,
        is_scam: false,
        risk_score: 8,
        red_flags: [],
        caller_emotion: "professional",
        speech_pattern: "natural",
        recommended_action: "This appears to be a legitimate call.",
        explanation: "The caller provides specific transaction details and does not demand sensitive information.",
      },
      voice_analysis: {
        is_ai_generated: false,
        confidence: 5,
        indicators: ["Natural speech rhythm", "Human-like hesitation and tone variation"],
        voice_quality_score: 85,
      },
      overall_risk_score: 8,
      timestamp: new Date().toISOString(),
    },
  }
  return mockData[type] || mockData.legitimate
}

function getStatusText(score) {
  if (score <= 30) return { text: 'text-green-400', label: 'Low Risk' }
  if (score <= 60) return { text: 'text-yellow-400', label: 'Suspicious' }
  return { text: 'text-red-400', label: 'High Risk' }
}

export default function VoiceAnalyzer() {
  const [activeTab, setActiveTab] = useState('upload')
  const [audioFile, setAudioFile] = useState(null)
  const [audioURL, setAudioURL] = useState(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [results, setResults] = useState(null)
  const [error, setError] = useState(null)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [loadingStep, setLoadingStep] = useState('')

  const fileInputRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])
  const timerRef = useRef(null)

  useEffect(() => { return () => { if (audioURL) URL.revokeObjectURL(audioURL) } }, [audioURL])
  useEffect(() => { if (results) { setAudioFile(null); setAudioURL(null) } }, [results])

  function handleFileSelect(file) {
    if (audioURL) URL.revokeObjectURL(audioURL)
    setAudioFile(file); setAudioURL(URL.createObjectURL(file)); setResults(null); setError(null)
  }

  function handleDrop(e) { e.preventDefault(); const file = e.dataTransfer.files[0]; if (file && file.type.startsWith('audio/')) handleFileSelect(file) }
  function handleDragOver(e) { e.preventDefault() }

  async function handleAnalyze() {
    if (!audioFile) return
    setIsAnalyzing(true); setError(null); setResults(null)
    try {
      setLoadingStep('Uploading...')
      const formData = new FormData(); formData.append('audio', audioFile)
      setLoadingStep('Transcribing...')
      const res = await api.analyzeVoice(formData); setResults(res)
    } catch {
      setError('Backend offline — showing demo mode')
      setResults(getMockResult('digital_arrest'))
    } finally { setIsAnalyzing(false); setLoadingStep('') }
  }

  function handleSampleClick(type) { setResults(getMockResult(type)); setError(null) }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
      mediaRecorderRef.current = mediaRecorder; chunksRef.current = []
      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        handleFileSelect(new File([blob], 'recording.webm', { type: 'audio/webm' }))
        stream.getTracks().forEach(t => t.stop())
      }
      mediaRecorder.start(); setIsRecording(true); setRecordingTime(0)
      timerRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000)
    } catch { setError('Recording requires microphone permission. Use the upload tab instead.') }
  }

  function stopRecording() {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') mediaRecorderRef.current.stop()
    setIsRecording(false); clearInterval(timerRef.current)
  }

  function formatTime(seconds) { return `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}` }

  const status = results ? getStatusText(results.overall_risk_score) : null
  const radius = 70; const circumference = 2 * Math.PI * radius
  const offset = results ? circumference - (results.overall_risk_score / 100) * circumference : circumference

  return (
    <Page>
      <Container>
        <div className="max-w-3xl mx-auto py-6">
          <div className="text-center mb-8">
            <Shield className="w-6 h-6 text-blue-400 mx-auto mb-2" />
            <h1 className="text-xl font-bold text-white">Voice Scam Detector</h1>
            <p className="text-[#64748b] text-sm mt-1">Upload or record a suspicious call for AI analysis</p>
          </div>

          <div className="flex flex-wrap gap-2 justify-center mb-6">
            <button onClick={() => handleSampleClick('digital_arrest')} className="bg-[#1e293b] text-[#94a3b8] text-sm px-4 py-2 rounded-md hover:bg-[#334155] transition-colors">Digital Arrest Sample</button>
            <button onClick={() => handleSampleClick('phishing')} className="bg-[#1e293b] text-[#94a3b8] text-sm px-4 py-2 rounded-md hover:bg-[#334155] transition-colors">Bank Phishing Sample</button>
            <button onClick={() => handleSampleClick('legitimate')} className="bg-[#1e293b] text-[#94a3b8] text-sm px-4 py-2 rounded-md hover:bg-[#334155] transition-colors">Legitimate Call Sample</button>
          </div>

          <div className="flex bg-[#1a2332] rounded-lg p-1 mb-6">
            <button onClick={() => setActiveTab('upload')} className={`flex-1 py-2 text-sm rounded-md transition-colors ${activeTab === 'upload' ? 'bg-blue-600 text-white' : 'text-[#64748b] hover:text-[#94a3b8]'}`}>
              <Upload className="w-3.5 h-3.5 inline mr-1.5" /> Upload Audio
            </button>
            <button onClick={() => setActiveTab('record')} className={`flex-1 py-2 text-sm rounded-md transition-colors ${activeTab === 'record' ? 'bg-blue-600 text-white' : 'text-[#64748b] hover:text-[#94a3b8]'}`}>
              <Mic className="w-3.5 h-3.5 inline mr-1.5" /> Record Live
            </button>
          </div>

          {activeTab === 'upload' && (
            <div onDrop={handleDrop} onDragOver={handleDragOver} onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-[#1e293b] hover:border-blue-500/50 rounded-lg p-10 text-center cursor-pointer transition-colors">
              <input ref={fileInputRef} type="file" accept=".mp3,.wav,.m4a,.ogg" className="hidden" onChange={e => { if (e.target.files[0]) handleFileSelect(e.target.files[0]) }} />
              <Upload className="w-10 h-10 mx-auto mb-3 text-[#475569]" />
              <p className="text-[#64748b]">Drop your audio file here, or click to browse</p>
              <p className="text-[#475569] text-xs mt-1">Supports MP3, WAV, M4A, OGG (max 25MB)</p>
            </div>
          )}

          {activeTab === 'record' && (
            <div className="border-2 border-[#1e293b] rounded-lg p-10 text-center">
              {!isRecording ? (
                <div>
                  <button onClick={startRecording} className="bg-red-600 hover:bg-red-500 text-white rounded-full p-5 mb-3 transition-colors">
                    <Mic className="w-8 h-8" />
                  </button>
                  <p className="text-[#64748b]">Click to start recording</p>
                </div>
              ) : (
                <div>
                  <div className="relative inline-flex mb-4">
                    <div className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-75" />
                    <button onClick={stopRecording} className="relative bg-red-600 hover:bg-red-500 text-white rounded-full p-5 transition-colors">
                      <div className="w-8 h-8 bg-white rounded-sm" />
                    </button>
                  </div>
                  <p className="text-2xl font-mono mb-2 text-white">{formatTime(recordingTime)}</p>
                  <p className="text-[#64748b] text-sm">Recording... click stop when done</p>
                </div>
              )}
            </div>
          )}

          {audioURL && <div className="mt-4"><audio controls src={audioURL} className="w-full" /></div>}

          {audioFile && !isAnalyzing && !results && (
            <button onClick={handleAnalyze} className="w-full mt-4 bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-lg font-medium transition-colors">Analyze Call</button>
          )}

          {isAnalyzing && (
            <div className="mt-6 text-center">
              <div className="flex items-center justify-center gap-3 mb-2">
                <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                <span className="text-blue-400">{loadingStep}</span>
              </div>
              <p className="text-[#475569] text-xs">This may take 20-60 seconds</p>
            </div>
          )}

          {error && <div className="mt-4 bg-yellow-900/20 rounded-lg p-3 text-yellow-400 text-sm text-center">{error}</div>}

          {results && !isAnalyzing && (
            <div className="mt-6 space-y-4">
              <div className="bg-[#1a2332] rounded-lg p-6 text-center">
                <h3 className="text-[#64748b] text-sm mb-3">Overall Risk Score</h3>
                <div className="relative inline-flex items-center justify-center">
                  <svg width="180" height="180" className="transform -rotate-90">
                    <circle cx="90" cy="90" r={radius} fill="none" stroke="#1e293b" strokeWidth="12" />
                    <circle cx="90" cy="90" r={radius} fill="none" stroke="#3b82f6" strokeWidth="12" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} className="transition-all duration-1000 ease-out" />
                  </svg>
                  <div className="absolute text-center">
                    <div className={`text-4xl font-bold ${status?.text}`}>{results.overall_risk_score}</div>
                    <div className={`text-sm ${status?.text}`}>{status?.label}</div>
                  </div>
                </div>
              </div>

              <div className="bg-[#1a2332] rounded-lg p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[#94a3b8] font-medium text-sm">Transcript</h3>
                  <button onClick={() => navigator.clipboard.writeText(results.transcription?.transcript || '')} className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors">
                    <Copy className="w-3 h-3" /> Copy
                  </button>
                </div>
                <div className="bg-[#0f172a] rounded-lg p-3 max-h-40 overflow-y-auto text-sm text-[#cbd5e1] leading-relaxed">
                  {results.transcription?.transcript || 'No transcript available'}
                </div>
              </div>

              <div className="bg-[#1a2332] rounded-lg p-5">
                <h3 className="text-[#94a3b8] font-medium text-sm mb-3">Scam Analysis</h3>
                {results.scam_analysis && (
                  <>
                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className={`px-3 py-1 rounded-md text-xs font-medium ${results.scam_analysis.is_scam ? 'bg-red-900/30 text-red-400' : 'bg-green-900/30 text-green-400'}`}>
                        {results.scam_analysis.is_scam ? 'Scam Detected' : 'Legitimate Call'}
                      </span>
                      <span className="bg-[#1e293b] text-[#94a3b8] px-3 py-1 rounded-md text-xs">
                        {results.scam_analysis.scam_type?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                    </div>

                    {results.scam_analysis.red_flags?.length > 0 && (
                      <div className="mb-3">
                        <p className="text-red-400 text-xs font-medium mb-2 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Red Flags ({results.scam_analysis.red_flags.length})
                        </p>
                        <ul className="space-y-1">
                          {results.scam_analysis.red_flags.map((flag, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-[#94a3b8]">
                              <span className="text-[#475569] mt-0.5">&bull;</span> {flag}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <p className="text-sm text-[#94a3b8] bg-[#0f172a] rounded-lg p-3">{results.scam_analysis.explanation}</p>
                  </>
                )}
              </div>

              <div className={`rounded-lg p-4 ${results.scam_analysis?.is_scam ? 'bg-red-900/15' : 'bg-green-900/15'}`}>
                <div className="flex items-start gap-3">
                  <AlertTriangle className={`w-5 h-5 mt-0.5 ${results.scam_analysis?.is_scam ? 'text-red-400' : 'text-green-400'}`} />
                  <div>
                    <h3 className="font-medium text-sm mb-1 text-white">{results.scam_analysis?.is_scam ? 'Recommended Action' : 'Call Status'}</h3>
                    <p className="text-sm text-[#cbd5e1]">{results.scam_analysis?.recommended_action}</p>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <button onClick={() => {
                  const text = [
                    '=== Voice Scam Detector Report ===',
                    `Generated: ${results.timestamp}`,
                    `Risk Score: ${results.overall_risk_score}/100`,
                    `Type: ${results.scam_analysis?.scam_type || 'N/A'}`,
                    `Transcript: ${results.transcription?.transcript || ''}`,
                  ].join('\n')
                  const blob = new Blob([text], { type: 'text/plain' })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a'); a.href = url; a.download = `scam-report-${Date.now()}.txt`; a.click()
                  URL.revokeObjectURL(url)
                }} className="flex items-center gap-1.5 text-sm text-blue-400 hover:text-blue-300 mx-auto transition-colors">
                  <Download className="w-3.5 h-3.5" /> Download Report
                </button>
              </div>
            </div>
          )}
        </div>
      </Container>
    </Page>
  )
}
