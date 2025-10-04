Vixio Studio — Technical Implementation Plan
===========================================

Scope
-----
- MVP: Narrative core, deterministic Cue/Timeline engine, Device Gateway, Babylon.js previz, operator/presenter surfaces, and a dedicated Storyflow React app for narrative flow authoring.

Architecture
------------
- Docker/Compose stack
  - narrative-service (FastAPI): schema validation, storage adapter later.
  - cue-engine (FastAPI): deterministic queue, playhead endpoint.
- device-gateway (Node): WS hub, HTTP cue proxy, OSC send, sACN (direct e131 with bridge fallback), timeline persistence, optional bearer auth, Yjs collaboration websocket (`/collab`).
  - web-previs (Vite/Babylon.js): 3D scene, timeline editor, Operator/Presenter pages.
- web-storyflow (Vite/React/Tailwind): Miro-style flow canvas, cues editor, publish/preview tab, IndexedDB persistence, gateway integration, optional Yjs collaboration.
  - sacn-bridge (FastAPI + python-sacn) optional.

Protocols
---------
- OSC over UDP for app control. sACN/E1.31 for lighting universes; unicast first.
- WS for browser state; HTTP for commands.

AI Provider Selection (Planning phase)
-------------------------------------
- Idea expansion uses a provider chosen during Narrative Planning, not in runtime UI.
- Default: OpenRouter endpoint with model set in environment; per-request model selection supported via request payload.
- Allowed models:
  - x-ai/grok-4-fast:free (fast general-purpose) [OpenRouter docs]
  - deepseek/deepseek-chat-v3.1:free (reasoning-focused) [OpenRouter docs]
- Switching defaults can be done via env; per-request override without restart.

Story Builder (MVP)
-------------------
- Purpose: Author narrative → beats → cues → publish to deterministic timeline for previz/show-control.
- Workflow: Ideation → Story Flow (Miro-style canvas) → Cues → Publish/Preview. Collaboration optional via Yjs (room scoped).
  - Ideation: capture idea, tags, goals. No AI by default; optional “expand” if provider set.
  - Story Flow: canvas with pan/zoom, snap-to-grid, drag-to-connect order, zone lanes, multi-select, undo/redo; inspector for fields.
  - Cues: drop typed cue blocks onto beats; triggers {manual|state|timecode}, priority, retry/failover; inline validation.
  - Publish → Timeline: compile to `timeline.json`; preview in Babylon.js; gateway logs/dispatch.
- Data model
  - `data/gateway/story.json`
    - idea: { text, tags[], notes }
    - characters[] (optional now; roles)
    - beats[]: { id, title, order, tHint?, zone, roles[]?, notes }
    - cues[]: { id, beatId, type, args{}, trigger{}, priority, failover }
    - meta: { version }
  - `data/gateway/timeline.json`: { fps, events:[ { t, payload:{ id, args{} }, meta?:{ priority } } ] }
- Cue templates (seed)
  - lighting.fade: { universe, start, count, level(0..1), time(s) }
  - osc.send: { address, args[] }
  - media.play (stub): { target, clip, layer?, in?, speed?, blend? }
  - previz.marker.show: { id, pos{x,y,z}, color?, label? }
  - previz.camera.flyTo: { pos{x,y,z}, target{x,y,z}, dur }
- Validations
  - Unique IDs; beatId resolvable; lighting bounds; trigger one-of; priority 0..100; roles resolve.
  - Publish requires order or tHint; collisions warn (not fail).
- Gateway API
  - GET /story; POST /story {story}; POST /story/publish → { events, count, warnings? }
  - GET /timeline; POST /cue/trigger {payload}; bearer auth optional for POSTs.
- UI tabs
  - Ideation / Story Flow (canvas) / Cues / Publish & Preview.
- Publish rules
  - Publish is idempotent; re-publish updates timeline deterministically; warnings included in response.
  - t = timecode→sec if timecode; else tHint; else auto-spacing by order (default +3s). One event per cue step; meta.priority preserved.

Data & Files
------------
- Spec lives in `spec/spec.md`; Constitution in `spec/constitution.md`.
- Plan (this file) and tasks at `spec/plan.md`, `spec/tasks.md`.
- Story persisted to `data/gateway/story.json`; timeline to `data/gateway/timeline.json`; local edits cached in IndexedDB and reconciled on save.

Security
--------
- Optional bearer token for write endpoints; future RBAC. Yjs `/collab` can be gated by bearer when configured.
- No secrets committed; environment variables for tokens.

Performance Budgets (MVP)
-------------------------
- OSC P99 ≤10 ms LAN; cue dispatch ≤20 ms; previz ≥30 FPS @1080p; Storyflow canvas interactions ≤50 ms; publish ≤250 ms for ≤200 cues.

Deliverables
------------
- Running stack with Operator and Presenter; Storyflow app (Flow/Cues/Publish), editable timelines; cue send (OSC/sACN) with logs; basic collaboration optional.

