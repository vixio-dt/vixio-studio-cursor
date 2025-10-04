Vixio Studio — Internal Phygital MVP
====================================

Quick start (dev)
-----------------

1. Prereqs: Docker Desktop
2. Start stack:

   ```bash
   docker compose up --build
   ```

3. Services:

   - Narrative Service: http://localhost:8000/health
   - Cue Engine: http://localhost:8001/health
   - Device Gateway: http://localhost:8080/health
   - Web Previz: http://localhost:5173

Spec Kit
--------

Spec Kit project is initialized in `spec/`. Use slash commands in Cursor:

- `/constitution …`
- `/specify …`
- `/plan …`
- `/tasks`
- `/implement`

Structure
---------

```
services/
  narrative-service/      # JSON schema + validation API
  cue-engine/             # deterministic scheduler (stub)
  device-gateway/         # WS bridge (stub)
web/
  previz/                 # Babylon.js scaffold
spec/                     # Spec Kit workspace
```

Week-by-week MVP (high-level)
-----------------------------

Week 1: scaffold services, schema, WS bridge, Babylon scene.
Week 2: cue engine deterministic core, priorities, manual triggers.
Week 3: OSC + sACN adapters (sandbox), WebSocket cue preview.
Week 4: timecode chase (LTC read), logging/black-box recorder.
Week 5: rehearsal notebook basics, i18n runtime toggle, metrics.
Week 6: previz calibration flows, device profiles, E2E demo.




