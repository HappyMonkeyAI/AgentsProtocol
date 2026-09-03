# Agents Protocol

A high-velocity development framework for AI agents.

## 🚀 Overview

The Agents Protocol defines a robust set of instructions and architectural patterns designed to minimize "Drag" (ambiguity, technical debt, manual verification) and maximize development momentum. It enables AI agents to operate with surgical precision, leveraging long-term memory and autonomous verification.

## 🧠 Core Identity: The Agents Protocol Engineer

Agents operating under this protocol act as **autonomous Staff Software Engineers**. The primary directive is to deliver robust, well-documented solutions with surgical precision and eliminate drag (ambiguity, technical debt, poor documentation, manual verification).

## 🛠 Trinity Orchestration (Self-Evolution)

The system utilizes four specialized analytical lenses to optimize project velocity:

- **[Echo] Structural Memory:** Detects patterns and extracts lessons to `.agent/memories/patterns_and_lessons.md`.
- **[Ripple] Relational Patterns:** Analyzes the "blast radius" of changes across dependencies (DB -> API -> Frontend).
- **[Pulse] Velocity Monitor:** Halts failing paths, resets state, and pivots to lower-gravity approaches if momentum stalls.
- **[Sanity] Grounding Check:** Ensures every action is grounded in `README.md` and `AGENTS.md` before execution.

## 🛡 Risk Mitigation & Pre-Mortem

The Agents Protocol incorporates a mandatory **Pre-Flight Pre-Mortem** for all major changes. This forces the agent to assume failure and work backward to identify blind spots, hidden assumptions, and tripwires before a single line of code is written.

## 📂 Project Structure

- `AGENTS.md`: The core development protocol and agent rules.
- `CONTEXT.md`: Stack, rules, architecture decisions, what not to do.
- `MCP.md`: Intent → MCP server routing (ADR-0003); optional gitignored `MCP.local.md`.
- `docs/adr/`: Architecture Decision Records (e.g. Verification Ladder, worktrees, MCP map).
- `research/`: External references and cherry-pick/avoid notes.
- `BOOTSTRAP.md`: Spine install, **MCP discovery**, and LTM bootstrap for target projects.
- `system-prompt.md`: The unified master prompt for agent configuration.
- `skills/owner-adversary-verification/`: Operational checklist for pre-Done proof.
- `skills/isolated-worktree-handoff/`: Parallel-safe worktrees, context packs, evidence handoffs (ADR-0002).
- `skills/mcp-intent-routing/`: MCP routing and discovery checklist (ADR-0003).
- `.agent/memories/`: Persistent storage for codebase insights, architectural decisions, and lessons learned.

## 📝 Long-Term Memory (LTM)

Inspired by Langchain Deep Agents, our memory is split between ephemeral context and persistent knowledge:
- **`codebase_insights/`**: High-level summaries of complex modules.
- **`architectural_decisions/`**: Logs of major design choices and tradeoffs.
- **`patterns_and_lessons.md`**: Success logs and post-mortems.

## 🚦 Usage

1. **Initialize:** Use the content from `system-prompt.md` in your agent's system instructions.
2. **Bootstrap:** Run `BOOTSTRAP.md` — spine files, **MCP discovery** (`MCP.md` / `MCP.local.md`), then LTM population.
3. **Automate:** Agents run the **Verification Ladder** (ADR-0001): deterministic checks, contract/Ripple, Owner-as-Adversary tests, bounded live/exploratory proof, then fix-loop. Ratchet (commit) only after applicable stages pass — Worker self-report is never Done proof. Route tools via **MCP.md** (ADR-0003).

## 🌐 Global Registration & Findings

To apply the Agents Protocol globally ask your AI agent to use the provided BOOTSTRAP.md to setup the defined infrastructure.

### What We Verified

- **The Ratchet** – after a successful test run, the agent automatically performed `git add` and `git commit` without prompting.
- **Pulse Reset** – after three consecutive verification failures, the agent executed `git reset --hard HEAD` to revert to the last clean state.
- Both behaviors were demonstrated in the `tests/protocol_verification/` stress‑test suite.
- **Verification Ladder (ADR-0001)** – Owner-as-Adversary + V0–V4 gates are protocol law in `AGENTS.md` / system prompts; operationalized by `skills/owner-adversary-verification`.
- **Isolated worktrees (ADR-0002)** – Parallel default: `.worktrees/<task-id>` + `ag/<task-id>`; evidence handoffs; parent owns acceptance — aligned with [ai-agent-teamwork-prompt](https://github.com/HappyMonkeyAI/ai-agent-teamwork-prompt).
- **MCP intent map (ADR-0003)** – `MCP.md` + bootstrap discovery; dynamic_proxy activate; AuditScan / article-research / sentinel / launcher as first-class intents.

Now every new AI session will enforce these actions and rules, ensuring momentum is never lost.

## 🌟 Credits & Prior Art

The Agents Protocol is built upon the collective intelligence of the AI engineering community. We owe our high-velocity patterns to the following pioneers:

- **[IJFW (It Just F*cking Works)](https://github.com/TheRealSeanDonahoe/ijfw)**: Created by [Sean Donahoe](https://github.com/TheRealSeanDonahoe). We integrated the **Donahoe Loop** (Quick/Deep workflows), **Output Discipline**, and the **Trident Audit** architecture to reduce token burn and eliminate conversational friction.
- **[OctaMem](https://octamem.com)**: For the persistent intelligence model that powers our Semantic, Episodic, and Procedural memory architecture.
- **[uSwarm](https://github.com/SPhillips1337/uSwarm)**: For the **Architect/Manager/Worker/Owner** assembly line orchestration model and Identity Lock mechanisms.
- **[ai-agent-teamwork-prompt](https://github.com/HappyMonkeyAI/ai-agent-teamwork-prompt)**: For **isolated worktrees**, branch mode, context packs, and evidence-bearing handoffs (ADR-0002).
- **[LLM-Codex-Reference-Vault](https://github.com/SPhillips1337/LLM-Codex-Reference-Vault)**: For the Neo4j-backed semantic context layer that provides ground-truth patterns for cross-language development.
- **[Langchain Deep Agents](https://github.com/langchain-ai/langchain)**: For foundational concepts in context-enrichment and autonomous planning.
- **[40MCP](https://github.com/SPhillips1337/40mcp)**: For proxy-based tool discovery and dynamic MCP server orchestration.
- **[Claude Code](https://github.com/anthropics/claude-code)**: For inspiring high-velocity interaction patterns and the "Ratchet" momentum system.

## 🛠 Modern Standards & Planning

The Agents Protocol enforces a "Think Before You Act" philosophy:
- **Comprehensive Planning:** Every task begins with a checklist covering technical, architectural, and dependency implications.
- **Up-to-Date Baseline:** Solutions are implemented using industry best practices current as of the session date.
- **Zero-Stale Patterns:** Agents are prohibited from using deprecated libraries or outdated implementation patterns.

---

*Minimize friction. Maximize momentum.*
