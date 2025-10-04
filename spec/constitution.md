Vixio Studio — Project Constitution
===================================

Guiding Principles
------------------

1. Narrative-first: Specs are the source of truth; code maps to cues and beats.
2. Determinism: Playback is predictable; triggers and priorities are explicit.
3. Operator-first UX: Dark-booth friendly, bilingual-ready, low-latency.
4. Safety and compliance: Region-specific data rules; least-privilege access.
5. Observability: Time-correlated logs/metrics; black-box recorder by default.
6. Interop: Standards-based (OSC, sACN/E1.31, Art-Net, NDI, Dante, LTC/PTP).
7. Offline-first on venue LAN; cloud is optional assist and region-aware.
8. Performance budgets are enforced in CI and rehearsals.

Engineering Tenets
------------------

- API contracts: versioned, JSON; no breaking changes without migration notes.
- Error handling: fail fast on invalid cues; graceful degradation at runtime.
- Auth: minimal bearer now; expand to RBAC later; secrets not committed.
- Testing: unit for schemas and cue planner; soak for cue/timeline loops.
 - Testing: unit for schemas and cue planner; E2E for Storyflow UI; soak for cue/timeline loops.
- Accessibility: keyboard-first flows; color-safe; adjustable contrast.

Industry Standard Defaults (Project-wide)
----------------------------------------

- Source control: trunk-based with short-lived branches; conventional commits; required reviews.
- Code style: Prettier + ESLint/TypeScript strict; no disabled rules without justification.
- Security: .env for secrets; minimum bearer; dependency audit in CI; no PII in logs.
- Testing: unit (≥70% critical modules), component, E2E (key user paths), a11y checks; deterministic seeds.
- Performance: budgets codified; CI perf smoke; bundle analysis; lazy-load heavy views.
- Accessibility: ARIA roles, keyboard navigation, color-contrast ≥ WCAG AA; focus outlines preserved.
- Observability: structured logs, error boundaries; user-action breadcrumbs in Storyflow.
- Release: semantic versioning; changelog; Docker images pinned; reproducible builds.

Review & Change Control
-----------------------

- Changes derive from spec diffs; reviewers check narrative impact and budgets.
- Operator flows require demo scripts and rollback steps.
- Region compliance reviewed for data-related features.
 - Storyflow UI changes require E2E updates and accessibility checks.

