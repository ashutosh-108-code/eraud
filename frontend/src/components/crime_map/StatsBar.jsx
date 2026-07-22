export default function StatsBar({ summary }) {
  const cards = [
    { label: "Total Transactions", value: summary.total_transactions?.toLocaleString() },
    { label: "Fraud Cases", value: summary.total_fraud },
    { label: "Worst State", value: summary.worst_state, sub: `${summary.states_affected} states affected` },
    { label: "Peak Fraud Hour", value: `${summary.peak_fraud_hour}:00` },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map(card => (
        <div key={card.label} className="bg-[#1a2332] rounded-lg p-4">
          <div className="text-[#64748b] text-xs uppercase tracking-wide">{card.label}</div>
          <div className="text-2xl font-bold mt-1 text-white">{card.value}</div>
          {card.sub && <div className="text-[#475569] text-xs mt-1">{card.sub}</div>}
        </div>
      ))}
    </div>
  )
}
