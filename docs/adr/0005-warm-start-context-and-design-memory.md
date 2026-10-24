# ADR-0005: Warm-start context and design memory servers

## Status

Proposed

## Context

`[Sanity]` grounds every session by reading README.md, CONTEXT.md, MCP.md and this protocol, and LTM asks agents to synthesise memory after each task. In practice, on a long-running project this breaks down:

- **Grounding cost grows without bound.** On one protocol project (2026-10-23), the grounding files cost about 10k tokens before any work. The episodic journal (`PROGRESS.md`) had reached about 55k tokens, too large to read whole.
- **Synthesis rarely happens.** 202 journal entries had produced 3 memory files in `.agent/memories/`.
- **Labels go stale.** Journals and task boards kept "in review" labels long after work merged, and agents repeated them as current.
- **UI work starts blind.** Agents re-screenshot pages every session and throw the captures away, and nothing checks the running UI against `DESIGN.md`.

Two optional MCP servers address this. They work with any agent (Claude Code, Codex, Hermes, Grok), and keep project files as the source of truth:

- **`spine`**: `session_brief` (about 2–2.5k tokens) built from the spine files and git, with stale-label and drift warnings. It also offers `get_section` / `recall` for detail, `checkpoint` and `record_memory` (with a duplicate gate) written as plain markdown under `.agent/memories/`, and `audit` / `distill` for the Truth Audit.
- **`spine-design`**: measures the running UI (tokens, components, contrast), compares it with `DESIGN.md` tokens, keeps captures per host and approved baselines in git, and captures through a browser MCP only when UI source changed.

In independent cold-start evals, a fresh agent grounded only by `spine` scored 16/20 on one project and 18/20 on another, where the tool had not been tuned. That cost about 21k and 18k grounding tokens, against about 52k for a full read, with no confidently wrong answers.

## Decision Drivers

* Bound grounding cost as projects age, without losing facts
* Make memory synthesis cheap enough that agents actually do it
* Treat git as the record of what shipped; flag stale labels
* Stay optional: nothing changes for projects or hosts without these servers
* Files remain the source of truth; servers never commit

## Considered Options

### Option 1: Keep file-only grounding, ask agents to summarise more
- **Pros**: No new dependency
- **Cons**: Cost keeps growing; the synthesis step is exactly the one being skipped

### Option 2: A server-owned database of project memory
- **Pros**: Fast queries
- **Cons**: Hides knowledge from git and people; competes with the spine files

### Option 3: Optional query/write servers over the existing spine (chosen)
- **Pros**: Bounded briefs, cheap writes, git-backed files, any agent, degrades to today's behaviour
- **Cons**: Another server to mount; briefs are summaries, so detail needs a follow-up call

## Decision

1. **`[Sanity]`:** when `spine` is mounted, `session_brief(project=<absolute path>)` satisfies grounding. Read full spine files only on demand (`get_section`, `recall`). Without it, grounding is unchanged.
2. **Post-task:** before stopping, `checkpoint` (agent name, done, next, blockers, V0–V4 results). Durable why/gotcha/decision facts go through `record_memory`, and its duplicate gate prefers `update_of` over new files. The resulting files are committed with the work they describe, under the project's commit policy.
3. **Truth Audit:** `audit`, then `distill`. Move the `.distilled-through` marker forward when a batch is done.
4. **UI work:** when `spine-design` is mounted, start with `design_brief`.
   - Use `ensure_capture` rather than ad-hoc screenshots, and `check_design` against `DESIGN.md` tokens.
   - Approve baselines deliberately with a note; diffs compare against them.
   - Privacy masks (inputs, canvas, configured selectors) are on by default.
5. **Bootstrap** gains an optional wiring step (BOOTSTRAP.md §1f).
6. **MCP.md** lists both as intents. They are optional, and "listed ≠ mounted" applies.

## Consequences

### Positive

* Grounding cost stops growing with project age, and briefs cite `path:line`
* Checkpoints and memories become routine for every agent, not only one vendor's hooks
* Merged-but-labelled-"in review" work and design drift are surfaced, not repeated

### Costs

* Agents must pass `project` explicitly (MCP servers don't share the agent's working directory)
* Briefs are summaries: rules appear as headlines, and the detail costs a follow-up call
* Design captures through background browser tabs can be slow; pixels are best-effort, measurements are not

## Related

* `AGENTS.md` §1 Sanity, §2 LTM · `BOOTSTRAP.md` §1f · `MCP.md`
* ADR-0001 (verification evidence recorded in checkpoints) · ADR-0003 (intent map, listed ≠ mounted)
