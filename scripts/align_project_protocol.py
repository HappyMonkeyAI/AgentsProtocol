#!/usr/bin/env python3
"""Align a project root with AgentsProtocol ADR-0003/0005 + local .215 stack.

Idempotent. Does not commit. Skips secrets.

Usage:
  python3 align_project_protocol.py /path/to/repo [--name slug] [--dry-run]
  python3 align_project_protocol.py --batch tier1.txt
"""
from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
from datetime import date
from pathlib import Path

PROTOCOL = Path("/home/stephen/projects/AgentsProtocol")
SPINE_BLOCK = """## Session start and end (Spine) — ADR-0005
If the `spine` MCP is available, call `session_brief(project="{project}")` (or the absolute path of this repo) first and use `get_section` / `recall` instead of reading PROGRESS.md or CONTEXT.md whole. Without the MCP, run `spine brief` from the repo root. If neither works, ground normally — never block the session on Spine.
Before you stop, call `checkpoint` with your agent name (e.g. `hermes`), what was done, what's next and any blockers. Save durable why/gotcha/decision facts with `record_memory`. Prefer `checkpoint` over free-form PROGRESS.md appends when Spine is available.
Shared protocol law: [HappyMonkeyAI AgentsProtocol](https://github.com/HappyMonkeyAI/AgentsProtocol) (ADR-0005 Spine warm-start).
"""

MCP_TEMPLATE = """# MCP.md — Intent → server routing

**Purpose:** Route work by **intent**, then confirm/activate via live catalogue. Listed ≠ mounted (ADR-0003).

**Rules:**
1. On grounding: read this file + optional `MCP.local.md`.
2. Prefer listed MCP over shell improvisation for matching work.
3. If tools missing: Hermes MCP config **or** `dynamic_mcp_proxy` / `dynamic_proxy` → search → activate → (for vault) `*_load` before search tools. One live check before “unavailable.”
4. No secrets, tokens, or raw connection strings here.
5. Keep this table short. Full catalogue: Dynamic MCP Proxy / MonkeySwarm.

**Related:** [AgentsProtocol](https://github.com/HappyMonkeyAI/AgentsProtocol) `MCP.md` · ADR-0003 · ADR-0005 · skill `mcp-intent-routing`

---

## Core plane (usually always-on on operator host)

| Intent | Server (typical name) | Use when | Notes |
|--------|----------------------|----------|-------|
| Lazy tool belt / activate on-demand | `dynamic_mcp_proxy` / `dynamic_proxy` | Need a server not in session | Search → activate → handshake |
| Host CPU/RAM admission | `resource_sentinel` | Full tests, builds, containers, parallel agents | Snapshot → lease → heartbeat → release |
| Project paths, ports, stack | `launcher_registry` | Port conflicts, locate checkout | Prefer before binding ports |
| Project warm-start / session end | `spine` | Session start Sanity; before stop; Truth Audit | ADR-0005 — `session_brief` / `checkpoint` / `audit`; CLI `spine brief` |
| UI design memory / drift | `spine-design` | UI vs DESIGN.md | `design_brief` → `ensure_capture` → `check_design` |
| Operator prefs / subagent bootstrap | `user_context` | Spawning delegates | Local context root |
| Cross-agent tasks / readiness | `agent_communication` | Delegation, provider readiness | LAN coordination |
| Multi-agent file board | `agent_coordination` | File claims / task board | Does not replace locks |
| Live browser QA (V3) | `browseros` / `browseros_neo` / Playwright | ADR-0001 live exploratory | Real URL + state readback |

---

## On-demand / specialty (activate when intent matches)

| Intent | Server / component | Activate / find via | Protocol hook |
|--------|--------------------|---------------------|---------------|
| **Security / vulnerability audit** | `auditscan` / AuditScan | Hermes or `proxy_activate_server("auditscan")` | Trident **input**, not Owner V2/V3 substitute |
| **Article / tutorial research** | `article_research` | Hermes or proxy activate | Planning / Deep Mode RECON |
| **Structured choice / decision** | `kev` / `kev_157` / `kev-decision-mcp` | Hermes always-on when configured; else proxy | `kev_evaluate` / `kev_permute` / `kev_separate` — not free-form text |
| **Library / API pattern RAG** | `neo4j_semantic_search` / `neo4j-semantic-search` | Hermes direct **or** proxy activate then `*_load` | Codex vault graph; backend often 192.168.5.232 Neo4j+Ollama |
| GitHub issues/PRs | `github` | Hermes or proxy | Prefer over raw `gh` when mounted |
| Browser E2E | `playwright` | Hermes or proxy | Complements browseros |
| Durable wiki notes | project `kb-vault` / basic-memory | path `~/projects/kb-vault` on .215 | Desktop canonical may still be .229 |

---

## Discovery checklist

```text
[ ] Read MCP.md (+ MCP.local.md if present)
[ ] spine: session_brief or `spine brief` (ADR-0005)
[ ] dynamic_mcp_proxy: list/search when tools missing
[ ] resource_sentinel before heavy parallel/build
[ ] launcher_registry: project registered? ports free?
[ ] Domain extras: auditscan / article_research / kev / vault semantic search
[ ] Do not treat empty session tool list as empty fleet
```

## Project notes

- Project slug for Spine/launcher: `{project}`
- Absolute path: `{path}`
- Prefer absolute path if named resolution fails.
"""

MCP_LOCAL_TEMPLATE = """# MCP.local.md — machine overlay ({host})

- Last discovery: {today}
- Discovery sources: Hermes mcp_servers + DynamicMCPProxy catalogue + local stack stand-up
- Do not commit secrets. Prefer gitignore for this file.

## Mounted / confirmed on this operator host (.215)

- spine / spine_design
- dynamic_mcp_proxy (wrapper hermes-dynamic-mcp-proxy)
- resource_sentinel
- launcher_registry
- neo4j_semantic_search (LLM-Codex-Reference-Vault; Neo4j+Ollama often .232)
- local_claim_evidence
- article_research
- kev / kev_157
- agent_communication / agent_voice
- browseros / browseros_neo / playwright
- github / user_context
- openukpublicdata (when needed)

## Wanted / optional

- auditscan — prefer Hermes or proxy plugin path
- claim_evidence LLM host may still point at .229 until retargeted
- kb-vault desktop raw/canonical may still live on .229; git clone at ~/projects/kb-vault

## Project-specific

| Intent | Server | Note |
|--------|--------|------|
| warm-start | spine | project=`{project}` or path `{path}` |
| library RAG | neo4j_semantic_search | hybrid/vector/keyword over Codex vault |

## Activate notes

- Proxy vault: `proxy_activate_server("neo4j-semantic-search")` then `neo4j-semantic-search_load` before search tools
- Hermes vault: `neo4j_semantic_search` tools directly when mounted
- Spine CLI: `spine --project {path} brief`
"""

SPINE_MARKERS = (
    "session_brief",
    "Session start and end (Spine)",
    "ADR-0005",
)


def slugify(name: str) -> str:
    s = re.sub(r"[^a-zA-Z0-9]+", "-", name).strip("-").lower()
    return s or "project"


def ensure_gitignore(root: Path, dry: bool) -> str:
    gi = root / ".gitignore"
    line = "MCP.local.md"
    if not gi.exists():
        if not dry:
            gi.write_text(f"# local protocol overlay\n{line}\n", encoding="utf-8")
        return "gitignore:created"
    text = gi.read_text(encoding="utf-8", errors="ignore")
    if re.search(r"(?m)^MCP\.local\.md$", text) or "MCP.local.md" in text.splitlines():
        return "gitignore:ok"
    if not dry:
        with gi.open("a", encoding="utf-8") as f:
            if not text.endswith("\n"):
                f.write("\n")
            f.write(f"\n# local protocol overlay (ADR-0003)\n{line}\n")
    return "gitignore:appended"


def ensure_agents(root: Path, project: str, dry: bool) -> str:
    path = root / "AGENTS.md"
    block = SPINE_BLOCK.format(project=project).rstrip() + "\n"
    if not path.exists():
        body = (
            f"# AGENTS.md — {root.name}\n\n"
            f"Behavior notes for agents in this repo.\n\n"
            f"{block}"
        )
        if not dry:
            path.write_text(body, encoding="utf-8")
        return "AGENTS:created"
    text = path.read_text(encoding="utf-8", errors="ignore")
    if any(m in text for m in SPINE_MARKERS):
        # Soft upgrade: ensure protocol pointer once
        if "HappyMonkeyAI/AgentsProtocol" not in text and "AgentsProtocol" not in text:
            if not dry:
                path.write_text(
                    text.rstrip()
                    + "\n\nShared protocol law: [AgentsProtocol](https://github.com/HappyMonkeyAI/AgentsProtocol).\n",
                    encoding="utf-8",
                )
            return "AGENTS:spine+pointer"
        return "AGENTS:spine-ok"
    if not dry:
        path.write_text(text.rstrip() + "\n\n" + block, encoding="utf-8")
    return "AGENTS:spine-appended"


def ensure_mcp(root: Path, project: str, dry: bool) -> str:
    path = root / "MCP.md"
    if not path.exists():
        body = MCP_TEMPLATE.format(project=project, path=str(root))
        if not dry:
            path.write_text(body, encoding="utf-8")
        return "MCP:created"
    text = path.read_text(encoding="utf-8", errors="ignore")
    actions = []
    lower = text.lower()
    # Append missing specialty rows as a short addon section (non-destructive)
    addons = []
    if "spine" not in lower or "session_brief" not in lower:
        addons.append(
            "| Project warm-start / session end | `spine` | Session start; before stop | ADR-0005 `session_brief` / `checkpoint`; CLI `spine brief` |"
        )
    if "neo4j" not in lower and "semantic-search" not in lower and "semantic_search" not in lower:
        addons.append(
            "| Library / API pattern RAG | `neo4j_semantic_search` / `neo4j-semantic-search` | Planning Memory / Codex patterns | Hermes direct or proxy activate then `*_load`; backend often .232 |"
        )
    if "kev" not in lower:
        addons.append(
            "| Structured choice / decision | `kev` / `kev_157` / `kev-decision-mcp` | Typed multi-option decisions | `kev_evaluate` / permute / separate; not free-form text |"
        )
    if "dynamic_mcp_proxy" not in lower and "dynamic_proxy" not in lower:
        addons.append(
            "| Lazy activate missing MCPs | `dynamic_mcp_proxy` / `dynamic_proxy` | Tools not in session | search → activate → load |"
        )
    if addons:
        section = (
            "\n\n## Stack alignment addon (operator host, ADR-0003/0005)\n\n"
            "| Intent | Server | Use when | Notes |\n"
            "|--------|--------|----------|-------|\n"
            + "\n".join(addons)
            + "\n"
        )
        if not dry:
            path.write_text(text.rstrip() + section, encoding="utf-8")
        actions.append("addon")
    else:
        actions.append("ok")
    return "MCP:" + "+".join(actions)


def ensure_mcp_local(root: Path, project: str, dry: bool) -> str:
    path = root / "MCP.local.md"
    body = MCP_LOCAL_TEMPLATE.format(
        project=project,
        path=str(root),
        today=date.today().isoformat(),
        host="192.168.5.215",
    )
    if path.exists():
        text = path.read_text(encoding="utf-8", errors="ignore")
        if "neo4j_semantic_search" in text and "spine" in text.lower() and "dynamic_mcp_proxy" in text:
            return "MCP.local:ok"
        # refresh stamp + ensure key lines
        if not dry:
            path.write_text(body, encoding="utf-8")
        return "MCP.local:refreshed"
    if not dry:
        path.write_text(body, encoding="utf-8")
    return "MCP.local:created"


def ensure_memories(root: Path, dry: bool) -> str:
    d = root / ".agent" / "memories"
    if d.is_dir():
        return "memories:ok"
    if not dry:
        d.mkdir(parents=True, exist_ok=True)
        (d / ".gitkeep").write_text("", encoding="utf-8")
        hist = d / "history"
        hist.mkdir(exist_ok=True)
        (hist / ".gitkeep").write_text("", encoding="utf-8")
    return "memories:created"


def ensure_cursor_hooks(root: Path, dry: bool) -> str:
    # Only if .cursor already exists (don't force Cursor onto every repo)
    cdir = root / ".cursor"
    if not cdir.is_dir():
        return "cursor:skip"
    hooks = cdir / "hooks.json"
    example = PROTOCOL / "templates" / "cursor-hooks.json.example"
    if hooks.exists():
        text = hooks.read_text(encoding="utf-8", errors="ignore")
        if "spine" in text and "brief" in text:
            return "cursor:ok"
        return "cursor:exists-no-spine"
    if example.exists() and not dry:
        hooks.write_text(example.read_text(encoding="utf-8"), encoding="utf-8")
        return "cursor:created"
    return "cursor:no-example"


def _upsert_projects_list(projects: list, root: Path, project: str) -> bool:
    """Mutate list of project dicts. Return True if changed.

    Match by slug first. Same path under a different slug (fixtures) does not
    block adding the canonical slug — Spine resolves by slug or absolute path.
    """
    found = None
    for p in projects:
        if not isinstance(p, dict):
            continue
        if p.get("slug") == project:
            found = p
            break
    if found is None:
        for p in projects:
            if not isinstance(p, dict):
                continue
            # only reuse path match when slug is empty/missing (legacy row)
            if p.get("path") == str(root) and not p.get("slug"):
                found = p
                break
    changed = False
    if found is None:
        projects.append(
            {
                "slug": project,
                "name": root.name,
                "path": str(root),
                "status": "active",
                "ports": [],
                "tech_stack": [],
                "summary": "",
                "github": "",
                "dependencies": {},
            }
        )
        return True
    if found.get("path") != str(root):
        found["path"] = str(root)
        changed = True
    if found.get("slug") != project:
        found["slug"] = project
        changed = True
    found.setdefault("name", root.name)
    found.setdefault("status", "active")
    return changed


def registry_upsert(root: Path, project: str, dry: bool) -> str:
    """Upsert into launcher + spine registries (list-of-projects shape)."""
    from datetime import datetime, timezone

    reg_paths = [
        Path("/home/stephen/projects/launcher-project-registry/registry.json"),
        Path("/var/www/html/launcher/registry.json"),
        Path.home() / ".spine" / "registry.json",
    ]
    # de-dupe identical files by resolve
    seen_inode: set[tuple[int, int]] = set()
    actions: list[str] = []
    now = datetime.now(timezone.utc).isoformat()
    for rp in reg_paths:
        if not rp.exists():
            continue
        try:
            st = rp.stat()
            key = (st.st_dev, st.st_ino)
            if key in seen_inode:
                actions.append(f"{rp.name}:same-inode-skip")
                continue
            seen_inode.add(key)
            data = json.loads(rp.read_text(encoding="utf-8"))
        except Exception as e:
            actions.append(f"{rp}:err:{e}")
            continue
        if not (isinstance(data, dict) and isinstance(data.get("projects"), list)):
            actions.append(f"{rp.name}:unsupported-shape")
            continue
        changed = _upsert_projects_list(data["projects"], root, project)
        if changed:
            data["updated_at"] = now
            if not dry:
                bak = rp.with_suffix(rp.suffix + ".bak-protocol-align")
                if not bak.exists():
                    bak.write_text(rp.read_text(encoding="utf-8"), encoding="utf-8")
                rp.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")
            actions.append(f"{rp.name}:updated")
        else:
            actions.append(f"{rp.name}:ok")
    return ",".join(actions) if actions else "registry:none"


def align_one(root: Path, project: str | None, dry: bool) -> dict:
    root = root.resolve()
    if not root.is_dir():
        return {"root": str(root), "error": "not a directory"}
    name = project or slugify(root.name)
    results = {
        "root": str(root),
        "project": name,
        "agents": ensure_agents(root, name, dry),
        "mcp": ensure_mcp(root, name, dry),
        "mcp_local": ensure_mcp_local(root, name, dry),
        "memories": ensure_memories(root, dry),
        "gitignore": ensure_gitignore(root, dry),
        "cursor": ensure_cursor_hooks(root, dry),
        "registry": registry_upsert(root, name, dry),
    }
    return results


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("paths", nargs="*", type=Path)
    ap.add_argument("--name")
    ap.add_argument("--batch", type=Path, help="file with one path per line")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()
    targets: list[tuple[Path, str | None]] = []
    if args.batch:
        for line in args.batch.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            if "|" in line:
                p, n = line.split("|", 1)
                targets.append((Path(p.strip()), n.strip()))
            else:
                targets.append((Path(line), None))
    for p in args.paths:
        targets.append((p, args.name))
    if not targets:
        print("no targets", file=sys.stderr)
        return 2
    out = []
    for path, name in targets:
        r = align_one(path, name, args.dry_run)
        out.append(r)
        print(json.dumps(r, ensure_ascii=False))
    # summary
    print(f"# done {len(out)} dry={args.dry_run}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
