# ADR-0004: Adaptive model escalation

## Status

Accepted

## Context

Agents Protocol already uses Pulse to stop repeated correction cycles and Ripple to map structural blast radius. In mature projects and parallel build streams, applying the same high-reasoning model to every iteration wastes cost, while repeatedly retrying a low-cost model can spend more time and tokens than a single deeper diagnosis.

Model names and provider pricing change. The protocol therefore needs a provider-neutral policy that chooses reasoning depth from task evidence rather than hard-coding particular vendors or model families.

## Decision drivers

* Keep routine, well-specified work fast and inexpensive.
* Escalate before repeated local retries become a doom loop.
* Distinguish implementation failures from environmental or flaky failures.
* Preserve the existing Pulse stop/replan boundary.
* Keep model escalation separate from Owner-as-Adversary acceptance.
* Make escalations reproducible through evidence-bearing handoffs.

## Considered options

### Option 1: Use the strongest model for every task

* Pros: Simple routing; fewer model-selection decisions.
* Cons: Unnecessarily expensive; does not prevent bad verification or poor failure diagnosis.

### Option 2: Use the cheapest model for every task

* Pros: Low per-call cost.
* Cons: Repeated retries and weak cross-module reasoning can increase total cost and delay acceptance.

### Option 3: Evidence-based adaptive escalation (chosen)

* Pros: Preserves baseline velocity, targets expensive reasoning at structural friction, and fits Pulse/Ripple/Owner.
* Cons: Adds a small amount of classification and handoff discipline; capability and pricing remain provider-specific.

## Decision

Use the least expensive model that is adequate for the task. Routine, well-specified, single-file work stays at the baseline tier.

Before retrying a failure, classify it:

* Environmental, dependency, fixture, or flaky failure: diagnose the environment first; do not escalate merely because a test failed.
* Local implementation failure: make one focused repair attempt.
* Contract, schema, event, public API, or cross-module failure: treat as an escalation candidate.

Escalate one reasoning tier after two materially unsuccessful repair attempts, or earlier when Ripple identifies a broad blast radius, a public boundary, weakly documented legacy code, or unexplained contract drift.

The escalation handoff must include:

* task and acceptance criteria;
* current diff and changed paths;
* exact failing command and output;
* dependency or blast-radius map;
* attempts already made and why they failed;
* applicable verification stage and remaining budget.

The escalated model receives evidence, not an unexplained transcript dump. It gets one bounded diagnostic or repair pass. If that pass fails, Pulse applies: preserve evidence, revert only the agent's unverified changes where safe, and re-plan.

Escalation does not replace V2 Owner-as-Adversary or V3 live evidence. A stronger implementation model may improve a change, but it cannot independently prove its acceptance.

## Consequences

### Positive

* High-reasoning capacity is reserved for structural uncertainty and stagnation.
* Repeated low-value retries become an explicit escalation signal.
* Model routing remains portable across providers, local models, and future model families.
* Handoffs contain enough evidence for an Owner or parent session to verify the decision.

### Negative / costs

* Agents must classify failures instead of blindly retrying.
* A provider or harness must expose a way to select a different model or reasoning tier.
* “Adequate” and “materially unsuccessful” require judgment; the policy is a guardrail, not a universal numeric optimizer.

## Guardrails

* Do not use directory count as a hard complexity proxy; dependency boundaries and contract impact are stronger signals.
* Do not escalate raw failure counts without checking for infrastructure or flaky-test causes.
* Do not let escalation bypass verification, commit hygiene, worktree isolation, or human approval for irreversible actions.
* Record escalation reason and outcome in the evidence-bearing handoff when one is used.

## Related

* [ADR-0001](0001-verification-ladder-and-owner-adversary.md)
* [ADR-0002](0002-isolated-worktrees-and-evidence-handoffs.md)
* `AGENTS.md` — Adaptive model escalation
* `system-prompt.md` and `system-prompt2.md`
