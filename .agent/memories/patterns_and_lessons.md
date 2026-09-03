# Patterns and Lessons

## [Success] Protocol Initialization
- **Date:** 2026-02-25
- **Pattern:** Created `AGENTS.md` and initialized `.agent/memories/` to solidify a high-velocity development protocol.
- **Lesson:** Defining "Agents Protocol" principles early reduces friction for future AI-driven tasks.

## [Failure] Placeholder
- **Date:** YYYY-MM-DD
- **Pattern:** Describe what went wrong.
- **Lesson:** Describe the takeaway.
12: 
13: ## [Success] Git Divergence Resolution
14: - **Date:** 2026-03-31
15: - **Pattern:** When facing divergent branches (local and remote), moved local work to a new target branch (`hermes-antigravity-sync`) and rebased local `main` on `origin/main`.
16: - **Lesson:** This "Pivot and Rebase" approach avoids merge commits on `main` while safely publishing the latest changes to the remote for review.


## [Success] Protocol V2 Upgrade (pi-mono integration)
- **Date: 2026-04-27**
- **Pattern:** Integrated **Steering Awareness**, **Iterative Synthesis**, and **Batch Momentum** patterns from the `pi-mono` toolkit into `AGENTS.md` and system prompts.
- **Lesson:** Adopting mature agent-loop primitives (like mid-turn steering and iterative context updates) drastically reduces "Drag" and context drift in long-running coding sessions.

## [Success] Verification Ladder + Owner-as-Adversary (ADR-0001)
- **Date:** 2026-09-03
- **Pattern:** Promoted product-level acceptance practice (independent Owner proof, dogfood/live readback, contract/Ripple fences) into core protocol as V0–V4 ladder. Worker self-tests ≠ V2; Trident ≠ feature acceptance; Ratchet only after applicable stages or human waiver.
- **Lesson:** Docs/SPECs reduce ambiguity but not implementation myopia. Hard independent verification gates beat soft “verify manually where needed.” Bound exploratory agents; keep commercial QA optional.

## [Success] Isolated worktrees + evidence handoffs (ADR-0002)
- **Date:** 2026-09-03
- **Pattern:** Imported ai-agent-teamwork-prompt branch mode: parallel Workers get `.worktrees/<task-id>` + `ag/<task-id>`, context packs, evidence-bearing handoffs; parent/Owner accepts on real tree + ADR-0001. Shared-checkout only for solo/locked rapid swarm.
- **Lesson:** Locks alone do not stop wrong-branch and dirty-tree damage. Worktree isolation + honest handoffs are the missing half of multi-agent Ratchet.
