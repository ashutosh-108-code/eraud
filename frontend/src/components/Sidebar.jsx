import { NavLink } from 'react-router-dom'
import { Shield, MessageSquare, Search, Share2, Map, Mic } from 'lucide-react'

const NAV_ITEMS = [
  { path: "/",         icon: Shield,        label: "Dashboard"      },
  { path: "/chat",     icon: MessageSquare, label: "Fraud Shield"   },
  { path: "/classify", icon: Search,        label: "Scam Classifier"},
  { path: "/network",  icon: Share2,        label: "Fraud Network"  },
  { path: "/map",      icon: Map,           label: "Crime Map"      },
  { path: "/voice",    icon: Mic,           label: "Voice Analyzer" },
]

export default function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 h-screen w-56
                      bg-[#0f172a] border-r border-[#1e293b]
                      flex flex-col z-50 select-none">

      <div className="p-4 border-b border-[#1e293b]">
        <div className="flex items-center gap-2.5">
          <Shield className="w-5 h-5 text-blue-400" />
          <span className="font-semibold text-white text-sm">Fraud Shield</span>
        </div>
      </div>

      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === "/"}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2 rounded-md text-sm
               transition-all duration-150
               ${isActive
                 ? 'bg-blue-600/20 text-blue-400'
                 : 'text-[#64748b] hover:text-[#94a3b8] hover:bg-[#1e293b]'
               }`
            }
          >
            <item.icon className="w-4 h-4" />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
