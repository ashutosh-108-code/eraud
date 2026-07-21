const BASE = "http://localhost:8000"

const fetchJSON = async (url, options = {}) => {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export const api = {

  classify: (text) =>
    fetchJSON(`${BASE}/classify`, {
      method: "POST",
      body: JSON.stringify({ text })
    }),

  getMetrics: () =>
    fetchJSON(`${BASE}/metrics`),

  classifierHealth: () =>
    fetchJSON(`${BASE}/health`),

  chat: (message, history = []) =>
    fetchJSON(`${BASE}/chat`, {
      method: "POST",
      body: JSON.stringify({ message, history })
    }),

  chatbotHealth: () =>
    fetchJSON(`${BASE}/health`),

  getNetwork: () =>
    fetchJSON(`${BASE}/network`),

  getNetworkStats: () =>
    fetchJSON(`${BASE}/network/stats`),

  searchNetwork: (query) =>
    fetchJSON(`${BASE}/network/search`, {
      method: "POST",
      body: JSON.stringify({ query })
    }),

  generateReport: (nodeId) =>
    fetchJSON(`${BASE}/network/report`, {
      method: "POST",
      body: JSON.stringify({ node_id: nodeId })
    }),

  graphHealth: () =>
    fetchJSON(`${BASE}/health`),

  getHeatmap: () =>
    fetchJSON(`${BASE}/heatmap`),

  getHeatmapSummary: () =>
    fetchJSON(`${BASE}/heatmap/summary`),

  getHeatmapStates: () =>
    fetchJSON(`${BASE}/heatmap/states`),

  heatmapHealth: () =>
    fetchJSON(`${BASE}/health`),

  analyzeVoice: (formData) =>
    fetch(`${BASE}/voice/analyze`, {
      method: "POST",
      body: formData
    }).then(r => r.json()),

  voiceHealth: () =>
    fetchJSON(`${BASE}/voice/health`),

  analyzeComplaint: (message, location, phoneNumber) =>
    fetchJSON(`${BASE}/analyze-complaint`, {
      method: "POST",
      body: JSON.stringify({
        message,
        location:     location     || null,
        phone_number: phoneNumber  || null,
      })
    }),

  getPipelineStats: () =>
    fetchJSON(`${BASE}/pipeline/stats`),

  checkAllHealth: async () => {
    const checks = await Promise.allSettled([
      fetchJSON(`${BASE}/health`),
      fetchJSON(`${BASE}/health`),
      fetchJSON(`${BASE}/health`),
      fetchJSON(`${BASE}/health`),
      fetchJSON(`${BASE}/health`),
    ])
    return {
      classifier: checks[0].status === 'fulfilled',
      chatbot:    checks[1].status === 'fulfilled',
      graph:      checks[2].status === 'fulfilled',
      heatmap:    checks[3].status === 'fulfilled',
      voice:      checks[4].status === 'fulfilled',
    }
  }
}
