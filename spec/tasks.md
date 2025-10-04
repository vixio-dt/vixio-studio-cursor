Vixio Studio — Tasks
====================

Stage 1 — Foundation
--------------------
1. Finalize Constitution and budgets.
2. Lock plan and interfaces; create API docs for gateway and engine.
3. Add CI checks: lint, basic build, schema validation.

Stage 2 — Core Playback
-----------------------
4. Engine: implement priority scheduler and state triggers; tests.
5. Gateway: emit playhead and cue state over WS; rate-limit.
6. Operator: show current/next cue, queue; add Standby/GO/Hold shortcuts.
7. Story APIs: /story GET/POST, /story/publish; validation & warnings.

Stage 3 — Story Builder
-----------------------
8. Story canvas: pan/zoom, lanes, connectors, beat inspector, mini-map (web/storyflow).
9. Cue palette and editor (web/storyflow):
   - UI/UX: Right-hand palette with draggable templates into beats; per-beat “Add Cue” CTA.
   - Templates (MVP): `lighting.fade`, `osc.send`, `media.play`, `previz.marker.show`, `previz.camera.flyTo`.
   - Editing: Selection opens inspector form (tabs by category). Field-level validation via Ajv using Narrative DSL + template arg schemas.
   - Validation policy: Inline warnings in form; Save allowed with warnings; Publish blocks fatal schema errors.
   - Priority: Numeric input 0–100 plus slider (default 50).
   - Triggers: `manual | timecode | state`. Timecode masked input; State uses `when` string (`cue-id:done|fail`).
   - DSL sync: Immediate apply with undo/redo and dirty flag. Save → POST /story. Publish → compile timeline.
   - Tests: Unit (validation, node↔DSL mapping). E2E (drag template → error → fix → save/publish).
10. Publish summary: render warnings, compile timeline, reload previz; idempotent re-publish.
11. Collaboration (optional): Yjs room wiring via gateway `/collab` with bearer gating.

Stage 4 — Device I/O
--------------------
12. sACN: configurable universes; multicast option; basic merge rules.
13. OSC: configurable targets and mappings; error surfacing.
14. Logging: black-box recorder; export per show.

Stage 4 — Previz & Calibration
------------------------------
15. 3D calibration panel: device locators, numeric entry, snap helpers.
16. Timeline: groups, priorities, cue templates; import/export.
17. Presenter: cue overlays and simple transport mirroring.

Stage 5 — Ops & Compliance
--------------------------
18. RBAC and audit logs; bearer → roles; region profiles.
19. Health/metrics dashboard: WS, OSC, sACN, PTP/LTC placeholders.
20. Packaging: Windows operator app, Compose appliance docs.

