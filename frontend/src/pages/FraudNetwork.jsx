import { useState, useEffect, useRef, useCallback } from 'react'
import ForceGraph2D from 'react-force-graph-2d'
import { api } from '../api/client'

const API_BASE = 'http://localhost:8000'

const NODE_COLORS = {
  mastermind: '#ef4444',
  operator: '#f97316',
  mule_account: '#8b5cf6',
  sim_card: '#22c55e',
  victim: '#6b7280',
}

const NODE_SIZES = {
  mastermind: 14,
  operator: 9,
  mule_account: 7,
  sim_card: 5,
  victim: 5,
}

const EDGE_COLORS = {
  controls: 'rgba(148, 163, 184, 0.6)',
  transfers_to: 'rgba(59, 130, 246, 0.7)',
  calls_from: 'rgba(34, 197, 94, 0.6)',
  defrauded: 'rgba(239, 68, 68, 0.4)',
  shared_mule: '#ffffff',
}

function formatAmount(amount) {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)}Cr`
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)}L`
  return `₹${Number(amount).toLocaleString('en-IN')}`
}

function getNodeLabel(node) {
  switch (node.type) {
    case 'mastermind': return node.name || node.id
    case 'operator': return node.user_id || node.id
    case 'mule_account': return node.receiver_id || node.id
    case 'sim_card': return node.phone_number ? node.phone_number.slice(-4) : node.id
    case 'victim': return node.name || node.id
    default: return node.id
  }
}

function FraudNetwork() {
  const [networkData, setNetworkData] = useState(null)
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState(null)
  const [searching, setSearching] = useState(false)

  const [selectedNode, setSelectedNode] = useState(null)
  const [highlightNodes, setHighlightNodes] = useState(new Set())
  const [highlightLinks, setHighlightLinks] = useState(new Set())

  const [ringFilter, setRingFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [showVictims, setShowVictims] = useState(true)

  const [reportLoading, setReportLoading] = useState(false)
  const [reportContent, setReportContent] = useState(null)

  const graphRef = useRef()
  const fgRef = useRef()

  useEffect(() => {
    fetch(`${API_BASE}/network`)
      .then(r => { if (!r.ok) throw new Error('Failed to load'); return r.json() })
      .then(data => {
        setNetworkData(data)
        setStats(data.stats)
        setLoading(false)
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  const doSearch = useCallback(async (query) => {
    if (!query.trim()) {
      setSearchResults(null)
      setHighlightNodes(new Set())
      setHighlightLinks(new Set())
      return
    }
    setSearching(true)
    try {
      const r = await fetch(`${API_BASE}/network/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query.trim() }),
      })
      const data = await r.json()
      setSearchResults(data)

      if (data.found) {
        const nodeIds = new Set(data.connected_nodes.map(n => n.id))
        const matchedIds = new Set(data.matches.map(n => n.id))

        let linkKeys = new Set()
        if (networkData) {
          networkData.edges.forEach(e => {
            if (nodeIds.has(e.source) || nodeIds.has(e.target)) {
              linkKeys.add(`${e.source}|${e.target}|${e.type}`)
            }
          })
        }
        setHighlightNodes(matchedIds)
        setHighlightLinks(linkKeys)
      } else {
        setHighlightNodes(new Set())
        setHighlightLinks(new Set())
      }
    } catch (e) {
      setSearchResults({ found: false, matches: [], connected_nodes: [] })
    }
    setSearching(false)
  }, [networkData])

  const clearSearch = useCallback(() => {
    setSearchQuery('')
    setSearchResults(null)
    setHighlightNodes(new Set())
    setHighlightLinks(new Set())
  }, [])

  const handleNodeClick = useCallback(async (node) => {
    setSelectedNode(node)
    setReportContent(null)
  }, [])

  const handleBackgroundClick = useCallback(() => {
    setSelectedNode(null)
    setReportContent(null)
  }, [])

  const downloadReport = useCallback(async (nodeId) => {
    setReportLoading(true)
    try {
      const data = await api.generateReport(nodeId)
      setReportContent(data.report)

      const blob = new Blob([data.report], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `fraud_report_${nodeId}.txt`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error('Report download failed', e)
    }
    setReportLoading(false)
  }, [])

  if (loading) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-slate-900 text-slate-300">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-[#1e293b] border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-lg">Loading fraud network...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-slate-900 text-slate-300">
        <div className="text-center max-w-md">
          <div className="text-red-400 text-5xl mb-4">!</div>
          <h2 className="text-xl font-semibold mb-2">Failed to load network</h2>
          <p className="text-slate-400 mb-4">{error}</p>
          <p className="text-sm text-slate-500">Make sure the backend is running on port 8000</p>
        </div>
      </div>
    )
  }

  const graphData = {
    nodes: (networkData?.nodes || []).filter(n => {
      if (!showVictims && n.type === 'victim') return false
      if (ringFilter !== 'all' && n.ring !== parseInt(ringFilter)) return false
      if (typeFilter !== 'all' && n.type !== typeFilter) return false
      return true
    }),
    links: (networkData?.edges || []).filter(e => {
      const sourceOk = networkData?.nodes.find(n => n.id === e.source)
      const targetOk = networkData?.nodes.find(n => n.id === e.target)
      if (!sourceOk || !targetOk) return false
      if (!showVictims && (sourceOk.type === 'victim' || targetOk.type === 'victim')) return false
      if (ringFilter !== 'all') {
        if (sourceOk.ring !== parseInt(ringFilter) || targetOk.ring !== parseInt(ringFilter)) return false
      }
      if (typeFilter !== 'all') {
        if (sourceOk.type !== typeFilter || targetOk.type !== typeFilter) return false
      }
      return true
    }),
  }

  const isHighlighted = highlightNodes.size > 0

  return (
    <div className="w-screen h-screen bg-slate-900 text-slate-200 flex flex-col overflow-hidden">
      <header className="bg-slate-800/80 border-b border-slate-700 px-4 py-2 flex items-center gap-4 shrink-0 z-10 flex-wrap">
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm">FS</div>
          <span className="font-semibold text-sm hidden sm:inline">Fraud Shield</span>
        </div>

        <div className="relative flex-1 min-w-[200px] max-w-md">
          <input
            type="text"
            placeholder="Search phone, receiver ID, user ID..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && doSearch(searchQuery)}
            className="w-full bg-[#1e293b] text-[#e2e8f0] rounded-lg pl-9 pr-8 py-1.5 text-sm focus:outline-none placeholder-[#475569]"
          />
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {searchQuery && (
            <button onClick={clearSearch} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        <select value={ringFilter} onChange={e => setRingFilter(e.target.value)}
          className="bg-[#1e293b] text-[#e2e8f0] rounded-lg px-3 py-1.5 text-sm">
           <option value="all">All Rings</option>
           <option value="0">Ring 1</option>
           <option value="1">Ring 2</option>
           <option value="2">Ring 3</option>
        </select>

        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
          className="bg-[#1e293b] text-[#e2e8f0] rounded-lg px-3 py-1.5 text-sm">
           <option value="all">All Types</option>
          <option value="mastermind">Masterminds</option>
          <option value="operator">Operators</option>
          <option value="mule_account">Mule Accounts</option>
          <option value="sim_card">SIM Cards</option>
          <option value="victim">Victims</option>
        </select>

        <label className="flex items-center gap-2 text-sm cursor-pointer shrink-0">
          <input type="checkbox" checked={showVictims} onChange={e => setShowVictims(e.target.checked)}
            className="rounded bg-[#1e293b] text-blue-500" />
          Victims
        </label>

        {searchResults && searchResults.found && (
          <div className="text-xs text-blue-400 shrink-0">
            {searchResults.matches.length} match{searchResults.matches.length !== 1 ? 'es' : ''} found
          </div>
        )}
      </header>

      <div className="flex-1 flex overflow-hidden relative">
        <div className="flex-1 relative">
          <ForceGraph2D
            ref={fgRef}
            graphData={graphData}
            nodeId="id"
            nodeVal={n => NODE_SIZES[n.type] || 5}
            nodeColor={n => {
              if (isHighlighted && !highlightNodes.has(n.id)) return 'rgba(100, 116, 139, 0.15)'
              return NODE_COLORS[n.type] || '#94a3b8'
            }}
            nodeLabel={n => `${getNodeLabel(n)} (${n.type})`}
            linkColor={l => {
              const srcId = typeof l.source === 'object' ? l.source.id : l.source
              const tgtId = typeof l.target === 'object' ? l.target.id : l.target
              const linkKey = `${srcId}|${tgtId}|${l.type}`
              if (isHighlighted && !highlightLinks.has(linkKey)) return 'rgba(100, 116, 139, 0.08)'
              return EDGE_COLORS[l.type] || 'rgba(148, 163, 184, 0.4)'
            }}
            linkWidth={l => l.type === 'shared_mule' ? 3 : l.type === 'controls' ? 2 : 1}
            linkDashArray={l => l.type === 'shared_mule' ? [5, 3] : null}
            linkDirectionalParticles={l => l.type === 'shared_mule' ? 4 : 0}
            linkDirectionalParticleWidth={2}
            linkDirectionalParticleSpeed={0.005}
            onNodeClick={handleNodeClick}
            onBackgroundClick={handleBackgroundClick}
            nodeCanvasObject={(node, ctx, globalScale) => {
              const size = NODE_SIZES[node.type] * (globalScale < 0.6 ? 0.7 : 1)
              const isSelected = selectedNode?.id === node.id
              const opacity = isHighlighted && !highlightNodes.has(node.id) ? 0.15 : 1

              ctx.beginPath()
              ctx.arc(node.x, node.y, isSelected ? size + 2 : size, 0, 2 * Math.PI)
              ctx.fillStyle = NODE_COLORS[node.type] || '#94a3b8'
              ctx.globalAlpha = opacity
              ctx.fill()

              if (isSelected) {
                  ctx.strokeStyle = '#3b82f6'
                ctx.lineWidth = 2
                ctx.stroke()
              }

              const label = getNodeLabel(node)
              if (globalScale >= 0.5) {
                ctx.font = `${Math.max(6, 10 / globalScale)}px Inter, sans-serif`
                ctx.textAlign = 'center'
                ctx.textBaseline = 'bottom'
                ctx.fillStyle = `rgba(255, 255, 255, ${opacity * 0.9})`
                ctx.fillText(label, node.x, node.y - size - 2 / globalScale)
              }

              ctx.globalAlpha = 1
            }}
            linkCanvasObjectMode={() => 'after'}
            linkCanvasObject={(link, ctx, globalScale) => {
              if (link.type !== 'shared_mule') return
              const start = link.source
              const end = link.target
              if (!start || !end || !start.x || !end.x) return

              const dx = end.x - start.x
              const dy = end.y - start.y
              const len = Math.sqrt(dx * dx + dy * dy)
              const dashLen = 6 / globalScale
              const gapLen = 4 / globalScale
              const totalSegLen = dashLen + gapLen
              const numDashes = Math.floor(len / totalSegLen)

              ctx.beginPath()
              for (let i = 0; i < numDashes; i++) {
                const t0 = i / numDashes
                const t1 = (i + 0.6) / numDashes
                ctx.moveTo(start.x + dx * t0, start.y + dy * t0)
                ctx.lineTo(start.x + dx * t1, start.y + dy * t1)
              }
              ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)'
              ctx.lineWidth = 3 / globalScale
              ctx.stroke()

              const midX = (start.x + end.x) / 2
              const midY = (start.y + end.y) / 2
              ctx.font = `${10 / globalScale}px Inter, sans-serif`
              ctx.textAlign = 'center'
              ctx.textBaseline = 'bottom'
              ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
              ctx.fillText('shared mule', midX, midY - 4 / globalScale)
            }}
            cooldownTicks={100}
            warmupTicks={0}
            enableNodeDrag={true}
            enableZoomInteraction={true}
            nodeRelSize={4}
            linkDirectionalArrowLength={4}
            linkDirectionalArrowRelPos={0.9}
            minZoom={0.3}
            maxZoom={4}
          />

          {searchResults && !searchResults.found && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-slate-800 text-slate-300 px-4 py-2 rounded-lg border border-slate-600 text-sm shadow-lg">
              No results found for "{searchQuery}"
            </div>
          )}
        </div>

        {selectedNode && (
          <aside className="w-80 bg-slate-800/90 border-l border-slate-700 overflow-y-auto shrink-0">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: NODE_COLORS[selectedNode.type] }} />
                  <h3 className="font-semibold text-sm">{selectedNode.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</h3>
                </div>
                <button onClick={() => setSelectedNode(null)} className="text-slate-400 hover:text-white">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-3 text-sm">
                <Field label="ID" value={selectedNode.id} />
                <Field label="Ring" value={`Ring ${selectedNode.ring + 1}`} color={selectedNode.ring_color} />
                <Field label="Risk Score" value={selectedNode.risk_score} />

                {selectedNode.type === 'mastermind' && (
                  <>
                    <Field label="Name" value={selectedNode.name} />
                    <Field label="Status" value={selectedNode.status} />
                    <Field label="Amount (Cr)" value={`₹${selectedNode.amount_crore} Crore`} />
                    <Field label="Total Loss" value={formatAmount(selectedNode.total_amount_inr)} />
                    <Field label="Scam Type" value={selectedNode.primary_scam_type} />
                    <Field label="City" value={selectedNode.city} />
                    <Field label="First Seen" value={selectedNode.first_seen} />
                    <Field label="Last Active" value={selectedNode.last_active} />
                  </>
                )}

                {selectedNode.type === 'operator' && (
                  <>
                    <Field label="User ID" value={selectedNode.user_id} />
                    <Field label="Status" value={selectedNode.status} />
                    <Field label="Age Group" value={selectedNode.age_group} />
                    <Field label="KYC" value={selectedNode.kyc_status} />
                    <Field label="App" value={selectedNode.preferred_app} />
                    <Field label="Account Age" value={`${selectedNode.account_age_days} days`} />
                    <Field label="Fraud Txns" value={selectedNode.fraud_txn_count} />
                    <Field label="Fraud Amount" value={formatAmount(selectedNode.total_fraud_amount)} />
                    <Field label="Scam Type" value={selectedNode.scam_type} />
                    <Field label="City" value={selectedNode.city} />
                    <Field label="Device Flags" value={selectedNode.new_device_flags} />
                    <Field label="IP Mismatches" value={selectedNode.ip_mismatches} />
                  </>
                )}

                {selectedNode.type === 'mule_account' && (
                  <>
                    <Field label="Receiver ID" value={selectedNode.receiver_id} />
                    <Field label="Bank" value={selectedNode.bank} />
                    <Field label="Category" value={selectedNode.merchant_category} />
                    <Field label="Rating" value={selectedNode.merchant_rating} />
                    <Field label="Amount Received" value={formatAmount(selectedNode.amount_received)} />
                    <Field label="Transactions" value={selectedNode.transaction_count} />
                    <Field label="Status" value={selectedNode.status} />
                    <Field label="City" value={selectedNode.city} />
                    {selectedNode.shared_across_rings && (
                      <div className="bg-yellow-900/40 border border-yellow-600/50 rounded-lg p-3 mt-2">
                        <div className="text-yellow-400 font-semibold text-xs mb-1">CROSS-RING LINK DETECTED</div>
                        <p className="text-yellow-300/80 text-xs">
                          This mule (receiver_id: {selectedNode.receiver_id}) is shared across rings.
                          {selectedNode.linked_mule_ids?.length > 0 && (
                            <> Linked to: {selectedNode.linked_mule_ids.join(', ')}</>
                          )}
                        </p>
                      </div>
                    )}
                  </>
                )}

                {selectedNode.type === 'sim_card' && (
                  <>
                    <Field label="Phone" value={selectedNode.phone_number} />
                    <Field label="Carrier" value={selectedNode.carrier} />
                    <Field label="Activation" value={selectedNode.activation_date} />
                    <Field label="IMEI Changes" value={selectedNode.imei_changes} />
                    <Field label="Status" value={selectedNode.status} />
                  </>
                )}

                {selectedNode.type === 'victim' && (
                  <>
                    <Field label="Name" value={selectedNode.name} />
                    <Field label="Phone" value={selectedNode.phone_number} />
                    <Field label="Age" value={selectedNode.age} />
                    <Field label="Amount Lost" value={formatAmount(selectedNode.amount_lost)} />
                    <Field label="Date" value={selectedNode.date_defrauded} />
                    <Field label="Scam Type" value={selectedNode.scam_type} />
                    <Field label="Complaint" value={selectedNode.complaint_status?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} />
                    <Field label="FIR" value={selectedNode.fir_number || 'Not filed'} />
                    <Field label="City" value={selectedNode.city} />
                  </>
                )}
              </div>

              <div className="mt-4 space-y-2">
                <button
                  onClick={() => downloadReport(selectedNode.id)}
                  disabled={reportLoading}
                  className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-[#1e293b] text-white rounded-lg py-2 text-sm font-medium transition-colors"
                >
                  {reportLoading ? 'Generating...' : 'Download Report'}
                </button>
              </div>

              {reportContent && (
                <div className="mt-3 bg-slate-900/80 rounded-lg p-3 max-h-40 overflow-y-auto">
                  <pre className="text-xs text-slate-400 whitespace-pre-wrap font-mono leading-tight">{reportContent}</pre>
                </div>
              )}
            </div>
          </aside>
        )}
      </div>

      {stats && (
        <footer className="bg-slate-800/80 border-t border-slate-700 px-4 py-2 shrink-0">
          <div className="flex gap-6 justify-center flex-wrap text-sm">
            <Stat label="Total Nodes" value={stats.total_nodes} />
            <Stat label="Fraud Rings" value={stats.fraud_rings} />
            <Stat label="Victims" value={stats.total_victims} />
            <Stat label="Total Loss" value={`₹${stats.amount_crore}Cr`} />
            <Stat label="Geographic Spread" value={`${stats.geographic_spread} states`} />
          </div>
        </footer>
      )}
    </div>
  )
}

function Field({ label, value, color }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-slate-400 text-xs">{label}</span>
      <span className="text-slate-200 text-xs font-medium truncate ml-2" style={color ? { color } : {}}>
        {value ?? 'N/A'}
      </span>
    </div>
  )
}

function Stat({ label, value }) {
  return (
    <div className="text-center">
      <div className="text-lg font-bold text-blue-400">{value}</div>
      <div className="text-xs text-slate-400">{label}</div>
    </div>
  )
}

export default FraudNetwork
