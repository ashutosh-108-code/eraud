import { useState, useEffect } from "react"
import StatsBar from "../components/crime_map/StatsBar"
import IndiaMap from "../components/crime_map/IndiaMap"
import StateDetailPanel from "../components/crime_map/StateDetailPanel"
import FraudCharts from "../components/crime_map/FraudCharts"
import { Page, Container } from "../components/UI"
import { api } from "../api/client"

const FALLBACK_DATA = {
  summary: {
    total_transactions: 250000,
    total_fraud: 480,
    overall_fraud_rate: 0.192,
    states_affected: 10,
    peak_fraud_hour: 19,
    worst_state: "Maharashtra",
    riskiest_age_group: "18-25",
    most_fraud_bank: "SBI",
    total_fraud_amount: 719631.0,
    avg_fraud_amount: 1499.23,
  },
  states: [
    { sender_state: "Maharashtra", fraud_count: 71, total_transactions: 37427, fraud_rate: 0.19, risk_level: "high", lat: 19.75, lng: 75.71, top_fraud_type: "P2P", top_merchant_category: "Grocery" },
    { sender_state: "Karnataka", fraud_count: 69, total_transactions: 29756, fraud_rate: 0.232, risk_level: "high", lat: 15.31, lng: 75.71, top_fraud_type: "P2P", top_merchant_category: "Grocery" },
    { sender_state: "Uttar Pradesh", fraud_count: 52, total_transactions: 30125, fraud_rate: 0.173, risk_level: "high", lat: 26.84, lng: 80.94, top_fraud_type: "P2P", top_merchant_category: "Food" },
    { sender_state: "Delhi", fraud_count: 50, total_transactions: 24870, fraud_rate: 0.201, risk_level: "high", lat: 28.7, lng: 77.1, top_fraud_type: "P2P", top_merchant_category: "Food" },
    { sender_state: "Rajasthan", fraud_count: 46, total_transactions: 19981, fraud_rate: 0.23, risk_level: "medium", lat: 27.02, lng: 74.21, top_fraud_type: "P2M", top_merchant_category: "Grocery" },
    { sender_state: "Gujarat", fraud_count: 43, total_transactions: 20061, fraud_rate: 0.214, risk_level: "medium", lat: 22.25, lng: 71.19, top_fraud_type: "P2P", top_merchant_category: "Food" },
    { sender_state: "Tamil Nadu", fraud_count: 40, total_transactions: 25367, fraud_rate: 0.158, risk_level: "medium", lat: 11.12, lng: 78.65, top_fraud_type: "P2P", top_merchant_category: "Fuel" },
    { sender_state: "Telangana", fraud_count: 39, total_transactions: 22435, fraud_rate: 0.174, risk_level: "medium", lat: 18.11, lng: 79.01, top_fraud_type: "P2P", top_merchant_category: "Other" },
    { sender_state: "Andhra Pradesh", fraud_count: 35, total_transactions: 20006, fraud_rate: 0.175, risk_level: "medium", lat: 15.91, lng: 79.73, top_fraud_type: "P2M", top_merchant_category: "Grocery" },
    { sender_state: "West Bengal", fraud_count: 35, total_transactions: 19972, fraud_rate: 0.175, risk_level: "medium", lat: 22.98, lng: 87.85, top_fraud_type: "P2P", top_merchant_category: "Grocery" },
  ],
  hourly: Array.from({ length: 24 }, (_, i) => ({ hour: i, fraud_count: Math.floor(Math.random() * 40 + 5), fraud_rate: 0.2 })),
  transaction_types: [
    { type: "P2P", fraud_count: 206, fraud_rate: 0.183 },
    { type: "P2M", fraud_count: 167, fraud_rate: 0.191 },
    { type: "Bill Payment", fraud_count: 77, fraud_rate: 0.206 },
    { type: "Recharge", fraud_count: 30, fraud_rate: 0.239 },
  ],
  age_groups: [
    { age_group: "18-25", fraud_count: 143, fraud_rate: 0.229 },
    { age_group: "26-35", fraud_count: 163, fraud_rate: 0.186 },
    { age_group: "36-45", fraud_count: 116, fraud_rate: 0.184 },
    { age_group: "46-55", fraud_count: 31, fraud_rate: 0.125 },
    { age_group: "56+", fraud_count: 27, fraud_rate: 0.216 },
  ],
  banks: [
    { bank: "SBI", fraud_count: 109, fraud_rate: 0.174 },
    { bank: "ICICI", fraud_count: 66, fraud_rate: 0.222 },
    { bank: "HDFC", fraud_count: 62, fraud_rate: 0.165 },
    { bank: "IndusInd", fraud_count: 52, fraud_rate: 0.207 },
    { bank: "PNB", fraud_count: 52, fraud_rate: 0.208 },
  ],
  merchant_categories: [
    { category: "Grocery", fraud_count: 94, fraud_rate: 0.188 },
    { category: "Food", fraud_count: 73, fraud_rate: 0.195 },
    { category: "Shopping", fraud_count: 62, fraud_rate: 0.208 },
    { category: "Fuel", fraud_count: 48, fraud_rate: 0.192 },
  ],
  days_of_week: [
    { day: "Monday", fraud_count: 71, fraud_rate: 0.195 },
    { day: "Tuesday", fraud_count: 58, fraud_rate: 0.163 },
    { day: "Wednesday", fraud_count: 75, fraud_rate: 0.21 },
    { day: "Thursday", fraud_count: 72, fraud_rate: 0.203 },
    { day: "Friday", fraud_count: 61, fraud_rate: 0.172 },
    { day: "Saturday", fraud_count: 68, fraud_rate: 0.192 },
    { day: "Sunday", fraud_count: 75, fraud_rate: 0.208 },
  ],
  devices: [
    { device: "Android", fraud_count: 364, fraud_rate: 0.194 },
    { device: "iOS", fraud_count: 90, fraud_rate: 0.181 },
    { device: "Web", fraud_count: 26, fraud_rate: 0.206 },
  ],
  networks: [
    { network: "4G", fraud_count: 282, fraud_rate: 0.188 },
    { network: "5G", fraud_count: 115, fraud_rate: 0.184 },
    { network: "WiFi", fraud_count: 59, fraud_rate: 0.235 },
    { network: "3G", fraud_count: 24, fraud_rate: 0.192 },
  ],
}

export default function CrimeMap() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [selectedState, setSelectedState] = useState(null)

  useEffect(() => {
    let cancelled = false
    const fetchData = () =>
      api.getHeatmap()
        .then(d => { if (!cancelled) { setData(d); setLoading(false); setError(false) } })
        .catch(() => { if (!cancelled) { setData(FALLBACK_DATA); setLoading(false); setError(true) } })
    fetchData()
    const interval = setInterval(fetchData, 15000)
    return () => { cancelled = true; clearInterval(interval) }
  }, [])

  if (loading) {
    return (
      <Page>
        <Container>
          <div className="flex items-center justify-center min-h-96">
            <div className="text-white text-xl">Loading...</div>
          </div>
        </Container>
      </Page>
    )
  }

  return (
    <Page>
      <Container>
        {error && (
          <div className="mb-4 p-3 bg-yellow-900/20 rounded text-yellow-400 text-sm text-center">
            Demo mode — showing sample data.
          </div>
        )}

        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold">India Fraud Intelligence Map</h1>
            <p className="text-[#64748b] text-sm mt-1">UPI Fraud Patterns Across India</p>
          </div>

          <StatsBar summary={data.summary} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <IndiaMap states={data.states} selectedState={selectedState} onStateSelect={setSelectedState} />
            </div>
            <div>
              <StateDetailPanel states={data.states} selectedState={selectedState} summary={data.summary} onStateSelect={setSelectedState} />
            </div>
          </div>

          <FraudCharts
            hourly={data.hourly}
            transactionTypes={data.transaction_types}
            ageGroups={data.age_groups}
            banks={data.banks}
            merchantCategories={data.merchant_categories}
            daysOfWeek={data.days_of_week}
            devices={data.devices}
            networks={data.networks}
            summary={data.summary}
          />
        </div>
      </Container>
    </Page>
  )
}
