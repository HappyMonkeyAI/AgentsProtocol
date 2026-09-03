# MCP.md — Intent → server routing

**Purpose:** Stop mid-task tool amnesia. Agents route work by **intent**, then confirm/activate via live catalogue — not by hoping a tool is already in the session list.

**Rules (ADR-0003):**
1. On grounding / protocol bootstrap: read this file + optional `MCP.local.md`.
2. Before non-trivial work matching a row: prefer the listed MCP over shell improvisation.
3. **Listed ≠ mounted.** If tools are missing: `dynamic_proxy` → `proxy_search_tools` / `proxy_list_available_servers` → `proxy_activate_server` (or Hermes MCP config). One live check before claiming “unavailable.”
4. Never put secrets, tokens, or raw connection strings here. Names and hosts only.
5. Keep this table short (high-value intents). Full catalogue stays in Dynamic MCP Proxy / MonkeySwarm components.

**Related:** `AGENTS.md` §4 · `BOOTSTRAP.md` (discovery) · skill `mcp-intent-routing`

---

## Core plane (HappyMonkey swarm — usually always-on)

| Intent | Server (typical name) | Use when | Notes |
|--------|----------------------|----------|-------|
| Lazy tool belt / activate on-demand servers | `dynamic_proxy` | Need a server not in session tool list | Search → activate → handshake with project context |
| Host CPU/RAM admission for heavy jobs | `resource_sentinel` | Full test suites, builds, containers, parallel agents, indexing | Snapshot → request slot → lease → heartbeat → release (`AGENTS.md` Resource-aware execution) |
| Project paths, ports, tech stack | `launcher_registry` | Port conflicts, “where is project X”, CONTEXT excerpt | Prefer before binding ports |
| CLI swarm assignments / task board view | `agent_coordination` | Multi-agent file-board projects | Does not replace locks/`tasks.py` |
| A2A tasks, provider readiness, control center | `agent_communication` | Cross-agent task submit, CLI suggest | LAN coordination layer |
| Operator prefs / subagent bootstrap text | `user_context` | Spawning delegates, tone/stack defaults | Local context root |
| Durable notes / kb vault | `basic-memory` (or project wiki MCP) | Long-lived knowledge write/search | e.g. project `kb-vault` |
| Live browser QA (V3) | `browseros-neo` or Playwright MCP | ADR-0001 live exploratory | Real URL + state readback |

---

## On-demand / profile plane (activate when intent matches)

| Intent | Server / component | Activate / find via | Protocol hook |
|--------|--------------------|---------------------|---------------|
| **Security / vulnerability audit** | **`auditscan`** (HappyMonkeyAI/AuditScan stdio FastMCP bridge) | Hermes always-on when configured · else `proxy_activate_server("auditscan")` · cmd: `uv --directory <AuditScan> run --extra mcp python -m repo_audit_scan.mcp_stdio` | Trident **input**, not Owner V2/V3 substitute |
| **Article / tutorial research** | **`article_research`** | Hermes always-on when configured · else `proxy_activate_server("article_research")` · `uv --directory <article-research-mcp> run article-research-mcp` | Planning / Deep Mode RECON |
| Social / trend research | **`social_research`** | On-demand: `proxy_activate_server("social_research")` · research profile | Content planning |
| dev.to articles | `devto-mcp-server` | research profile | Lightweight article search |
| UK public data | OpenUKPublicDataMCP | `data` profile | Domain verticals |
| US public data | OpenUSPublicDataMCP | `data` profile | Domain verticals |
| GA4 provision for local web | `ai-google-analytics-mcp` | full profile | Only when GA setup is in scope |
| Credential vault (ops) | keymasterMCP | incubating — careful | Never echo secrets into chat/memory |
| GitHub issues/PRs/code | `github` (proxy catalogue) | `proxy_activate_server("github")` + token env | Prefer over raw `gh` when mounted |
| DB schema truth | `postgres` / `sqlite` / `neo4j` | activate + env | No schema guessing |
| Web research (generic) | `brave-search` / `perplexity` / `searxng` / `fetch` | activate as needed | Prefer project research MCP when present |
| Browser E2E | `playwright` / `puppeteer` | activate | Complements browseros-neo |
| Containers | `docker` | activate | Devops slices |
| Local git inspect | `git` (MCP) | activate | Optional; shell git still fine |

MonkeySwarm profiles (`swarm` / `research` / `data` / `full`): see install root `components.json`.

---

## Discovery checklist (session or bootstrap)

```text
[ ] Read MCP.md (+ MCP.local.md if present)
[ ] dynamic_proxy: list active + search intents for this project
[ ] resource_sentinel: available? (required before heavy parallel/build)
[ ] launcher_registry: project registered? ports free?
[ ] Domain extras: AuditScan / article-research / public-data if stack needs them
[ ] Write or refresh project MCP.local.md with: mounted names, missing-but-wanted, host hints
[ ] Do not treat empty session tool list as empty fleet
```

---

## Host hints (no secrets)

| Host | Observed / role | Agent guidance |
|------|-----------------|----------------|
| **Local Windows + Hermes** | Primary MCP plane: `dynamic_proxy`, coordination, sentinel, launcher, user_context, basic-memory, browseros-neo, … | Default for protocol work on this operator machine |
| **MonkeySwarm root** | `~/happymonkey` or install `Documents/development/MonkeySwarm` | Component clones + `components.json` profiles |
| **192.168.5.215** | LAN host: SSH **22**, HTTPS **443** (nginx), **8080** (nginx default), **8081** (TLS-ish nginx), **9000** (WebShare-style file share). Not a substitute for the local MCP catalogue as of 2026-09-03 scan. | Use for LAN deploys/files/services when CONTEXT says so; still route MCP via local proxy unless a project documents an MCP HTTP endpoint on this host |
| **192.168.5.80** | (operator stack) Expo/EAS / live test host when project CONTEXT says | Not MCP catalogue |

Refresh host rows in **`MCP.local.md`** after real probes; keep protocol `MCP.md` generic.

---

## Project overlay

Optional **`MCP.local.md`** (gitignored recommended for machine paths):

```markdown
# MCP.local.md — machine/project overlay
- Last discovery: YYYY-MM-DD
- Mounted now: dynamic_proxy, resource_sentinel, ...
- Wanted but missing: auditscan, article-research-mcp
- LAN endpoints: (service → url, no keys)
- Notes: ...
```

Template: `templates/MCP.local.md.example`

---

## Anti-patterns

- Ignoring AuditScan / research MCPs because they are not in the initial tool list
- Running heavy parallel builds without sentinel when it is installed
- Binding ports without launcher_registry / get_used_ports
- Dumping full proxy catalogue into every prompt
- Storing API keys in MCP.md
