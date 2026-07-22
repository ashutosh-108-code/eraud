import { MapContainer, TileLayer, CircleMarker, Tooltip } from "react-leaflet"
import "leaflet/dist/leaflet.css"

const RISK_COLORS = { high: "#ef4444", medium: "#f97316", low: "#eab308" }

function getRadius(count) {
  if (count >= 60) return 30
  if (count >= 40) return 22
  if (count >= 30) return 16
  return 10
}

export default function IndiaMap({ states, selectedState, onStateSelect }) {
  return (
    <div className="bg-[#1a2332] rounded-lg overflow-hidden">
      <MapContainer center={[20.5937, 78.9629]} zoom={5} style={{ height: "500px", width: "100%" }} scrollWheelZoom={true}>
        <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {states.map(state => (
          <CircleMarker
            key={state.sender_state}
            center={[state.lat, state.lng]}
            radius={getRadius(state.fraud_count)}
            pathOptions={{ color: "#fff", weight: 2, fillColor: RISK_COLORS[state.risk_level] || "#94a3b8", fillOpacity: 0.7 }}
            eventHandlers={{ click: () => onStateSelect(state) }}
          >
            <Tooltip>
              <strong>{state.sender_state}</strong><br />
              Cases: {state.fraud_count}<br />
              Rate: {state.fraud_rate}%<br />
              Risk: {state.risk_level.toUpperCase()}
            </Tooltip>
          </CircleMarker>
        ))}
      </MapContainer>
      <div className="p-3 border-t border-[#1e293b] flex gap-4 text-xs text-[#64748b]">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-[#ef4444]" /> High</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-[#f97316]" /> Medium</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-[#eab308]" /> Low</span>
        <span className="ml-auto">Circle size = fraud volume</span>
      </div>
    </div>
  )
}
