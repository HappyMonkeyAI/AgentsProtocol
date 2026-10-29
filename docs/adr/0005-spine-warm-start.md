# ADR-0005: Spine warm-start (brief, checkpoint, audit)

## Status

Accepted

## Context

Agents Protocol requires Sanity grounding (README / CONTEXT / AGENTS / MCP.md) and post-task memory hygiene (LTM + occasional Truth Audit). Full-file reads of CONTEXT/PROGRESS burn tokens and drift across hosts. Parallel agents also append the same narrative to `PROGRESS.md`, which collides and goes stale.

[Spine](https://github.com/HappyMonkeyAI/spine-mcp) is a files-as-truth query layer over the existing documentation spine: `session_brief`, `get_section`, `recall`, `checkpoint`, `record_memory`, `audit`, `distill`, plus CLI hooks (`spine brief`, including `--cursor-hook` for Cursor `sessionStart`). It does **not** own shared behavior law — that stays in this protocol’s `AGENTS.md` / ADRs.

Wave-1 pilots already inject briefs via Cursor hooks and keep a thin AGENTS Spine block. The protocol needs a durable decision so bootstrap and target projects stop inventing per-repo wording.

## Decision drivers

* Warm-start without dumping whole CONTEXT/PROGRESS into every session
* AgentsProtocol owns shared law; projects keep thin stubs + hooks
* Work when MCP is listed but not mounted (CLI fallback)
* Replace ad-hoc PROGRESS appends with structured checkpoints
* No secrets in git; no Spine writes outside `.agent/memories` / `.agent/spine`

## Considered options

### Option 1: Centralize all AGENTS.md via Spine injection
- **Pros**: One edit site
- **Cons**: Harnesses differ; Agents Window may drop `sessionStart` context; law belongs in git-reviewed protocol docs

### Option 2: Keep full-file Sanity forever
- **Pros**: No new tooling
- **Cons**: Token waste; inconsistent grounding; PROGRESS collisions

### Option 3: Spine brief + thin stubs + protocol ADR (chosen)
- **Pros**: Cheap warm-start; CLI/MCP share one path; law stays in AgentsProtocol
- **Cons**: Hosts must install Spine / registry; hooks are Cursor-specific (other agents use MCP + AGENTS line)

## Decision

1. When the `spine` MCP (or `spine` CLI) is available, **`session_brief` satisfies Sanity grounding**. Prefer `get_section` / `recall` over reading CONTEXT.md or PROGRESS.md whole. If Spine is missing, ground from the docs normally — never block the session on Spine.
2. Before stopping meaningful work, call **`checkpoint`** (agent id + done / next / blockers). Persist durable why/gotcha/decision facts with **`record_memory`**. Do not treat free-form PROGRESS.md appends as the primary handoff when Spine is available (`PROGRESS.md` may remain a human journal; optional render-from-history is out of band).
3. Periodic Truth Audit (~every 10 major tasks) becomes **`audit` + `distill`** when Spine is available.
4. Bootstrap (and Cursor-using target projects) install a **`sessionStart` hook** running `spine --project . brief --cursor-hook` (see `templates/cursor-hooks.json.example`). Keep a short AGENTS “Session start and end (Spine)” block; do not paste the full protocol into every repo via injection.
5. Resolve projects by absolute path or launcher-registry / `SPINE_REGISTRY` name. Route the intent via **`MCP.md`** (server name `spine`).
6. Spine never commits, never edits source or protocol law files, and never writes task boards.

## Consequences

### Positive

* Faster, cited warm-starts across protocol-adopting repos
* Consistent session end state without PROGRESS merge fights
* Clear split: AgentsProtocol = law; Spine = query/cache over project files

### Costs

* Operators must install Spine on PATH / MCP and maintain `~/.spine/registry.json` (or `SPINE_REGISTRY`) for named projects
* Cursor Agents Window may still omit hook-injected context — MCP `session_brief` remains the reliable path
* Brief quality tracks project doc hygiene (files remain truth)

## Related

* [HappyMonkeyAI/spine-mcp](https://github.com/HappyMonkeyAI/spine-mcp) SPEC §6
* [ADR-0003](0003-mcp-intent-map-and-bootstrap-discovery.md) — MCP routing / listed ≠ mounted
* `BOOTSTRAP.md` §0b · `MCP.md` · `templates/cursor-hooks.json.example`
* `AGENTS.md` — Session start and end (Spine)
