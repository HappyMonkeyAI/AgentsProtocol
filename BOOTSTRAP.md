# Bootstrap: Agents Protocol into a project

**Role:** You are the Agents Protocol Knowledge Architect + Tooling Scout.  
**Objective:** Install/refresh the documentation spine, **discover relevant MCP servers**, and bootstrap Long-Term Memory so future agents do not relearn stack, tools, or lessons.

---

## 0. Spine install (if missing)

Ensure the project root has (copy or link from the Agents Protocol repo as needed):

| File | Role |
|------|------|
| `AGENTS.md` | Behavior law (or symlink/subset + pointer to protocol) |
| `CONTEXT.md` | Stack, decisions, what not to do |
| `README.md` | Human entry |
| `MCP.md` | Intent → MCP routing (ADR-0003) — start from protocol `MCP.md` |
| `docs/adr/` | Decision records |
| `.agent/memories/` | LTM store |

Optional: `templates/MCP.local.md.example` → **`MCP.local.md`** (prefer gitignore for machine-local paths).

---

## 0b. Spine warm-start (ADR-0005)

**Goal:** Cheap Sanity grounding and durable session ends without dumping whole CONTEXT/PROGRESS every time. AgentsProtocol still owns behavior law; this step only wires the query layer.

1. Confirm **`spine`** is on PATH (or mount the `spine` MCP). If missing, note it in `MCP.local.md` and continue — do not block bootstrap.
2. Register this project in the operator Spine registry / launcher-registry when named resolution is wanted (`SPINE_REGISTRY` or `~/.spine/registry.json`). Prefer absolute path as the always-works fallback.
3. Ensure `.agent/memories/` exists (Spine writes checkpoints/memories only under `.agent/`).
4. **Cursor projects:** copy `templates/cursor-hooks.json.example` → `.cursor/hooks.json` (`sessionStart` → `spine --project . brief --cursor-hook`).
5. Keep a short **Session start and end (Spine)** block in project `AGENTS.md` (see protocol `AGENTS.md`); do not paste the full protocol via injection.
6. Smoke: `spine --project . brief` (or MCP `session_brief`) returns a cited brief; `spine --project . brief --cursor-hook` returns JSON with `additional_context` when using Cursor hooks.

---

## 1f. Design memory wiring (optional, ADR-0005)

Only if `spine-design` is mounted or activatable (one live check, per ADR-0003). Skip silently otherwise. For UI projects (web UI, ideally `DESIGN.md` with token frontmatter):

1. Create `.agent/design/spine-design.toml` with `base_url` (local dev server), `wait_for` (selector meaning “rendered”), and `mask` (private surfaces).
2. Run `ensure_capture` for the default view (both themes if applicable), then `check_design`.
3. Approve a baseline only once someone has looked at it.
4. Record what was wired in `MCP.local.md`. Commit `spine-design.toml`, baselines, and `inventory.json` only if the project wants shared design memory.

---

## 1. MCP discovery (ADR-0003) — do this before deep mining

**Goal:** Produce an accurate **mounted vs wanted** picture for *this* machine and *this* project. Listed in `MCP.md` is not the same as mounted.

### 1a. Read routing law

1. Read project `MCP.md` (or copy from protocol).
2. Read `MCP.local.md` if present.

### 1b. Live catalogue (prefer tools, not guesses)

When Dynamic MCP Proxy / Hermes tools are available:

```text
1. proxy_list_active_servers  (or equivalent)
2. proxy_list_available_servers / proxy_search_tools for project intents
3. Note swarm core: resource_sentinel, launcher_registry, agent_coordination,
   agent_communication, user_context, dynamic_proxy
4. Note domain needs from CONTEXT/stack:
   - security releases → AuditScan
   - planning/research → article-research-mcp (MonkeySwarm research profile)
   - UK/US open data → OpenUK / OpenUS MCPs
   - UI → browseros-neo / playwright
   - project warm-start / checkpoint → spine (ADR-0005)
   - DB → postgres/sqlite/neo4j only if stack uses them
5. Activate high-value missing servers when safe (proxy_activate_server)
6. launcher_registry: register or upsert this project if missing; check ports
```

If proxy is unavailable: inspect operator Hermes `mcp_servers` **names only** (never copy tokens into the repo). Record gaps for the human.

### 1c. Optional LAN / host probe

Only if CONTEXT or the human points at LAN hosts (e.g. `192.168.5.215`):

- Probe documented ports/URLs with short timeouts.
- Record **service role** in `MCP.local.md` (e.g. nginx, file share, app URL).
- **Do not** assume a LAN host is the MCP catalogue. Local Hermes/MonkeySwarm remains the default plane unless an MCP HTTP endpoint is explicitly documented.

### 1d. Write overlay

Create/update **`MCP.local.md`**:

- Last discovery date
- Mounted/confirmed server names
- Wanted-but-missing (with reason)
- Project-specific intent rows
- LAN hints without secrets

Commit **`MCP.md`** updates when portable. Keep secrets and raw machine credential paths out of git (`MCP.local.md` gitignored recommended).

### 1e. Sanity rule going forward

Session grounding must include MCP.md (+ local overlay). Mid-task: route by intent; one live search/activate before “tool missing.”

---

## 2. Context mining (LTM)

Scan the project's history (conversation logs, system-generated artifacts, and previous commits) to identify:

- **Major Features**: What was built and why?
- **Critical Bug Fixes**: What failed, and what was the root cause?
- **Design Patterns**: Recurring code structures or integration strategies.
- **Architectural Decisions**: Tech stack, deploy hosts, AI models.

Use MCP where it improves truth (launcher registry, DB schema MCP, git, browser) — do not invent infrastructure.

---

## 3. Information synthesis

Categorize into the schema defined in `AGENTS.md`:

### A. Codebase Insights (`.agent/memories/codebase_insights/`)

- Markdown per major module.
- Hidden knowledge: why X exists; non-obvious dependencies.

### B. Architectural Decisions (`.agent/memories/architectural_decisions/` and/or `docs/adr/`)

- Tradeoffs, status (Active/Deprecated), context.

### C. Patterns & Lessons (`.agent/memories/patterns_and_lessons.md`)

- Success patterns and failure lessons (Drag / momentum loss).

### D. Tooling note

- One short memory or CONTEXT bullet: which MCP intents matter for this repo (pointer to MCP.local.md).

---

## 4. Verification & commitment

- Ground entries in reality (MCP + repo evidence).
- **Ratchet:** commit spine + memory updates incrementally (Conventional Commits).
- Do not commit secrets, `.env`, or credential files.

---

## Target history (customize per project)

Replace with this repository’s real focus areas. Protocol-repo example themes:

1. Verification Ladder / Owner-as-Adversary (ADR-0001)
2. Isolated worktrees (ADR-0002)
3. MCP intent map + bootstrap discovery (ADR-0003)
4. Spine warm-start (ADR-0005)
5. Ratchet / Pulse stress behavior

---

**Prime Directive:** Eliminate relearning. Maximize momentum. Align with Agents Protocol — including **which MCP to use for which job**.
