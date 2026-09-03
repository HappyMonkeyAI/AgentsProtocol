# Research: Agentic feature brute-verification

**Date:** 2026-09-03  
**Trigger:** Gap analysis — mature projects still ship agent-built features with missing/broken peripheral behavior despite docs, ADRs, SPECs.  
**Decision:** Fold into protocol as ADR-0001 (Verification Ladder + Owner-as-Adversary). Local stacks first.

## Problem class

Implementation myopia + self-verification: Worker implements happy path, tests mirror that path, Ratchet on green. Humans become exploratory QA.

## External patterns (summary)

| Pattern | Examples (illustrative) | Role in ladder |
|---------|-------------------------|----------------|
| Black-box exploratory UI agents | Skyvern, Midscene.js, Playwright + MCP, BrowserOS Neo | V3 tooling |
| Commercial AI QA | QA Wolf, Autify, Testim-class | Optional product choice; **not** protocol default |
| Adversarial / red-team test gen | Secondary agent from SPEC only | V2 Owner |
| LLM output eval | DeepEval, Ragas | Only LLM-quality slices |
| Contract fences | OpenAPI contract tests, tRPC, Pydantic/Zod at boundaries | V1 Ripple exit |

## Cherry-pick (protocol default)

* Independent Owner adversary from SPEC/ADR (V2)
* Live dogfood with console + state readback (V3)
* Contract/schema parity on blast radius (V1)
* Failures feed Worker before Done (V4)
* Bounded step/time budget on exploratory agents
* Evidence layers reported separately

## Avoid / defer as protocol defaults

* Mandatory commercial QA SaaS
* Unbounded autonomous crawling as “done”
* Treating Worker unit tests as Owner proof
* DeepEval/Ragas for ordinary CRUD/UI features
* Replacing small vertical slices with giant features + heavier QA

## Fit to Agents Protocol

Already had pieces (browser autonomy, Trident, Owner, dogfood/live skills). Missing: hard gate + Owner ≠ Worker + ladder with skip rules. See ADR-0001.

## When revisiting

Re-evaluate commercial AI QA only if local V3 cost/flake dominates on a specific product line; keep protocol core vendor-neutral.
