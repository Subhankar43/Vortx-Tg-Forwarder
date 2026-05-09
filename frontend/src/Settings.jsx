import { useState, useEffect } from "react"
import { Save, Eye, EyeOff, ExternalLink, CheckCircle, Lock } from "lucide-react"

export default function Settings({ api }) {
  const [config, setConfig] = useState({
    api_id: "", api_hash: "", phone: "", source_channel: "", target_channel: ""
  })
  const [showHash, setShowHash] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(false)

  const [password, setPassword] = useState("")
  const [authed, setAuthed] = useState(false)
  const [authError, setAuthError] = useState("")
  const [authLoading, setAuthLoading] = useState(false)

  const handleUnlock = async () => {
    setAuthLoading(true)
    setAuthError("")
    try {
      const r = await fetch(`${api}/config?password=${encodeURIComponent(password)}`)
      if (r.status === 401) {
        setAuthError("Wrong password. Try again.")
        setAuthLoading(false)
        return
      }
      const d = await r.json()
      setConfig(d)
      setAuthed(true)
    } catch {
      setAuthError("Could not connect to backend.")
    }
    setAuthLoading(false)
  }

  const handleSave = async () => {
    const r = await fetch(`${api}/config`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...config, password })
    })
    if (r.status === 401) {
      setAuthed(false)
      setAuthError("Session expired. Please unlock again.")
      return
    }
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const fields = [
    { key: "api_id", label: "API ID", placeholder: "12345678", hint: "From my.telegram.org", type: "text" },
    { key: "api_hash", label: "API Hash", placeholder: "abc123def456...", hint: "From my.telegram.org", type: showHash ? "text" : "password", hasToggle: true },
    { key: "phone", label: "Phone Number", placeholder: "+91 1234567890", hint: "With country code", type: "text" },
    { key: "source_channel", label: "Source Channel", placeholder: "@mychannel or -100123456789", hint: "Channel to forward FROM", type: "text" },
    { key: "target_channel", label: "Target Channel", placeholder: "@mychannel2 or -100123456789", hint: "Channel to forward TO", type: "text" },
  ]

  if (!authed) {
    return (
      <div className="max-w-sm mx-auto mt-16 space-y-4">
        <div className="flex flex-col items-center gap-2 mb-6">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #29a9fa, #0a72d6)" }}>
            <Lock size={22} className="text-white" />
          </div>
          <h2 className="font-display font-bold text-white text-xl">Settings Locked</h2>
          <p className="text-slate-500 text-sm text-center">Enter your admin password to access settings</p>
        </div>

        <div className="glass rounded-2xl p-6 space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-400 uppercase tracking-widest mb-1.5 block">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleUnlock()}
              placeholder="Enter admin password"
              className="w-full px-4 py-3 rounded-xl text-sm font-mono text-white placeholder-slate-700 outline-none transition-all focus:ring-1"
              style={{
                background: "rgba(12,18,32,0.8)",
                border: "1px solid rgba(41,169,250,0.12)",
                "--tw-ring-color": "rgba(41,169,250,0.3)"
              }}
            />
            {authError && <p className="text-red-400 text-xs mt-2 font-mono">{authError}</p>}
          </div>

          <button
            onClick={handleUnlock}
            disabled={authLoading || !password}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: "linear-gradient(135deg, #29a9fa, #0a72d6)", boxShadow: "0 4px 20px rgba(41,169,250,0.25)" }}
          >
            <Lock size={14} />
            {authLoading ? "Unlocking..." : "Unlock Settings"}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-xl space-y-5">
      <div>
        <h2 className="font-display font-bold text-white text-xl">Settings</h2>
        <p className="text-slate-500 text-sm mt-0.5">Configure your Telegram API credentials and channels</p>
      </div>

      {/* Help box */}
      <div className="rounded-xl p-4 flex items-start gap-3" style={{ background: "rgba(41,169,250,0.06)", border: "1px solid rgba(41,169,250,0.15)" }}>
        <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0 mt-0.5">
          <span className="text-blue-400 text-xs font-bold">i</span>
        </div>
        <div className="text-xs text-blue-300/70 leading-relaxed">
          Get your <strong className="text-blue-300">API ID</strong> and <strong className="text-blue-300">API Hash</strong> from{" "}
          <a href="https://my.telegram.org" target="_blank" rel="noreferrer" className="underline text-blue-400 inline-flex items-center gap-0.5 hover:text-blue-300">
            my.telegram.org <ExternalLink size={10} />
          </a>
          . Go to "API development tools" and create an app. For channels, use the username like <code className="font-mono bg-blue-500/10 px-1 py-0.5 rounded">@channelname</code>.
        </div>
      </div>

      <div className="glass rounded-2xl p-6 space-y-4">
        {loading ? (
          <div className="text-center py-8 text-slate-500 font-mono text-sm">Loading...</div>
        ) : (
          fields.map(({ key, label, placeholder, hint, type, hasToggle }) => (
            <div key={key}>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-slate-400 uppercase tracking-widest">{label}</label>
                <span className="text-xs text-slate-600">{hint}</span>
              </div>
              <div className="relative">
                <input
                  type={type}
                  value={config[key]}
                  onChange={e => setConfig(prev => ({ ...prev, [key]: e.target.value }))}
                  placeholder={placeholder}
                  className="w-full px-4 py-3 rounded-xl text-sm font-mono text-white placeholder-slate-700 outline-none transition-all focus:ring-1"
                  style={{
                    background: "rgba(12,18,32,0.8)",
                    border: "1px solid rgba(41,169,250,0.12)",
                    "--tw-ring-color": "rgba(41,169,250,0.3)"
                  }}
                />
                {hasToggle && (
                  <button
                    onClick={() => setShowHash(!showHash)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showHash ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                )}
              </div>
            </div>
          ))
        )}

        <button
          onClick={handleSave}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:scale-[1.01] active:scale-[0.99] mt-2"
          style={{ background: saved ? "linear-gradient(135deg, #22c55e, #16a34a)" : "linear-gradient(135deg, #29a9fa, #0a72d6)", boxShadow: "0 4px 20px rgba(41,169,250,0.25)" }}
        >
          {saved ? <><CheckCircle size={15} /> Saved!</> : <><Save size={15} /> Save Settings</>}
        </button>
      </div>

      {/* First-time note */}
      <div className="rounded-xl p-4" style={{ background: "rgba(250,196,41,0.05)", border: "1px solid rgba(250,196,41,0.12)" }}>
        <p className="text-xs text-yellow-300/70 leading-relaxed">
          <strong className="text-yellow-300">First time only:</strong> When you click Start Forwarding, Telegram will ask for an OTP on your phone. Enter it in the terminal where the backend is running. After that, a session file will be saved and you won't need OTP again.
        </p>
      </div>
    </div>
  )
}