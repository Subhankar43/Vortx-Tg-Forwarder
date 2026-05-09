from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import asyncio
import json
import os
from datetime import datetime
import pytz
IST = pytz.timezone("Asia/Kolkata")
from forwarder import TelegramForwarder

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

CONFIG_FILE = "config.json"
HISTORY_FILE = "history.json"

ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "")

forwarder = TelegramForwarder()
connected_clients = []

def load_config():
    if os.path.exists(CONFIG_FILE):
        with open(CONFIG_FILE, "r") as f:
            return json.load(f)
    return {"api_id": "", "api_hash": "", "phone": "", "source_channel": "", "target_channel": ""}

def save_config(data):
    with open(CONFIG_FILE, "w") as f:
        json.dump(data, f, indent=2)

_history_cache = []
def load_history():
    global _history_cache
    if _history_cache:
        return _history_cache
    if os.path.exists(HISTORY_FILE):
        with open(HISTORY_FILE, "r") as f:
            _history_cache = json.load(f)
    return _history_cache

def save_history(history):
    global _history_cache
    _history_cache = history
    with open(HISTORY_FILE, "w") as f:
        json.dump(history, f, indent=2)

async def broadcast(message: dict):
    dead = []
    for client in connected_clients:
        try:
            await client.send_json(message)
        except:
            dead.append(client)
    for d in dead:
        connected_clients.remove(d)

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    if websocket not in connected_clients:
        connected_clients.append(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        connected_clients.remove(websocket)

@app.get("/config")
def get_config(password: str = ""):
    if ADMIN_PASSWORD and password != ADMIN_PASSWORD:
        return JSONResponse(status_code=401, content={"error": "Unauthorized"})
    return load_config()

@app.post("/config")
async def update_config(data: dict):
    password = data.get("password", "")
    if ADMIN_PASSWORD and password != ADMIN_PASSWORD:
        return JSONResponse(status_code=401, content={"error": "Unauthorized"})
    payload = {k: v for k, v in data.items() if k != "password"}
    save_config(payload)
    return {"status": "saved"}

@app.get("/history")
def get_history():
    return load_history()

@app.get("/stats")
def get_stats():
    history = load_history()
    total = len(history)
    success = sum(1 for h in history if h.get("status") == "success")
    failed = total - success
    file_types = {}
    for h in history:
        ft = h.get("file_type", "unknown")
        file_types[ft] = file_types.get(ft, 0) + 1
    return {"total": total, "success": success, "failed": failed, "file_types": file_types}

@app.post("/start")
async def start_forwarding(data: dict):
    if forwarder.state == "running":
        return {"status": "already running"}
    config = load_config()
    date_str = data.get("date", datetime.now().strftime("%Y-%m-%d"))
    file_filter = data.get("file_filter", "all")

    if not config.get("api_id") or not config.get("source_channel"):
        return JSONResponse(status_code=400, content={"error": "Please configure settings first"})

    async def on_log(msg, status="info", file_info=None):
        await broadcast({"type": "log", "message": msg, "status": status, "timestamp": datetime.now(IST).isoformat()})
        if file_info and status == "success":
            history = load_history()
            history.insert(0, {**file_info, "status": "success", "timestamp": datetime.now(IST).isoformat()})
            save_history(history[:100])
        elif file_info and status == "error":
            history = load_history()
            history.insert(0, {**file_info, "status": "error", "timestamp": datetime.now(IST).isoformat()})
            save_history(history[:100])
    if forwarder.state == "running":
        return {"status": "already running"}
    asyncio.create_task(forwarder.start(config, date_str, file_filter, on_log))
    return {"status": "started"}

@app.post("/pause")
async def pause_forwarding():
    forwarder.pause()
    await broadcast({"type": "status", "state": "paused"})
    return {"status": "paused"}

@app.post("/resume")
async def resume_forwarding():
    forwarder.resume()
    await broadcast({"type": "status", "state": "running"})
    return {"status": "resumed"}

@app.post("/stop")
async def stop_forwarding():
    await forwarder.stop()
    await broadcast({"type": "status", "state": "stopped"})
    return {"status": "stopped"}

@app.get("/status")
def get_status():
    return {"state": forwarder.state}