import { useState, useEffect, useRef } from "react"
import Dashboard from "./Dashboard.jsx"
import Settings from "./Settings.jsx"
import History from "./History.jsx"
import { Zap, Settings2, History as HistoryIcon } from "lucide-react"

const API = import.meta.env.VITE_API_URL

export default function App() {
  const [page, setPage] = useState("dashboard")
  const dark= true
  const [logs, setLogs] = useState([])
  const [status, setStatus] = useState("stopped")
  const [stats, setStats] = useState({ total: 0, success: 0, failed: 0, file_types: {} })
  const wsRef = useRef(null)

  useEffect(() => {
    fetchStats()
    connectWS()
    return () => {
      if (wsRef.current) {
        wsRef.current.onclose = null
        wsRef.current.close()
      }
    }
  }, [])

  const fetchStats = async () => {
    try {
      const r = await fetch(`${API}/stats`)
      const d = await r.json()
      setStats(d)
    } catch {}
  }

  const connectWS = () => {
    const wsUrl = API.replace("https://", "wss://").replace("http://", "ws://")
    const ws = new WebSocket(`${wsUrl}/ws`)
    wsRef.current = ws

    ws.onmessage = (e) => {
      const data = JSON.parse(e.data)
      if (data.type === "log") {
        setLogs(prev => [data, ...prev].slice(0, 100))
        if (data.status === "success") {
          fetchStats()
        }
      }
      if (data.type === "status") {
        setStatus(data.state)
        if (data.state === "stopped") fetchStats()
      }
    }

    ws.onclose = () => {
      if (wsRef.current === ws) {
        setTimeout(connectWS, 3000)
      }
    }
  }

  const navItems = [
    { id: "dashboard", icon: Zap, label: "Forward" },
    { id: "history", icon: HistoryIcon, label: "History" },
    { id: "settings", icon: Settings2, label: "Settings" },
  ]

  return (
    <div className={`min-h-screen ${dark ? "" : "bg-slate-100"}`} style={{ background: dark ? "#060a10" : "#f0f4f8" }}>
      {/* Background grid */}
      <div className="fixed inset-0 pointer-events-none" style={{
        backgroundImage: `linear-gradient(rgba(41,169,250,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(41,169,250,0.03) 1px, transparent 1px)`,
        backgroundSize: "40px 40px"
      }} />

      {/* Glow blob */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-96 h-96 pointer-events-none" style={{
        background: "radial-gradient(circle, rgba(41,169,250,0.08) 0%, transparent 70%)",
      }} />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-4 sm:px-8 py-5 border-b border-blue-900/20">

        {/* Left: Logo + TG Forwarder */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #29a9fa, #0a72d6)" }}>
            <Zap size={18} className="text-white" />
          </div>
          <div>
            <h1 className="font-display font-bold text-lg text-white tracking-tight">TG Forwarder</h1>
            <p className="text-xs text-blue-400/60 font-mono">Telegram Channel Sync</p>
          </div>
        </div>

        {/* Center: VORTEX */}
        <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none">
          <span className="font-display font-black text-xl text-white tracking-[0.3em]">VORTX</span>
        </div>

       {/* Right: Portfolio + Status pill */}
<div className="flex items-center gap-4">
    <a href="https://vortx.pages.dev" target="_blank" rel="noreferrer"
    className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono font-medium text-blue-400 hover:text-white transition-all duration-200"
  style={{ background: "rgba(41,169,250,0.1)", border: "1px solid rgba(41,169,250,0.2)"}}> Portfolio </a>
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono font-medium ${
            status === "running" ? "bg-green-500/10 text-green-400 border border-green-500/20" :
            status === "paused" ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20" :
            "bg-slate-800/50 text-slate-500 border border-slate-700/30"
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${
              status === "running" ? "bg-green-400 animate-pulse" :
              status === "paused" ? "bg-yellow-400" : "bg-slate-600"
            }`} />
            {status}
          </div>
        </div>
      </header>

      {/* Nav */}
      <nav className="relative z-10 flex items-center gap-1 px-4 sm:px-8 pt-4">
        {navItems.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => setPage(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              page === id
                ? "text-white"
                : "text-slate-500 hover:text-slate-300"
            }`}
            style={page === id ? { background: "linear-gradient(135deg, rgba(41,169,250,0.15), rgba(10,114,214,0.1))", border: "1px solid rgba(41,169,250,0.2)" } : {}}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </nav>

      {/* Content */}
      <main className="relative z-10 px-4 sm:px-8 py-6">
        {page === "dashboard" && <Dashboard api={API} logs={logs} setLogs={setLogs} status={status} setStatus={setStatus} stats={stats} />}
        {page === "history" && <History api={API} />}
        {page === "settings" && <Settings api={API} />}
      </main>

     {/* Footer */}
      <footer className="relative z-10 text-center py-5 text-sm font-mono" style={{ color: "rgba(41,169,250,0.35)", borderTop: "1px solid rgba(41,169,250,0.08)" }}>
  Made with ❤️ by{" "} <a href="https://www.instagram.com/vortx_43" target="_blank" rel="noreferrer"
    style={{ color: "#ffffff", textDecoration: "none", fontSize: "12px"}}>
    Subhankar
  </a>
</footer>
    </div>
  )
}