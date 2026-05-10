import { useState, useEffect, useRef } from "react"
import Dashboard from "./Dashboard.jsx"
import Settings from "./Settings.jsx"
import History from "./History.jsx"
import { Zap, Settings2, History as HistoryIcon, LogOut, Github } from "lucide-react"

const API = import.meta.env.VITE_API_URL

export default function App() {
  const [page, setPage] = useState("dashboard")
  const dark = true
  const [logs, setLogs] = useState([])
  const [status, setStatus] = useState("stopped")
  const [stats, setStats] = useState({ total: 0, success: 0, failed: 0, file_types: {} })
  const [authed, setAuthed] = useState(() => localStorage.getItem("tg_authed") === "true")
  const [user, setUser] = useState("")
  const [pass, setPass] = useState("")
  const [error, setError] = useState("")
  const wsRef = useRef(null)

  const handleLogin = () => {
    if (user === import.meta.env.VITE_AUTH_USER && pass === import.meta.env.VITE_AUTH_PASS) {
      localStorage.setItem("tg_authed", "true")
      setAuthed(true)
      setError("")
    } else {
      setError("Invalid username or password")
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("tg_authed")
    setAuthed(false)
    setUser("")
    setPass("")
  }

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleLogin()
  }

  useEffect(() => {
    if (!authed) return
    fetchStats()
    connectWS()
    return () => {
      if (wsRef.current) {
        wsRef.current.onclose = null
        wsRef.current.close()
      }
    }
  }, [authed])

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
        if (data.status === "success") fetchStats()
      }
      if (data.type === "status") {
        setStatus(data.state)
        if (data.state === "stopped") fetchStats()
      }
    }

    ws.onclose = () => {
      if (wsRef.current === ws) setTimeout(connectWS, 3000)
    }
  }

  const navItems = [
    { id: "dashboard", icon: Zap, label: "Forward" },
    { id: "history", icon: HistoryIcon, label: "History" },
    { id: "settings", icon: Settings2, label: "Settings" },
  ]

  if (!authed) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#060a10", fontFamily: "DM Sans, sans-serif", position: "relative", overflow: "hidden" }}>

      {/* Background grid */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none",
        backgroundImage: `linear-gradient(rgba(41,169,250,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(41,169,250,0.03) 1px, transparent 1px)`,
        backgroundSize: "40px 40px"
      }} />

      {/* Glow */}
      <div style={{ position: "fixed", top: 0, left: "50%", transform: "translateX(-50%)", width: "500px", height: "500px", background: "radial-gradient(circle, rgba(41,169,250,0.08) 0%, transparent 70%)", pointerEvents: "none" }} />

      {/* Card */}
      <div style={{
        background: "rgba(14,22,40,0.9)", border: "1px solid rgba(41,169,250,0.2)",
        borderRadius: "20px", padding: "40px 36px", width: "360px",
        boxShadow: "0 0 60px rgba(41,169,250,0.1)", position: "relative", zIndex: 1
      }}>

        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "8px" }}>
          <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: "linear-gradient(135deg, #29a9fa, #0a72d6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Zap size={22} color="white" />
          </div>
        </div>

        <h2 style={{ color: "#29a9fa", fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: "22px", textAlign: "center", marginBottom: "4px" }}>TG Forwarder</h2>
        <p style={{ color: "rgba(41,169,250,0.4)", fontSize: "12px", textAlign: "center", fontFamily: "JetBrains Mono, monospace", marginBottom: "28px" }}>Telegram Channel Sync</p>
        <p style={{ color: "rgba(41,169,250,0.4)", fontSize: "20px", textAlign: "center", fontFamily: "JetBrains Mono, monospace",marginTop:"-20px",marginBottom: "15px"}}>Vortx</p>

        {/* Username */}
        <div style={{ marginBottom: "12px" }}>
          <label style={{ display: "block", fontSize: "11px", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "6px" }}>Username</label>
          <input
            placeholder="Enter username"
            value={user}
            onChange={e => { setUser(e.target.value); setError("") }}
            onKeyDown={handleKeyDown}
            style={{ width: "100%", padding: "12px 14px", borderRadius: "10px", background: "rgba(12,18,32,0.8)", border: "1px solid rgba(41,169,250,0.15)", color: "white", outline: "none", fontSize: "14px", boxSizing: "border-box" }}
          />
        </div>

        {/* Password */}
        <div style={{ marginBottom: "8px" }}>
          <label style={{ display: "block", fontSize: "11px", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "6px" }}>Password</label>
          <input
            placeholder="Enter password"
            type="password"
            value={pass}
            onChange={e => { setPass(e.target.value); setError("") }}
            onKeyDown={handleKeyDown}
            style={{ width: "100%", padding: "12px 14px", borderRadius: "10px", background: "rgba(12,18,32,0.8)", border: "1px solid rgba(41,169,250,0.15)", color: "white", outline: "none", fontSize: "14px", boxSizing: "border-box" }}
          />
        </div>

        {/* Error */}
        {error && <p style={{ color: "#f87171", fontSize: "12px", marginBottom: "12px", textAlign: "center" }}>{error}</p>}

        {/* Sign In Button */}
        <button
          onClick={handleLogin}
          style={{ width: "100%", padding: "13px", borderRadius: "10px", background: "linear-gradient(135deg,#29a9fa,#0a72d6)", color: "white", fontWeight: 700, border: "none", cursor: "pointer", fontSize: "14px", marginTop: "8px", boxShadow: "0 4px 20px rgba(41,169,250,0.3)", letterSpacing: "0.05em" }}
        >
          Sign In
        </button>
        {/* GitHub Icon */}
        <div style={{ textAlign: "center", marginTop: "20px", marginBottom: "-16px"}}>
          <a href="https://github.com/Subhankar43/Vortx-Tg-Forwarder" target="_blank" rel="noreferrer" style={{ color: "#29a9fa", display: "inline-block", filter: "drop-shadow(0 0 8px rgba(41,169,250,0.9))" }}>
            <Github size={35} />
          </a>
        </div>
      </div>
    </div>
  )

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
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #29a9fa, #0a72d6)" }}>
            <Zap size={18} className="text-white" />
          </div>
          <div>
            <h1 className="font-display font-bold text-lg text-white tracking-tight">TG Forwarder</h1>
            <p className="text-xs text-blue-400/60 font-mono">Telegram Channel Sync</p>
          </div>
        </div>

        <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none">
          <span className="font-display font-black text-xl text-white tracking-[0.3em]">VORTX</span>
        </div>

        <div className="flex items-center gap-3">
          <a href="https://vortx.pages.dev" target="_blank" rel="noreferrer"
            className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono font-medium text-blue-400 hover:text-white transition-all duration-200"
            style={{ background: "rgba(41,169,250,0.1)", border: "1px solid rgba(41,169,250,0.2)" }}>
            Portfolio
          </a>

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

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all hover:scale-[1.02]"
            style={{ background: "rgba(250,70,70,0.08)", border: "1px solid rgba(250,70,70,0.2)", color: "#f87171" }}
          >
            <LogOut size={12} />
            Logout
          </button>
        </div>
      </header>

      {/* Nav */}
      <nav className="relative z-10 flex items-center gap-1 px-4 sm:px-8 pt-4">
        {navItems.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => setPage(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              page === id ? "text-white" : "text-slate-500 hover:text-slate-300"
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
        Made with ❤️ by{" "}
        <a href="https://www.instagram.com/vortx_43" target="_blank" rel="noreferrer"
          style={{ color: "#ffffff", textDecoration: "none", fontSize: "12px" }}>
          Subhankar
        </a>
      </footer>
    </div>
  )
}