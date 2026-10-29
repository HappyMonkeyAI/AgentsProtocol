# ADR-0005: Spine warm-start and design memory

## Status

Accepted

## Context

`[Sanity]` grounds every session by reading README / CONTEXT / MCP.md / this protocol, and LTM asks agents to synthesise memory after each task. On long-running protocol projects that breaks down:

- **Grounding cost grows without bound.** Measured 2026-10-23: ~10k tokens before work; one `PROGRESS.md` ~55k, too large to read whole.
- **Synthesis rarely happens.** 202 journal entries had produced 3 memory files.
- **Labels go stale.** Journals/task boards kept “in review” after merge; agents repeated them as current.
- **UI work starts blind.** Agents re-screenshot every session and throw captures away; nothing checks the running UI against `DESIGN.md`.

[Spine](https://github.com/HappyMonkeyAI/spine-mcp) is a files-as-truth query layer over the existing documentation spine. It does **not** own shared behavior law — that stays in this protocol’s `AGENTS.md` / ADRs. Projects keep thin stubs + optional Cursor hooks.

Two optional MCP servers (CLI fallbacks where noted):

- **`spine`**: `session_brief` (~2–2.5k tokens) from spine files + git, with stale/drift warnings; `get_section` / `recall`; `checkpoint` / `record_memory` (duplicate gate); `audit` / `distill`. Cursor: `spine brief --cursor-hook` on `sessionStart`.
- **`spine-design`**: measures running UI (tokens, components, contrast), compares with `DESIGN.md`, keeps captures/baselines; captures via browser MCP only when UI source changed.

Independent cold-start evals: brief-only grounding scored 16/20 and 18/20 (~18–21k tokens vs ~52k full read), no confidently wrong answers.

Wave-1 pilots already inject briefs via Cursor hooks. This ADR makes the practice protocol law so bootstrap stops inventing per-repo wording.

## Decision drivers

* Bound grounding cost as projects age, without losing facts
* Make memory synthesis cheap enough that agents actually do it
* AgentsProtocol owns shared law; projects keep thin stubs + hooks
* Work when MCP is listed but not mounted (CLI fallback)
* Stay optional: nothing changes for hosts without these servers
* Files remain truth; servers never commit

## Considered options

### Option 1: Keep file-only grounding / ask agents to summarise more
- **Pros**: No new dependency
- **Cons**: Cost grows; synthesis is exactly the skipped step

### Option 2: Centralize all AGENTS.md via Spine injection
- **Pros**: One edit site
- **Cons**: Harnesses differ; Agents Window may drop `sessionStart` context; law belongs in git-reviewed protocol docs

### Option 3: Optional query/write servers + thin stubs (chosen)
- **Pros**: Bounded briefs, cheap writes, git-backed files, any agent, degrades to today’s behaviour
- **Cons**: Servers to mount; briefs are summaries (detail needs follow-up)

## Decision

1. **`[Sanity]`:** when `spine` is available, `session_brief(project=…)` satisfies grounding. Prefer `get_section` / `recall` over reading CONTEXT.md or PROGRESS.md whole. If Spine is missing, ground from the docs normally — never block the session.
2. **Post-task:** before stopping meaningful work, `checkpoint` (agent name, done / next / blockers, V0–V4 when applicable). Durable why/gotcha/decision facts via `record_memory` (duplicate gate prefers `update_of`). Prefer this over free-form PROGRESS.md appends. Spine writes plain markdown under `.agent/memories/` and never commits — commit those files with the work they describe.
3. **Truth Audit:** `audit`, then `distill` (~every 10 major tasks).
4. **UI work:** when `spine-design` is mounted, start with `design_brief`; use `ensure_capture` (not ad-hoc screenshots) and `check_design` against `DESIGN.md`; approve baselines deliberately; privacy masks on by default.
5. **Bootstrap** wires Spine warm-start (`BOOTSTRAP.md` §0b) and optional design memory (`§1f`). Cursor projects may copy `templates/cursor-hooks.json.example` → `.cursor/hooks.json`. Keep a short AGENTS Spine block; do not paste the full protocol via injection.
6. **`MCP.md`** lists both intents. Listed ≠ mounted (ADR-0003). Resolve projects by absolute path or registry / `SPINE_REGISTRY` name.

## Consequences

### Positive

* Grounding cost stops growing with project age; briefs cite `path:line`
* Checkpoints become routine across agents, not one vendor’s hooks
* Stale “in review” labels and design drift surface instead of being repeated
* Clear split: AgentsProtocol = law; Spine = query/cache over project files

### Costs

* Agents must pass `project` explicitly (MCP servers don’t share cwd)
* Operators install Spine on PATH / MCP and maintain registry for named projects
* Cursor Agents Window may omit hook-injected context — MCP `session_brief` remains the reliable path
* Design captures through browser tabs can be slow; pixels best-effort, measurements not

## Related

* [HappyMonkeyAI/spine-mcp](https://github.com/HappyMonkeyAI/spine-mcp) SPEC §6
* [ADR-0001](0001-verification-ladder-and-owner-adversary.md) · [ADR-0003](0003-mcp-intent-map-and-bootstrap-discovery.md)
* `BOOTSTRAP.md` §0b / §1f · `MCP.md` · `templates/cursor-hooks.json.example`
* `AGENTS.md` — Session start and end (Spine)
