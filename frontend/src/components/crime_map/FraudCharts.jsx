import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine, Area, Cell,
} from "recharts"

const COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#8b5cf6", "#ec4899", "#06b6d4"]

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#1a2332] border border-[#1e293b] rounded p-2 text-xs text-white shadow-lg">
      <div className="font-bold mb-1">{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color }}>
          {p.name}: {typeof p.value === "number" ? p.value.toFixed(3) : p.value}
        </div>
      ))}
    </div>
  )
}

function ChartCard({ title, children }) {
  return (
    <div className="bg-[#1a2332] rounded-lg p-4">
      <h3 className="text-sm font-semibold mb-3 text-white">{title}</h3>
      {children}
    </div>
  )
}

export default function FraudCharts({ hourly, transactionTypes, ageGroups, banks, merchantCategories, daysOfWeek, devices, networks, summary }) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-white">Fraud Patterns</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Fraud by Hour of Day">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={hourly}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="hour" stroke="#64748b" tick={{ fontSize: 12 }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine x={summary?.peak_fraud_hour} stroke="#ef4444" strokeDasharray="5 5" label={{ value: "Peak", position: "top", fill: "#ef4444", fontSize: 12 }} />
              <Area type="monotone" dataKey="fraud_count" fill="rgba(239, 68, 68, 0.1)" />
              <Line type="monotone" dataKey="fraud_count" stroke="#ef4444" strokeWidth={2} dot={{ fill: "#ef4444", r: 3 }} name="Cases" />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Fraud by Transaction Type">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={transactionTypes}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="type" stroke="#64748b" tick={{ fontSize: 12 }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="fraud_count" name="Cases" radius={[4, 4, 0, 0]}>
                {transactionTypes?.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Fraud by Age Group">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={ageGroups}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="age_group" stroke="#64748b" tick={{ fontSize: 12 }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="fraud_count" name="Cases" radius={[4, 4, 0, 0]}>
                {ageGroups?.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Fraud by Bank">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={banks} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis type="number" stroke="#64748b" tick={{ fontSize: 12 }} />
              <YAxis dataKey="bank" type="category" stroke="#64748b" tick={{ fontSize: 12 }} width={80} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="fraud_count" name="Cases" radius={[0, 4, 4, 0]}>
                {banks?.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Fraud by Merchant Category">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={merchantCategories} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis type="number" stroke="#64748b" tick={{ fontSize: 12 }} />
              <YAxis dataKey="category" type="category" stroke="#64748b" tick={{ fontSize: 12 }} width={90} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="fraud_count" name="Cases" radius={[0, 4, 4, 0]}>
                {merchantCategories?.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Day of Week — Fraud Cases">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={daysOfWeek}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="day" stroke="#64748b" tick={{ fontSize: 12 }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="fraud_count" name="Cases" radius={[4, 4, 0, 0]}>
                {daysOfWeek?.map(d => <Cell key={d.day} fill={d.fraud_count >= 70 ? "#ef4444" : d.fraud_count >= 60 ? "#f97316" : "#eab308"} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Device Breakdown">
          <div className="space-y-3">
            {devices?.map(d => (
              <div key={d.device}>
                <div className="flex justify-between text-sm mb-1 text-[#94a3b8]">
                  <span>{d.device}</span>
                  <span>{d.fraud_count} cases ({d.fraud_rate}%)</span>
                </div>
                <div className="h-1.5 bg-[#1e293b] rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(d.fraud_count / Math.max(...devices.map(x => x.fraud_count))) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </ChartCard>

        <ChartCard title="Network Breakdown">
          <div className="space-y-3">
            {networks?.map(n => (
              <div key={n.network}>
                <div className="flex justify-between text-sm mb-1 text-[#94a3b8]">
                  <span>{n.network}</span>
                  <span>{n.fraud_count} cases ({n.fraud_rate}%)</span>
                </div>
                <div className="h-1.5 bg-[#1e293b] rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(n.fraud_count / Math.max(...networks.map(x => x.fraud_count))) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>
    </div>
  )
}
