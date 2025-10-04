import asyncio
from fastapi import FastAPI
import sacn

app = FastAPI(title="sACN Bridge", version="0.1.0")


sender = sacn.sACNsender()
sender.start()  # binds to an available socket


@app.get("/health")
async def health() -> dict:
    return {"status": "ok"}


@app.post("/levels")
async def set_levels(payload: dict) -> dict:
    # payload: { universe:int, levels:[0..255], dest: optional ip }
    universe = int(payload.get("universe", 1))
    levels = payload.get("levels", [])
    dest = payload.get("dest")
    if dest:
        sender.activate_output(universe, ip=dest)  # unicast
    else:
        sender.activate_output(universe)  # multicast
    # Ensure list is 512 long
    data = bytearray(512)
    for i, v in enumerate(levels[:512]):
        data[i] = max(0, min(255, int(v)))
    sender[universe].dmx_data = data
    await asyncio.sleep(0)  # yield
    return {"status": "ok", "universe": universe, "len": len(levels)}

