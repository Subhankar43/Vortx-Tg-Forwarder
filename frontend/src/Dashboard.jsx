import { useState } from "react"
import { Play, Pause, Square, FileText, Image, Video, Music, File, TrendingUp, CheckCircle, XCircle, Layers } from "lucide-react"

const FILE_FILTERS = [
  { value: "all", label: "All Files", icon: Layers },
  { value: "pdf", label: "PDFs", icon: FileText },
  { value: "image", label: "Images", icon: Image },
  { value: "video", label: "Videos", icon: Video },
  { value: "audio", label: "Audio", icon: Music },
  { value: "document", label: "Docs", icon: File },
]

const LOG_COLORS = {
  success: "text-green-400",
  error: "text-red-400",
  info: "text-blue-400",
}

const LOG_BG = {
  success: "bg-green-500/5 border-green-500/10",
  error: "bg-red-500/5 border-red-500/10",
  info: "bg-blue-500/5 border-blue-500/10",
}

export default function Dashboard({ api, logs, setLogs, status, setStatus, stats }) {
  const today = new Date().toISOString().split("T")[0]
  const [date, setDate] = useState(today)
  const [filter, setFilter] = useState("all")

  const handleStart = async () => {
    setLogs([])
    if (status === "running") return
    setStatus("running")
    await fetch(`${api}/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, file_filter: filter })
    })

    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission()
    }
  }

  const handlePause = async () => {
    if (status === "paused") {
      await fetch(`${api}/resume`, { method: "POST" })
      setStatus("running")
    } else {
      await fetch(`${api}/pause`, { method: "POST" })
      setStatus("paused")
    }
  }

  const handleStop = async () => {
    await fetch(`${api}/stop`, { method: "POST" })
    setStatus("stopped")
  }

  const formatTime = (iso) => {
    try {
      return new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: "Asia/Kolkata" })
    } catch { return "" }
  }

  return (
    <div className="grid grid-cols-3 gap-6">
      {/* Left: Controls */}
      <div className="col-span-2 space-y-5">
        {/* Control Card */}
        <div className="glass rounded-2xl p-6 glow">
          <h2 className="font-display font-semibold text-white mb-5 text-base">Forward Settings</h2>

          <div className="grid grid-cols-2 gap-4 mb-5">
            {/* Date Picker */}
            <div>
              <label className="text-xs text-slate-400 font-medium mb-2 block uppercase tracking-widest">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-sm font-mono text-white outline-none transition-all"
                style={{ background: "rgba(17,28,48,0.8)", border: "1px solid rgba(41,169,250,0.15)", colorScheme: "dark" }}
              />
            </div>

            {/* Filter */}
            <div>
              <label className="text-xs text-slate-400 font-medium mb-2 block uppercase tracking-widest">File Type</label>
              <div className="grid grid-cols-3 gap-1.5">
                {FILE_FILTERS.map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    onClick={() => setFilter(value)}
                    className={`flex items-center gap-1.5 px-2 py-2 rounded-lg text-xs font-medium transition-all ${
                      filter === value
                        ? "text-white"
                        : "text-slate-500 hover:text-slate-300"
                    }`}
                    style={filter === value ? {
                      background: "linear-gradient(135deg, rgba(41,169,250,0.2), rgba(10,114,214,0.15))",
                      border: "1px solid rgba(41,169,250,0.3)"
                    } : { background: "rgba(17,28,48,0.5)", border: "1px solid rgba(255,255,255,0.04)" }}
                  >
                    <Icon size={12} />
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleStart}
              disabled={status === "running" || status === "paused"}
              className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
              style={{ background: "linear-gradient(135deg, #29a9fa, #0a72d6)", boxShadow: "0 4px 20px rgba(41,169,250,0.3)" }}
            >
              <Play size={15} fill="white" />
              Start Forwarding
            </button>

            <button
              onClick={handlePause}
              disabled={status === "stopped"}
              className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
              style={{ background: "rgba(250,196,41,0.1)", border: "1px solid rgba(250,196,41,0.2)", color: "#fac429" }}
            >
              <Pause size={15} />
              {status === "paused" ? "Resume" : "Pause"}
            </button>

            <button
              onClick={handleStop}
              disabled={status === "stopped"}
              className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
              style={{ background: "rgba(250,70,70,0.1)", border: "1px solid rgba(250,70,70,0.2)", color: "#fa4646" }}
            >
              <Square size={15} />
              Stop
            </button>
          </div>
        </div>

        {/* Live Log */}
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-white text-base">Live Log</h2>
            <div className="flex items-center gap-2">
              {status === "running" && (
                <span className="flex items-center gap-1.5 text-xs text-green-400 font-mono">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                  Live
                </span>
              )}
              {logs.length > 0 && (
                <button onClick={() => setLogs([])} className="text-xs text-slate-500 hover:text-slate-300 transition-colors px-2 py-1 rounded-md hover:bg-white/5">
                  Clear
                </button>
              )}
            </div>
          </div>

          <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
            {logs.length === 0 ? (
              <div className="text-center py-10 text-slate-600">
                <p className="font-mono text-sm">No logs yet</p>
                <p className="text-xs mt-1">Start forwarding to see live output</p>
              </div>
            ) : (
              logs.map((log, i) => (
                <div
                  key={i}
                  className={`log-entry flex items-start gap-3 px-3 py-2.5 rounded-lg border text-xs font-mono ${LOG_BG[log.status] || LOG_BG.info}`}
                >
                  <span className="text-slate-600 mt-0.5 shrink-0">{formatTime(log.timestamp)}</span>
                  <span className={LOG_COLORS[log.status] || "text-slate-400"}>{log.message}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Right: Stats */}
      <div className="space-y-4">
        <div className="glass rounded-2xl p-5 glow">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={15} className="text-blue-400" />
            <h2 className="font-display font-semibold text-white text-base">Stats</h2>
          </div>

          <div className="space-y-3">
            <StatCard label="Total Forwarded" value={stats.total} color="blue" />
            <StatCard label="Successful" value={stats.success} color="green" icon={<CheckCircle size={12} />} />
            <StatCard label="Failed" value={stats.failed} color="red" icon={<XCircle size={12} />} />
          </div>
        </div>

        {/* File types breakdown */}
        {Object.keys(stats.file_types).length > 0 && (
          <div className="glass rounded-2xl p-5">
            <h3 className="font-display font-semibold text-white text-sm mb-4">By File Type</h3>
            <div className="space-y-2.5">
              {Object.entries(stats.file_types).map(([type, count]) => {
                const pct = Math.round((count / stats.total) * 100)
                return (
                  <div key={type}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-slate-400 capitalize">{type}</span>
                      <span className="font-mono text-slate-300">{count}</span>
                    </div>
                    <div className="h-1 rounded-full bg-slate-800">
                      <div
                        className="h-1 rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, background: "linear-gradient(90deg, #29a9fa, #0a72d6)" }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value, color, icon }) {
  const colors = {
    blue: "text-blue-400 bg-blue-500/10 border-blue-500/15",
    green: "text-green-400 bg-green-500/10 border-green-500/15",
    red: "text-red-400 bg-red-500/10 border-red-500/15",
  }
  return (
    <div className={`flex items-center justify-between px-4 py-3 rounded-xl border ${colors[color]}`}>
      <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
        {icon}
        {label}
      </div>
      <span className="font-display font-bold text-xl text-white">{value}</span>
    </div>
  )
}
