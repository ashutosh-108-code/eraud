import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Sidebar        from './components/Sidebar'
import Dashboard      from './pages/Dashboard'
import FraudShield    from './pages/FraudShield'
import ScamClassifier from './pages/ScamClassifier'
import FraudNetwork   from './pages/FraudNetwork'
import CrimeMap       from './pages/CrimeMap'
import VoiceAnalyzer  from './pages/VoiceAnalyzer'

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen bg-slate-950">

        <Sidebar />

        <main className="flex-1 ml-56 min-h-screen
                         overflow-y-auto">
          <Routes>
            <Route path="/"         element={<Dashboard />}      />
            <Route path="/chat"     element={<FraudShield />}    />
            <Route path="/classify" element={<ScamClassifier />} />
            <Route path="/network"  element={<FraudNetwork />}   />
            <Route path="/map"      element={<CrimeMap />}       />
            <Route path="/voice"    element={<VoiceAnalyzer />}  />
          </Routes>
        </main>

      </div>
    </BrowserRouter>
  )
}
