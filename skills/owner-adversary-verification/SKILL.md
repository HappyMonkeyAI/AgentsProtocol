---
name: owner-adversary-verification
description: Use when closing a feature slice before Done/Ratchet. Run Owner-as-Adversary Verification Ladder V0–V4; refuse self-verified Done.
---

# Owner-as-Adversary Verification

Operationalizes [ADR-0001](../../docs/adr/0001-verification-ladder-and-owner-adversary.md). Use before marking a **feature or behavior-changing** slice Done, merging Worker output, or Ratcheting.

## Do not use when

- Pure docs, comments, or chore with no runtime behavior
- Human explicitly accepted residual gaps in writing
- Emergency hotfix where human waives V2/V3 (record waiver in verification artifact)

## Ground truth

| Use as truth | Do not treat as proof of Done |
|--------------|-------------------------------|
| SPEC, ADR, acceptance criteria, CONTEXT | Worker “what I built” summary |
| Live URL / real API responses / DOM readback | “Tests passed” with no Owner review |
| Independent Owner tests | Worker-authored tests alone (they are V0 support, not V2) |

**Rule:** Worker self-report is never Done proof.

## Ladder (run applicable stages)

### V0 — Deterministic (always for code)

```text
- [ ] Touched packages: test / typecheck / build green
- [ ] Failures fixed or Pulse stop — do not Ratchet red
```

### V1 — Contract / Ripple (any boundary touch)

```text
- [ ] Blast-radius map: callers, API types, UI fields, DB/schema
- [ ] Shared contract holds (OpenAPI / RPC / Zod / Pydantic / types)
- [ ] No silent optional field drift across UI ↔ API ↔ DB
```

### V2 — Adversary tests (Owner only)

Spawn Owner (or parent session) with brief:

> Review SPEC and ADR only. Write/run the most aggressive tests you can to disprove acceptance criteria: missing UI, dead clicks, empty states, invalid input, auth gaps, partial wiring. Do not trust the Worker narrative. Stop when criteria are evidenced or failures are listed.

```text
- [ ] Owner ≠ Worker monologue
- [ ] Tests derived from acceptance criteria, not from implementation story
- [ ] At least one negative/empty/invalid path per critical criterion
- [ ] Worker self-tests not counted as satisfying V2
```

### V3 — Live / exploratory (UI or deployable runtime)

Against the **actual** target (local feature URL or exact deploy — not a proxy claim):

```text
- [ ] Primary happy path exercised
- [ ] One destructive / invalid path
- [ ] Empty or error state checked
- [ ] Console checked after interactions
- [ ] State readback (DOM text, network payload, API GET) — not click-only
- [ ] Step/time budget set; no unbounded wander
```

Prefer project dogfood / BrowserOS / Playwright skills when present. Skip V3 only when there is no UI and no runtime surface.

### V4 — Close the loop

```text
- [ ] Failures filed as mandatory fix tickets to Worker
- [ ] Failed stages re-run after fixes
- [ ] Pulse: >3 correction cycles → stop, revert/replan
- [ ] Only then Ratchet (conventional commit)
```

## Evidence artifact

Write short proof before Done (path examples: `verification/OWNER.md`, task `verification` section, or PR body):

```markdown
# Owner verification — <slice id>
Criteria:
- [ ] <criterion> — V0/V1/V2/V3 — evidence: <command, URL, readback>
Residual gaps (none | list):
Waiver (none | human ack):
```

Report layers separately: `unit | integration | e2e | live`.

## Relationship to other protocol pieces

| Piece | Role |
|-------|------|
| tdd-orchestrator | Worker writes tests first — necessary, not Owner V2 |
| Trident | Logic/security audit — parallel, not feature acceptance |
| dogfood / live-deployment-verification | V3 implementations |
| verified-vertical-slice-delivery | Product-level parent re-verify — same philosophy |
| Pulse | Caps thrash on V4 fix loops |
| Ratchet | Only after applicable V0–V4 green or explicit human waiver |

## Anti-patterns

- Owner rubber-stamps Worker tests
- “Browser opened” without readback
- Marking Done on Trident alone
- Expanding scope mid-V3 instead of filing gaps
- Skipping V1 when API and UI both changed
