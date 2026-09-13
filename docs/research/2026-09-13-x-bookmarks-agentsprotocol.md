# X bookmark research: AgentsProtocol and harness design

Date: 2026-09-13
Status: Research only; no runtime implementation

## Method

Scanned 200 authenticated X bookmarks from the operator's LAN bookmark export on `192.168.5.215`, using the `twitter` CLI and the server-side `twitter2` credential file. Credentials were not read into the project or report. A broad keyword filter produced 54 candidate matches; the strongest 40 were manually reviewed. Bookmark text was treated as a lead, not as verified product documentation.

Primary sources were checked for the shortlisted leads:

- Harness-of-Harness: https://arxiv.org/html/2609.01481
- DeepSeek Harness: https://github.com/deepseek-ai/deepseek-harness
- Matt Pocock implement skill: https://github.com/mattpocock/skills/blob/main/skills/engineering/implement/SKILL.md
- CLI-Anything: https://github.com/HKUDS/CLI-Anything
- OpenSandbox: https://github.com/alibaba/OpenSandbox

## Shortlist

| Tier | Lead | What is worth considering | Protocol disposition |
|------|------|---------------------------|----------------------|
| M1 validation | Harness-of-Harness | Iterative planning/coding/testing; small verifiable increments; implementation-time tests separated from independent evaluation; versioned project histories; repair balanced against capability growth | Existing Verification Ladder and Pulse already cover much of this. Consider an explicit repair-vs-growth loop rule and iteration evidence later. |
| M1 design input | CLI-Anything | Structured, deterministic, machine-readable interfaces are often more reliable for agents than pixel-level UI automation | Consider a protocol rule: prefer a reliable CLI/API/MCP interface over GUI automation when both expose the needed operation. |
| M1 design input | Matt Pocock `implement` skill | Spec/ticket intake, TDD seams, frequent focused checks, full-suite verification, then independent review | Confirms the current Worker → Owner flow; do not import the skill wholesale. |
| Later architecture | DeepSeek Harness | Everything-is-a-plugin boundary for models, tools, skills, sessions, sandboxes, loops, and UI | Useful prior art for keeping Hermes integrations replaceable. Do not couple AgentsProtocol to its runtime. |
| Later security profile | OpenSandbox | Sandboxed execution, network policy, credential injection, and stronger isolation runtimes | Track for untrusted-code or browser-agent profiles. Too heavy for the protocol default. |

## Candidate follow-ups

### 1. Repair versus capability growth

A long-running harness should label each iteration as either:

- repair: restore a failing acceptance criterion or remove a regression;
- capability growth: implement a new accepted slice;
- evaluation: independently test whether the project still meets its criteria.

After repeated repair-only iterations, the orchestrator should require a fresh diagnosis or re-plan rather than continuing local patches. This extends Pulse without weakening the existing stop/replan boundary.

### 2. Deterministic interface preference

When a target exposes a reliable structured interface, prefer it for agent operations and reserve browser/desktop automation for capabilities that genuinely require the visual surface. Structured interfaces should provide explicit inputs, machine-readable outputs, observable state, and bounded failure behavior.

This is a design guideline, not a ban on V3 browser acceptance: UI behavior still requires live UI verification when UI behavior is the acceptance criterion.

### 3. Plugin boundaries

Use replaceable adapters for model providers, tools, skills, sessions, sandboxes, and orchestration integrations. Keep the protocol's acceptance rules and safety boundaries independent of any particular harness implementation.

## Exclusions

- Model and pricing claims in individual bookmarks were not treated as evidence for protocol changes.
- OpenSandbox is not a default dependency or mandatory runtime.
- DeepSeek Harness is not being adopted as a replacement for Hermes.
- A keyword hit alone is not a recommendation.

## Recommendation

No immediate code change is required. The current adaptive model escalation policy can be pushed as-is. The deterministic-interface and repair-vs-growth ideas are suitable for a future small ADR or protocol refinement after a concrete use case demonstrates the gap.
