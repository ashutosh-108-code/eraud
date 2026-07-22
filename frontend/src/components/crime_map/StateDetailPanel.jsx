export default function StateDetailPanel({ states, selectedState, summary, onStateSelect }) {
  const sorted = [...states].sort((a, b) => b.fraud_count - a.fraud_count)

  if (selectedState) {
    const s = selectedState
    return (
      <div className="bg-[#1a2332] rounded-lg p-4 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-bold text-white">{s.sender_state}</h3>
          <button onClick={() => onStateSelect(null)} className="text-xs text-[#64748b] hover:text-[#94a3b8]">Back</button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#0f172a] rounded p-3">
            <div className="text-[#64748b] text-xs">Fraud Cases</div>
            <div className="text-xl font-bold text-red-400">{s.fraud_count}</div>
          </div>
          <div className="bg-[#0f172a] rounded p-3">
            <div className="text-[#64748b] text-xs">Fraud Rate</div>
            <div className="text-xl font-bold text-white">{s.fraud_rate}%</div>
          </div>
          <div className="bg-[#0f172a] rounded p-3">
            <div className="text-[#64748b] text-xs">Top Fraud Type</div>
            <div className="text-lg font-bold text-white">{s.top_fraud_type}</div>
          </div>
          <div className="bg-[#0f172a] rounded p-3">
            <div className="text-[#64748b] text-xs">Top Merchant</div>
            <div className="text-lg font-bold text-white">{s.top_merchant_category}</div>
          </div>
        </div>
        <div className="bg-[#0f172a] rounded p-3">
          <div className="text-[#64748b] text-xs mb-1">State vs National Fraud Rate</div>
          <div className="h-2 bg-[#1e293b] rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min((s.fraud_rate / 0.5) * 100, 100)}%` }} />
          </div>
          <div className="flex justify-between text-xs text-[#64748b] mt-1">
            <span>State: {s.fraud_rate}%</span>
            <span>National: {summary.overall_fraud_rate}%</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-[#1a2332] rounded-lg p-4">
      <h3 className="text-lg font-bold text-white mb-3">Top Affected States</h3>
      <div className="space-y-2">
        {sorted.slice(0, 5).map((s, i) => (
          <div key={s.sender_state} className="p-3 rounded bg-[#0f172a] cursor-pointer hover:bg-[#1e293b] transition" onClick={() => onStateSelect(s)}>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="text-[#475569] text-sm">{i + 1}.</span>
                <span className="font-medium text-white">{s.sender_state}</span>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                s.risk_level === "high" ? "bg-red-900/30 text-red-400" :
                s.risk_level === "medium" ? "bg-orange-900/30 text-orange-400" : "bg-yellow-900/30 text-yellow-400"
              }`}>
                {s.risk_level.toUpperCase()}
              </span>
            </div>
            <div className="flex gap-4 mt-1 text-sm text-[#64748b]">
              <span>{s.fraud_count} cases</span>
              <span>{s.fraud_rate}% rate</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
