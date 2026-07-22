import { AlertTriangle } from 'lucide-react'

export const Page = ({ children }) => (
  <div className="min-h-screen bg-[#0f172a] text-white animate-fade-in">
    {children}
  </div>
)

export const Container = ({ children, className = "" }) => (
  <div className={`max-w-7xl mx-auto px-8 py-8 ${className}`}>
    {children}
  </div>
)

export const Card = ({ children, className = "" }) => (
  <div className={`bg-[#1a2332] rounded-lg p-5 ${className}`}>
    {children}
  </div>
)

export const PageHeader = ({ title, subtitle, children }) => (
  <div className="flex items-start justify-between mb-8">
    <div>
      <h1 className="text-2xl font-bold text-white tracking-tight">
        {title}
      </h1>
      {subtitle && (
        <p className="text-[#64748b] text-sm mt-1 leading-relaxed">
          {subtitle}
        </p>
      )}
    </div>
    {children && (
      <div className="flex items-center gap-2 flex-shrink-0">
        {children}
      </div>
    )}
  </div>
)

export const StatCard = ({ label, value, sub }) => (
  <div className="bg-[#1a2332] rounded-lg p-5">
    <div className="text-xs text-[#64748b] font-medium uppercase tracking-wider mb-2">
      {label}
    </div>
    <div className="text-2xl font-bold text-white mb-1">
      {value}
    </div>
    {sub && (
      <div className="text-xs text-[#475569] leading-relaxed">
        {sub}
      </div>
    )}
  </div>
)

export const Button = ({
  children, onClick, variant = "primary",
  size = "md", disabled = false, className = ""
}) => {
  const variants = {
    primary: `bg-blue-600 hover:bg-blue-500 text-white`,
    ghost:   `bg-[#1e293b] hover:bg-[#334155] text-[#94a3b8]`,
    danger:  `bg-red-600 hover:bg-red-500 text-white`,
  }
  const sizes = {
    sm: "px-3 py-1.5 text-xs rounded-md",
    md: "px-4 py-2 text-sm rounded-md",
    lg: "px-6 py-3 text-sm rounded-lg",
  }
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`font-medium transition-all duration-150
                  disabled:opacity-30 disabled:cursor-not-allowed
                  ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </button>
  )
}

export const Badge = ({ children, variant = "default" }) => {
  const variants = {
    default: "bg-[#1e293b] text-[#94a3b8]",
    danger:  "bg-red-900/30 text-red-400",
    warning: "bg-yellow-900/30 text-yellow-400",
    success: "bg-green-900/30 text-green-400",
  }
  return (
    <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${variants[variant]}`}>
      {children}
    </span>
  )
}

export const Input = ({ className = "", ...props }) => (
  <input
    className={`w-full bg-[#1e293b] text-white
                placeholder-[#475569] rounded-lg px-4 py-2.5
                outline-none transition-all text-sm ${className}`}
    {...props}
  />
)

export const Textarea = ({ className = "", ...props }) => (
  <textarea
    className={`w-full bg-[#1e293b] text-white
                placeholder-[#475569] rounded-lg px-4 py-3
                outline-none transition-all text-sm
                resize-none ${className}`}
    {...props}
  />
)

export const Spinner = ({ size = "md" }) => {
  const sizes = {
    sm: "w-4 h-4 border-2",
    md: "w-8 h-8 border-2",
    lg: "w-12 h-12 border-2"
  }
  return (
    <div className={`${sizes[size]} border-[#1e293b]
                     border-t-blue-500 rounded-full animate-spin`} />
  )
}

export const LoadingScreen = ({ message = "Loading..." }) => (
  <div className="flex flex-col items-center justify-center min-h-96 gap-4">
    <Spinner size="lg" />
    <p className="text-[#64748b] text-sm">{message}</p>
  </div>
)

export const SectionTitle = ({ children, subtitle, className = "" }) => (
  <div className={`mb-4 ${className}`}>
    <h2 className="text-base font-semibold text-white">
      {children}
    </h2>
    {subtitle && (
      <p className="text-[#64748b] text-xs mt-0.5">
        {subtitle}
      </p>
    )}
  </div>
)

export const ProgressBar = ({ value, max = 100, className = "" }) => {
  const pct = Math.min(100, Math.max(0, (value / max) * 100))
  return (
    <div className={`w-full ${className}`}>
      <div className="h-1.5 bg-[#1e293b] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out bg-blue-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
