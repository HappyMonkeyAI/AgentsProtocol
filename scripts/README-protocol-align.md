# Protocol project alignment

Bring a checkout onto AgentsProtocol ADR-0003 (intent MCP routing) + ADR-0005 (Spine warm-start) and the operator host stack (.215).

## Script

```bash
# one repo
python3 scripts/align_project_protocol.py /path/to/repo --name my-slug

# batch
python3 scripts/align_project_protocol.py --batch scripts/protocol-align-tier1.txt

# dry run
python3 scripts/align_project_protocol.py --batch scripts/protocol-align-tier2.txt --dry-run
```

Idempotent. Does **not** commit.

## What it writes / updates

| Artifact | Behaviour |
|----------|-----------|
| `AGENTS.md` | Create or append Spine session-start/end block (ADR-0005) |
| `MCP.md` | Create full intent table **or** append stack addon (spine, vault, kev, dynamic_mcp_proxy) |
| `MCP.local.md` | Operator overlay for .215 mounted stack (gitignored) |
| `.agent/memories/` | Create if missing |
| `.gitignore` | Ensure `MCP.local.md` ignored |
| `.cursor/hooks.json` | Only if `.cursor/` already exists and hooks missing |
| Launcher + Spine registries | Upsert by **slug** into `launcher-project-registry/registry.json` and `/var/www/html/launcher/registry.json` |

## Batch files (this host)

- `protocol-align-tier1.txt` — stack + active products/MCP plane (25)
- `protocol-align-tier2.txt` — broader projects with prior agent surface (48)
- `protocol-align-tier3.txt` — remaining git checkouts under `~/projects` (19)

## Verify

```bash
spine --project <slug> brief
# or
spine --project /absolute/path brief
```

Path always works. Slug works after registry upsert.

## Not in scope

- Rewriting full project-specific MCP tables (addons only when MCP.md already exists)
- Committing or pushing
- Cloning missing repos
- Forcing Cursor hooks on repos that never used Cursor
