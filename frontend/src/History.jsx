import { useState, useEffect } from "react"
import { CheckCircle, XCircle, File, RefreshCw } from "lucide-react"

const TYPE_COLORS = {
  pdf: "text-red-400 bg-red-500/10",
  image: "text-purple-400 bg-purple-500/10",
  video: "text-blue-400 bg-blue-500/10",
  audio: "text-green-400 bg-green-500/10",
  document: "text-yellow-400 bg-yellow-500/10",
  unknown: "text-slate-400 bg-slate-500/10",
}

export default function History({ api }) {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("all")

  useEffect(() => {
    fetchHistory()
  }, [])

  const fetchHistory = async () => {
    setLoading(true)
    try {
      const r = await fetch(`${api}/history`)
      const d = await r.json()
      setHistory(d)
    } catch {}
    setLoading(false)
  }

  const filtered = filter === "all" ? history : history.filter(h => h.status === filter)

  const formatDate = (iso) => {
    try {
      return new Date(iso).toLocaleString("en-IN", {
        day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit"
      })
    } catch { return "" }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-white text-xl">Forward History</h2>
          <p className="text-slate-500 text-sm mt-0.5">Last {history.length} forwarded files</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Filter tabs */}
          <div className="flex gap-1 p-1 rounded-lg" style={{ background: "rgba(17,28,48,0.8)", border: "1px solid rgba(255,255,255,0.05)" }}>
            {["all", "success", "error"].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all capitalize ${
                  filter === f ? "text-white" : "text-slate-500 hover:text-slate-300"
                }`}
                style={filter === f ? { background: "rgba(41,169,250,0.15)", border: "1px solid rgba(41,169,250,0.2)" } : {}}
              >
                {f}
              </button>
            ))}
          </div>
          <button
            onClick={fetchHistory}
            className="p-2 rounded-lg text-slate-400 hover:text-white transition-colors hover:bg-white/5"
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      <div className="glass rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500 font-mono text-sm">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <File size={32} className="text-slate-700 mx-auto mb-3" />
            <p className="text-slate-500 font-mono text-sm">No history found</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                <th className="text-left px-5 py-3.5 text-xs font-medium text-slate-500 uppercase tracking-widest">File</th>
                <th className="text-left px-5 py-3.5 text-xs font-medium text-slate-500 uppercase tracking-widest">Type</th>
                <th className="text-left px-5 py-3.5 text-xs font-medium text-slate-500 uppercase tracking-widest">Time</th>
                <th className="text-left px-5 py-3.5 text-xs font-medium text-slate-500 uppercase tracking-widest">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((h, i) => (
                <tr
                  key={i}
                  className="transition-colors hover:bg-white/[0.02]"
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}
                >
                  <td className="px-5 py-3.5">
                    <span className="text-sm text-slate-200 font-mono">{h.filename || "—"}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`px-2 py-1 rounded-md text-xs font-medium capitalize ${TYPE_COLORS[h.file_type] || TYPE_COLORS.unknown}`}>
                      {h.file_type || "—"}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-xs text-slate-500 font-mono">{formatDate(h.timestamp)}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    {h.status === "success" ? (
                      <span className="flex items-center gap-1.5 text-xs text-green-400">
                        <CheckCircle size={13} /> Success
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-xs text-red-400">
                        <XCircle size={13} /> Failed
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
