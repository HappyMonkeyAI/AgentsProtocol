# ADR-0001: Verification Ladder and Owner-as-Adversary

## Status

Accepted

## Context

Agents Protocol already reduces ambiguity with CONTEXT.md, ADRs, SPECs, sub-context, Ripple, Pulse, Trident, and Ratchet. Mature projects still hit a recurring failure mode: after a large agent-driven feature, humans discover missing surfaces, silent UI/API wiring failures, empty-state gaps, and broken edge paths — even when unit tests are green.

Root cause is **implementation myopia** plus **self-verification**: the coding Worker builds the happy path it inferred, writes tests that mirror that path, and marks Done. Docs and ADRs constrain intent; they do not independently prove presence and behavior.

External practice (agentic exploratory browser agents, adversarial test generation, contract/schema fences) maps cleanly onto existing protocol roles (Owner, dogfood/live acceptance skills, Ripple) but was not hard-gated in AGENTS.md or system prompts. Soft language (“verify tests + manual where needed”) reintroduced the drag the prime directive bans.

## Decision Drivers

* Stop human exploratory QA as the default backstop after agent feature work
* Keep momentum: small vertical slices + Ratchet on real evidence, not infinite chaos testing
* Worker self-report must never count as Done proof
* Reuse local stacks (Playwright/BrowserOS/dogfood, package tests, OpenAPI/Pydantic/tRPC) over mandatory commercial QA SaaS
* Pulse still caps thrash (>3 corrections → stop/revert/replan)
* Trident (logic/security) remains complementary, not a substitute for feature acceptance

## Considered Options

### Option 1: Soft guidance only (“be more thorough”)
- **Pros**: No process change
- **Cons**: Already failed in practice; self-verification bias remains

### Option 2: Mandatory commercial AI QA platforms
- **Pros**: Strong exploratory coverage
- **Cons**: External dependency, cost, poor fit as protocol default; overkill for libraries and non-UI slices

### Option 3: Verification Ladder + Owner-as-Adversary (chosen)
- **Pros**: Layered evidence; risk-scaled; fits uSwarm Owner; promotes existing product skills into core law
- **Cons**: Slightly more ceremony on non-trivial slices; needs clear skip rules

## Decision

Adopt a **Verification Ladder (V0–V4)** as the only path to Ratchet/Done for non-trivial work, with **Owner-as-Adversary** owning independent white-box and (when applicable) black-box proof.

### Ladder

| Stage | Name | Who | What | Skip when |
|-------|------|-----|------|-----------|
| **V0** | Deterministic | Worker or CI | Touched-package tests, typecheck, build | Never for code changes |
| **V1** | Contract / Ripple | Worker + brief Owner check | Blast-radius map; schema/API/UI field parity; shared types or OpenAPI/RPC contracts hold | Pure docs/chore with no boundary touch |
| **V2** | Adversary tests | **Owner** (not the Worker monologue) | From SPEC/ADR/acceptance only: aggressive unit/integration/E2E that try to prove absence, invalid input, empty/error states, auth gaps, partial wiring. Worker self-tests do **not** satisfy V2 | Trivial one-liner with no behavior surface |
| **V3** | Live / exploratory | Owner or dedicated dogfood pass | Against **actual** target URL/deploy: primary path + one destructive path + empty/error path; console after interactions; **state readback** (DOM/API), not “click ok” | No UI and no deployable runtime surface |
| **V4** | Close the loop | Orchestrator | Failures → mandatory fix tickets to Worker; re-run failed stages; only then Ratchet | — |

### Done means

Every named acceptance criterion has **independent** evidence. Evidence layers are reported separately (`unit | integration | e2e | live`). A Worker summary, green self-tests alone, or “Trident passed” is insufficient for feature Done.

### Owner-as-Adversary

In uSwarm terms, Owner is not only merge auditor. Before merge/Ratchet on a feature slice, Owner (separate agent or parent session with adversary brief):

1. Reads SPEC + ADR + acceptance criteria as ground truth (not the Worker’s build narrative).
2. Attempts to break or disprove the slice (V2, and V3 when applicable).
3. Publishes a short evidence artifact (e.g. `verification/OWNER.md` or task verification section) listing criteria → pass/fail → how proved.
4. Refuses Done until applicable stages are green or residual gaps are explicitly accepted by the human.

### Bounded exploration

Autonomous browser/exploratory agents (BrowserOS, Playwright-MCP, Midscene-class tools) are allowed at V3 with a **time/step budget** and a SPEC-derived checklist. Unbounded “wander until bored” is out of protocol (fights Pulse and cost).

### Out of scope as defaults

* Mandatory QA Wolf / Autify / commercial AI QA
* DeepEval/Ragas unless the slice is LLM-output quality
* Replacing docs-first and small slices (prevention remains primary)

## Consequences

### Positive

* Missing aspects and dead wiring are caught before Ratchet
* Aligns core protocol with existing product skills (verified vertical slice, dogfood, live acceptance)
* Clear skip rules preserve velocity on trivial work
* Contract fences turn boundary drift into fail-fast build/test failures

### Negative / costs

* Non-trivial slices need an Owner pass (extra agent turn or parent checklist)
* Live V3 can flake; mitigate with budgets, fixtures, and separate evidence layers
* Teams must not collapse Owner back into Worker self-signoff

### Follow-ups

* AGENTS.md Standard Loop and system prompts cite this ADR
* Skill `owner-adversary-verification` operationalizes the checklist
* Research note records external tool cherry-pick/avoid
* Optional: protocol stress that Ratchet without Owner evidence is invalid for feature claims

## Related

* AGENTS.md — Standard Loop step 5; uSwarm Owner
* skills/owner-adversary-verification
* skills/tdd-orchestrator (Worker TDD ≠ Owner V2)
* research/2026-09-03-agentic-feature-brute-verification.md
