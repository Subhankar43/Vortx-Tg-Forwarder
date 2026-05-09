export default {
  async scheduled(event, env, ctx) {
    await fetch("PUT_YOUR_RENDER_URL_HERE");
  },

  async fetch(request, env, ctx) {
    const now = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
    return new Response(`<!DOCTYPE html>
<html>
<head>
  <title>TG Forwarder — Vortx Ping Worker</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: #060a10;
      color: #e2e8f0;
      font-family: 'Segoe UI', sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
    }
    .card {
      background: rgba(14,22,40,0.9);
      border: 1px solid rgba(41,169,250,0.2);
      border-radius: 16px;
      padding: 40px 50px;
      text-align: center;
      box-shadow: 0 0 40px rgba(41,169,250,0.1);
    }
    .dot {
      width: 12px; height: 12px;
      background: #22c55e;
      border-radius: 50%;
      display: inline-block;
      margin-right: 8px;
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.4; }
    }
    h1 { font-size: 22px; color: #29a9fa; margin-bottom: 8px; }
    p { color: #64748b; font-size: 14px; margin-top: 10px; }
    .time { color: #29a9fa88; font-size: 12px; margin-top: 16px; font-family: monospace; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Vortx TG Forward Worker &#9889;</h1>
    <div style="margin-top:16px">
      <span class="dot"></span>
      <span style="color:#22c55e; font-weight:600">Backend Active</span>
    </div>
    <p>Ping worker is running fine.</p>
    <div class="time">Last ping: ${now} IST</div>
  </div>
</body>
</html>`, { headers: { "Content-Type": "text/html" } });
  }
};