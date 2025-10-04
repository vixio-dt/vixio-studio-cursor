# Vixio Studio — Internal Phygital MVP (SEA/Asia)

Definitive Research Report and Technical Specification (with WebGL/Babylon.js 3D Previz)

Date: 2025-09-22

---

## Executive Summary

Vixio Studio is an internal, on‑prem, narrative‑first platform that accelerates delivery of immersive “phygital” experiences for cinema environments, pop‑ups, and LBE venues in SEA/Asia, with initial country focus on Hong Kong, Japan, Singapore, and China. This MVP centers on a robust Narrative Core, deterministic Cue/Timeline Engine, device abstraction for show‑control protocols (OSC, sACN/E1.31, Art‑Net, NDI, Dante), and a newly added WebGL/Babylon.js 3D previz/calibration module. It is offline‑capable on local networks by default, with optional cloud assists; China requires an in‑country split when deployed.

We lock engines (Unreal 5.4+, TouchDesigner, QLab 5, Unity 2022.3 LTS), OS targets (Windows 11 Pro for show/control, macOS for QLab where needed, Linux for services), and time‑sync (PTP primary with LTC/NTP fallback). Compliance is region‑specific (HK PDPO, SG PDPA, JP APPI, CN PIPL/CSL/DSL). Performance budgets are explicit (OSC P99 ≤10 ms; lighting frame‑sync jitter ≤5 ms; audio e2e ≤20 ms; previz ≥30 FPS at 1080p; interaction ≤50 ms; ≤500 MB memory).

Core protocols and standards referenced are stable and widely adopted in live entertainment and AV networks (OSC, sACN/E1.31, Art‑Net, NDI, Dante, IEEE‑1588 PTP, SMPTE ST 12‑1 LTC). Citations included. (cnmat.berkeley.edu)

The MVP adds a WebGL module (Babylon.js) for spatial venue mapping, cue location preview, and device calibration workflows on tablets/laptops over the venue LAN via a secure OSC↔WebSocket bridge. This differentiates the studio, shortens tech rehearsals, and prepares for v2 sensor/tracking adapters across HK/JP/SG/CN venues.

---

## Table of Contents

- Confidence Gate (Final) and Decision Matrix
- Locked Essentials (MVP Scope and Constraints)
- Research: SEA/Asia Current‑State Studio Workflows
- Narrative Core and DSL (Schema + Examples)
- MVP Requirements (Functional + Non‑Functional)
- Compliance & Safety (SEA/Asia)
- System Architecture (On‑Prem First; Optional Cloud)
- Time Sync and Network Design (sACN/NDI Multicast)
- Integration Blueprints (Engines/Consoles/Servers)
- Cue & Timeline Engine (Determinism, Triggers, Failover)
- UX & Workflows (Operator‑First)
 - UX & Workflows (Operator‑First)
- AI Components & Governance
- Performance, Reliability, Observability
- Deployment & Ops (Reference Builds, BoMs, Runbooks)
- WebGL/Babylon.js 3D Previz & Calibration Module
 - Storyflow App (React/Tailwind) — Narrative Flow Builder
- v2 Sensors and v3 Game/XR Modality Capability Model
- Conditional SaaS Exploration (Post‑Success)
- Feasibility, Risks, Partners, Build/Buy/Integrate
- Worked Example: SG Cinema Lobby Pre‑Show
- References & Appendices (Schemas, OSC Maps, Stubs)

---

## Industry Standard Defaults (Project-wide)

- Coding standards: TypeScript strict; ESLint/Prettier enforced; no implicit any; path aliases resolved via TS + Vite.
- Security: env-based secrets; bearer for POST; token gating on `/collab`; no secrets in client builds.
- Testing: Vitest + RTL for units/components; Playwright for E2E; a11y assertions on interactive views.
- Performance: ≥60 FPS target on Storyflow canvas; thresholds in CI perf smoke; debounced expensive ops.
- Accessibility: keyboard-first interactions; ARIA roles; color contrast AA; focus traps in modals.
- CI/CD: lint, typecheck, unit, E2E (preview server), Docker build; artifact retention; semantic-release optional.

---

## 0) Confidence Gate (Final)

- Confidence: ≥97% (locked) based on your confirmation “confirm for all, proceed.”
- Assumptions retained and mitigated:
  - Venue partners TBD; we provide defaults and modular adapters. Mitigation: abstracted device profiles and protocol discovery.
  - CN deployment deferred; architecture is CN‑ready (data/AI/web split), but not launched until green‑lit.

Decision matrix highlights (now locked):

- MVP modality: Phygital only with show‑control hooks (OSC/sACN/Art‑Net, NDI, Dante). Game/XR later.
- Engines: Unreal 5.4+, TouchDesigner, QLab 5, Unity 2022.3 LTS for PWA‑aligned interfaces when needed. (dev.epicgames.com)
- Time sync: PTP v2 primary; LTC chase + NTP discipline fallback. (standards.ieee.org)

---

## 1) Locked Essentials

- A1 Countries (12‑month): HK, JP, SG, CN.
- A2 Data residency/PRC: CN in‑country (data + AI inference + web endpoints); others regional/shared.
- A4 Compliance: SG PDPA; HK PDPO; JP APPI; CN PIPL + CSL + DSL. (pdpc.gov.sg)
- B1 MVP modalities: Phygital only (+ OSC/sACN/Art‑Net).
- B2 Next: v2 Sensors; v3 Game/XR.
- C2 Venue scale: Single room + Multi‑room gallery.
- D1 Engines: Unreal 5.4+, TouchDesigner (2023/2024 LTS), QLab 5, Unity 2022.3 LTS. (dev.epicgames.com)
- D2 OS targets: Windows 11 Pro (show/control), macOS Apple Silicon for QLab, Linux (services).
- D4 XR roadmap: Headset‑less communal (projection rooms/caves); AVP as optional premium.
- E1 Consoles: ETC Eos + MA3. (support.etcconnect.com)
- E2 Media servers: Resolume + PIXERA + disguise. (resolume.com)
- F1 Network: Managed LAN (+ optional air‑gap).
- F2 Time‑sync: PTP primary; LTC/NTP fallback. (standards.ieee.org)
- G1 Narrative schema: Hybrid (Fountain/FDX‑friendly with JSON extensions).
- H1/H2 AI posture: Hybrid; Non‑CN Azure OpenAI (text); CN Alibaba/Tencent; on‑prem fallback (small LLMs).
- I1 Collaboration: locking, comments, review snapshots, read‑only.
- J1 Languages: English + zh‑CN (Simplified) + zh‑HK (Traditional).
- K2 Interchange: USD/USDZ, FBX, glTF/GLB; EXR/ProRes; WAV/BWF; LTC/MTC; OSC; sACN/E1.31; Art‑Net; NDI; Dante. (registry.khronos.org)
- L1 Companion: Staff + Audience web app (QR→web); PWA offline: No (venue LAN required).
- M1 Packaging: Both (Docker/Compose appliance + Windows installer + web PWA).
- N1 KPIs: Confirmed (see §12).

---

## 2) Research: SEA/Asia Current‑State Workflows

End‑to‑end phases across cinema lobbies/pre‑show, pop‑ups, LBE rooms:

- Concept → Narrative/Beats → Spatial Design → Previz → Patch/Network/Timecode → Cueing/Show‑calling → Tech/Rehearsal → Operations → Postmortem.
- Typical toolchain: Unreal/Unity for interactive visuals, TouchDesigner for I/O and signal glue, QLab for theatrical-style cueing, lighting via Eos/MA3, media via Resolume/PIXERA/disguise, LED via Brompton/NovaStar, audio via Dante into venue processors; tracking optional (v2). (dev.epicgames.com)

Authoritative protocol landscape:

- OSC for cross‑app control and beat/cue messaging. (cnmat.berkeley.edu)
- sACN/E1.31 (ANSI) and Art‑Net for lighting data over IP. (webstore.ansi.org)
- NDI for low‑friction IP video routing in previs/display pipelines. (documentation.vizrt.com)
- Dante/AES67 for networked audio transport and show clocks; Dante widely deployed. (audinate.com)

Artifacts and handoffs:

- Narrative: act/scene/beat sheets; interaction intents; access control.
- Technical: cue sheets and trigger logic; CAD/BIM; patch/network sheets; timecode plans; risk/mitigation registers; language packs; accessibility notes.
- Ops: run‑of‑show, standby/GO/hold notation; rehearsal notes; operator crib; postmortem analytics.

---

## 3) Narrative Core and DSL

Ontology: show > acts > scenes > beats > intents > constraints > interactions > cues. Narrative elements are media‑agnostic and map to cue groups with priorities and preconditions.

Validation rules (high‑level):

- IDs globally unique within project; references resolvable.
- Beats must target either devices, roles, zones, or logical intents.
- Constraints: time windows, capacity, safety gates, language variants.
- Cues: deterministic, with trigger type {timecode|state|sensor|manual}, latency budget hint, retry/failover policy, and compensation action.

Example JSON Schema (excerpt)

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "Vixio Narrative",
  "type": "object",
  "required": ["id","title","acts","locales"],
  "properties": {
    "id": {"type":"string"},
    "title": {"type":"string"},
    "locales": {"type":"array","items":{"enum":["en","zh-CN","zh-HK"]}},
    "acts": {
      "type":"array",
      "items": {
        "type":"object",
        "required":["id","scenes"],
        "properties":{
          "id":{"type":"string"},
          "title":{"type":"string"},
          "scenes":{
            "type":"array",
            "items":{
              "type":"object",
              "required":["id","beats"],
              "properties":{
                "id":{"type":"string"},
                "zone":{"type":"string"},
                "beats":{
                  "type":"array",
                  "items":{
                    "type":"object",
                    "required":["id","intent","cues"],
                    "properties":{
                      "id":{"type":"string"},
                      "intent":{"type":"string"},
                      "constraints":{"type":"array","items":{"type":"string"}},
                      "cues":{
                        "type":"array",
                        "items":{
                          "type":"object",
                          "required":["id","trigger","actions"],
                          "properties":{
                            "id":{"type":"string"},
                            "priority":{"type":"integer","minimum":0,"maximum":100},
                            "trigger":{
                              "type":"object",
                              "oneOf":[
                                {"properties":{"type":{"const":"timecode"},"tc":{"type":"string"}},"required":["type","tc"]},
                                {"properties":{"type":{"const":"state"},"when":{"type":"string"}},"required":["type","when"]},
                                {"properties":{"type":{"const":"sensor"},"key":{"type":"string"},"op":{"type":"string"},"value":{}}},
                                {"properties":{"type":{"const":"manual"}},"required":["type"]}
                              ]
                            },
                            "latencyBudgetMs":{"type":"integer","default":20},
                            "actions":{
                              "type":"array",
                              "items":{"type":"object","required":["target","op"],
                                "properties":{
                                  "target":{"type":"string"},
                                  "op":{"type":"string"},
                                  "args":{"type":"object"}
                                }}
                            },
                            "retry":{"type":"integer","default":0},
                            "failover":{"type":"string","enum":["none","alternate","skip"],"default":"none"}
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}
```

YAML example (cinema lobby pre‑show, excerpt)

```yaml
aid: sg-cinema-lobby-001
title: "Aurora Before the Show"
locales: [en, zh-CN, zh-HK]
acts:
- id: act-welcome
  scenes:
  - id: scene-foyer
    zone: lobby
    beats:
    - id: beat-greet
      intent: greet-audience
      constraints: ["doors_open", "pax<=80"]
      cues:
      - id: cue-house-warm
        priority: 50
        trigger: { type: "manual" }
        actions:
        - target: lighting.eos:/universe/1/1-64
          op: "fade"
          args: { level: 0.25, time: 3.0 }
        - target: audio.dante:/bus/bgm
          op: "play"
          args: { track: "ambient_foyer_01.wav", loop: true, level: -18 }
      - id: cue-wall-media
        priority: 60
        trigger: { type: "state", when: "cue-house-warm:done" }
        actions:
        - target: media.pixera:/screen/lobby_led
          op: "play"
          args: { clip: "AuroraLoop_8kx2k.prores", blend: "add" }
```

Interchange formats: USD/USDZ, FBX, glTF/GLB for geometry; EXR/ProRes for video; WAV/BWF for audio; OSC/LTC for control/timecode. glTF is the web‑runtime interchange for the WebGL module. (registry.khronos.org)

---

## 4) MVP Requirements

Functional

- Narrative authoring (Hybrid DSL + Fountain/FDX import), locale variants.
- Cue/Timeline Editor with timecode chase/follow; priorities; groups; chasers.
- Device Abstraction & Venue Config (profiles for Eos, MA3, Resolume, PIXERA, disguise; LED: Brompton/NovaStar; audio: Dante; NDI sources).
- Show‑calling tools: Standby/GO/Hold; “arm + confirm” patterns.
- Rehearsal Notebook; review snapshots; annotations.
- Deterministic playback; simulation with virtual devices and recorded telemetry.
- Redundancy/failover basics (hot‑warm, cue retry and alternate actions).
- Logging/telemetry; post‑show analytics; black‑box recorder.
- WebGL 3D previz/calibration (see §14).

Non‑Functional

- Latency/jitter budgets: OSC P99 ≤10 ms over LAN; lighting frame‑sync jitter ≤5 ms @ 44/88 Hz; audio e2e ≤20 ms; timeline dispatch ≤20 ms.
- Reliability: daily show uptime ≥99.5% with graceful degradation.
- Scalability: up to multi‑room; 2–8 lighting universes/room; 2–6 media outputs/room; 8–32 Dante channels, sensors minimal in v1 (v2 expands).
- RBAC + audit logs; i18n (EN/zh‑CN/zh‑HK); accessibility (dark‑booth, color‑safe).
- Observability: metrics/logs/traces; PTP/NTP status; time‑domain correlation.

---

## 5) Compliance & Safety (SEA/Asia)

- Singapore PDPA: DPO requirement; Do‑Not‑Call; apply to staff/audience data.
- Hong Kong PDPO: DPP principles; 2021 anti‑doxxing amendments.
- Japan APPI: adequacy with EU; follow guidance for webapp telemetry and prompts.
- China PIPL + CSL + DSL: isolate CN data/inference/web when deployed; cross‑border rules.

Venue safety (high‑level): visual + spatial audio in MVP; no hazardous effects in v1.

---

## 6) System Architecture (On‑Prem First; Optional Cloud)

- Narrative Service: JSON storage, schema validation, locale packs.
- Cue/Timeline Engine: deterministic scheduler; timecode chase; priorities; chasers; virtual sim.
- Device Gateway: bridges Narrative/Cue to protocols (OSC, sACN/E1.31, Art‑Net, NDI advisory, Dante control hooks); WebSocket bridge for browsers.
- Real‑Time Sync: PTP grandmaster where possible; LTC reader/generator; NTP discipline for non‑critical.
- AI Orchestrator: pluggable providers; on‑prem fallback; per‑project scopes.

---

## 7) Time Sync and Network Design

Clock domains: PTP v2 primary; LTC chase/follow; NTP for general hosts. Target ≤1 ms alignment for show elements where needed.

Network: Managed LAN with multicast VLANs for sACN/NDI; IGMP Snooping/Querier.

Addressing: sACN universes contiguous per room; Dante isolated or converged VLAN per venue.

---

## 8) Integration Blueprints (Phygital)

- Lighting consoles: ETC Eos, grandMA3.
- Media servers: Resolume, PIXERA, disguise.
- LED processors: Brompton Tessera, NovaStar.
- Engines/hosts: Unreal, Unity, TouchDesigner, QLab.

---

## 9) Cue & Timeline Engine

Deterministic scheduler with priority queues; timecode chase/follow; triggers (state/sensor/manual). Failover policies; simulation with virtual devices + recorded telemetry.

---

## 10) UX & Workflows (Operator‑First)

Surfaces: Narrative Editor; Cue Matrix; Timeline; Venue/Device Mapper; Rehearsal Notebook; Live Ops Dashboard; Storyflow (Miro‑style canvas for beats/cues with lanes, connectors, inspector, mini‑map, publish); 3D Venue Mapper; Spatial Cue Timeline; Calibration Dashboard; Client Previz Presenter.

---

## 11) AI Components & Governance

Human‑in‑the‑loop; provider adapters; project‑scoped data; retention windows; export/delete per project.

---

## 12) Performance, Reliability, Observability

Budgets: OSC P99 ≤10 ms; lighting jitter ≤5 ms; audio e2e ≤20 ms; dispatch ≤20 ms; ≥30 FPS @1080p; interaction ≤50 ms; memory ≤500 MB; payload ≤5 MB.

Testing: soak, chaos; black‑box recorder.

Observability: dashboards for PTP, NTP, LTC, OSC queue depth, sACN/Art‑Net throughput, NDI health, Dante clock.

---

## 13) Deployment & Ops

Reference builds for cinema lobby, portable pop‑up kit, single‑room LBE. Topologies with VLANs per protocol class. Backups and DR.

---

## 14) WebGL/Babylon.js 3D Previz & Calibration Module

Scope: 3D Venue Mapper; Spatial Cue Timeline; Device Calibration Dashboard; Client Previz Presenter.

Runtime: WebGL2 baseline; progressive loading; opportunistic WebGPU. Budgets: ≤2M tris; ≤4×2K textures; ≤500 MB; ≥30 FPS @1080p.

Data: inputs Revit/IFC/Vectorworks/FBX → GLB (web) and USD (DCC/engine). Coordinates: right‑handed, meters, Y‑up (web), adapters to UE Z‑up.

OSC↔3D via Device Gateway: OSC/UDP bridged to WebSocket (WSS) with mTLS + RBAC. Mobile calibration v1 manual alignment; AR markers v2.

---

## 14a) Storyflow App — Narrative Flow Builder (MVP)

Purpose: Author narrative → beats → cues → publish to deterministic timeline for previz/show‑control.

Workflow: Ideation → Story Flow (Miro‑style canvas) → Cues → Publish/Preview. Collaboration optional (Yjs rooms via gateway `/collab`).

Data model:
- `data/gateway/story.json`: `idea`, optional `characters`, `beats`, `cues`, `meta`.
- `data/gateway/timeline.json`: `{ fps, events: [{ t, payload, meta? }] }`.

Cue templates (seed): `lighting.fade`, `osc.send`, `media.play` (stub), `previz.marker.show`, `previz.camera.flyTo`.

Validations: unique ids; resolvable `beatId`; lighting bounds; trigger one‑of; priority 0..100; publish requires `order` or `tHint`. Collisions warn (not fail).

Gateway API: `GET/POST /story`, `POST /story/publish`, `GET /timeline`, `POST /cue/trigger`. Bearer optional for POSTs. `/collab` for Yjs.

Publish rules: `t = timecode|tHint|auto(+3s)`, one event per cue step, priority in meta; idempotent re‑publish.

Performance: canvas ops ≤50 ms; publish ≤250 ms (≤200 cues).

AI: provider chosen at planning; OpenRouter default; optional per‑request model selection.

## 15) v2 Sensors and v3 Game/XR MCM

v2 Sensors: UWB (Pozyx), Optical (Vicon/OptiTrack), BLE, GPIO; events mapped to Narrative constraints.

v3 MCM: capability classes; transforms from Narrative to UE/Unity scenes; device budgets by target.

---

## 16) Conditional SaaS Exploration (Post‑Success)

Multi‑tenant; org/SSO; metered licensing; regional hosting; SLAs. Risks: data residency (CN split), support, pricing.

---

## 17) Feasibility, Risks, Partners, Build/Buy/Integrate

Risks: venue IT variability (multicast, PTP); LED heterogeneity; bilingual UX. Partners: local SIs; vendor channels; AV integrators. Build core; integrate protocol stacks and engines.

---

## 18) Worked Example — SG Cinema Lobby Pre‑Show

Scenario: 20‑min looped lobby activation. Beats: Welcome, Promo Burst. Device map: lighting sACN Univ 1; media PIXERA @ LED 8kx2k; audio Dante 8ch; LED via Brompton/NovaStar. Rehearsal plan: PTP GM, LTC backup, priorities, NDI discovery, Babylon.js previz. Live ops dashboard and kiosk presenter. Post‑show analytics. Round‑trip edits propagate.

---

## 19) References (selected)

- OSC (CNMAT). Accessed 2025‑09‑22.
- ANSI E1.31‑2018 sACN. Accessed 2025‑09‑22.
- Art‑Net overview.
- IEEE 1588‑2019 PTP.
- SMPTE ST 12‑1 Timecode.
- NTPv4 RFC 5905.
- NDI (Vizrt documentation).
- Dante platform overview/history (Audinate).
- Unreal Engine OSC plugin and Live Link docs.
- Unity 2022.3 LTS docs.
- TouchDesigner OSC/Script DAT/CHOP docs.
- QLab 5 Manual and OSC Dictionary.
- glTF 2.0 (Khronos).
- Netgear AV Line M4250.

---

## Appendices

- Latency and Jitter Tables (per path)
- RACI matrix
- Device Profiles
- Telemetry schema
- Runbooks
- Narrative DSL JSON Schema (full)
- QLab OSC quick reference


