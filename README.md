# Agents Protocol

A high-velocity development framework for autonomous AI agents within the Google Antigravity IDE.

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
- `BOOTSTRAP.md`: Instructions for initializing the Long-Term Memory (LTM) system.
- `system-prompt.md`: The unified master prompt for agent configuration.
- `.agent/memories/`: Persistent storage for codebase insights, architectural decisions, and lessons learned.

## 📝 Long-Term Memory (LTM)

Inspired by Langchain Deep Agents, our memory is split between ephemeral context and persistent knowledge:
- **`codebase_insights/`**: High-level summaries of complex modules.
- **`architectural_decisions/`**: Logs of major design choices and tradeoffs.
- **`patterns_and_lessons.md`**: Success logs and post-mortems.

## 🚦 Usage

1. **Initialize:** Use the content from `system-prompt.md` in your agent's system instructions.
2. **Bootstrap:** Run the `BOOTSTRAP.md` workflow to populate the initial `.agent/memories/` directory from project history.
3. **Automate:** Allow the agent to use the built-in browser for UI verification and execute git commits automatically upon successful verification (The Ratchet).

## 🌐 Global Registration & Findings

To apply the Agents Protocol globally:

1. **Copy** `system-prompt.md` (or your custom prompt) into `~/.deepagents/agent/agent.md`.
2. **Append** the content to the end of the file – this merges the protocol with the core agent instructions.
3. **Restart** the Antigravity IDE or reload the agent to pick up the changes.

### What We Verified

- **The Ratchet** – after a successful test run, the agent automatically performed `git add` and `git commit` without prompting.
- **Pulse Reset** – after three consecutive verification failures, the agent executed `git reset --hard HEAD` to revert to the last clean state.
- Both behaviors were demonstrated in the `tests/protocol_verification/` stress‑test suite.

Now every new Antigravity session will enforce these autonomous Git actions, ensuring momentum is never lost.

## 🌟 Credits & Prior Art

The Agents Protocol is built upon the collective intelligence of the AI engineering community. We owe our high-velocity patterns to the following pioneers:

- **[IJFW (It Just F*cking Works)](https://github.com/TheRealSeanDonahoe/ijfw)**: Created by [Sean Donahoe](https://github.com/TheRealSeanDonahoe). We integrated the **Donahoe Loop** (Quick/Deep workflows), **Output Discipline**, and the **Trident Audit** architecture to reduce token burn and eliminate conversational friction.
- **[OctaMem](https://octamem.com)**: For the persistent intelligence model that powers our Semantic, Episodic, and Procedural memory architecture.
- **[uSwarm](https://github.com/SPhillips1337/uSwarm)**: For the **Architect/Manager/Worker/Owner** assembly line orchestration model and Identity Lock mechanisms.
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
