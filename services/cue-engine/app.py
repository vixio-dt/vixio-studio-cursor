import os
import time
from fastapi import FastAPI

app = FastAPI(title="Vixio Cue Engine", version="0.1.0")


@app.get("/")
async def root() -> dict:
    return {"service": "cue-engine", "status": "ok", "endpoints": ["/health", "/cue/trigger", "/playhead"]}

@app.get("/health")
async def health() -> dict:
    return {"status": "ok"}


@app.post("/cue/trigger")
async def trigger_cue(payload: dict) -> dict:
    # Minimal deterministic queue: priority (0-100), FIFO for equal priority
    priority = int(payload.get("priority", 50))
    item = {"payload": payload, "priority": priority, "ts": time.time()}
    _queue.append(item)
    # Keep queue sorted: higher priority first, then earlier ts
    _queue.sort(key=lambda x: (-x["priority"], x["ts"]))
    return {"status": "queued", "priority": priority, "queueSize": len(_queue)}


@app.post("/playhead")
async def playhead_update(payload: dict) -> dict:
    # Accepts { seconds: float } and would sync the engine's transport
    return {"received": payload, "status": "ok"}


# In-memory queue (demo)
_queue: list[dict] = []


@app.get("/queue")
async def get_queue() -> dict:
    return {"queue": _queue}

