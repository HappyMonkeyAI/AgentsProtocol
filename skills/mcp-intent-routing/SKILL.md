---
name: mcp-intent-routing
description: Use when choosing MCP tools for a task or bootstrapping protocol MCP awareness. Route via MCP.md, live proxy search/activate, optional MCP.local.md.
---

# MCP intent routing

Operationalizes [ADR-0003](../../docs/adr/0003-mcp-intent-map-and-bootstrap-discovery.md) and root [`MCP.md`](../../MCP.md).

## When to use

- Session start / Sanity grounding on a protocolized repo
- Task needs security scan, research, capacity leases, ports/projects, browser QA, DB schema, GitHub, …
- Bootstrap or refresh project MCP awareness
- Tempted to say “no MCP for that” or improvise in shell first

## Procedure

1. **Read** `MCP.md`. If `MCP.local.md` exists, read it second (overrides host paths only; does not erase core intents).
2. **Match intent** to a table row.
3. **If tools present** in session → use them.
4. **If missing** → dynamic_proxy:
   - `proxy_search_tools` / `proxy_list_available_servers`
   - `proxy_activate_server` (or document Hermes config gap for the human)
   - optional `proxy_handshake` with project context
5. **One live failure** after search/activate → then shell/gh fallback; note gap in handoff / MCP.local.md “wanted.”
6. **Never** print secrets from env or config into chat, memory, or MCP.md.

## Bootstrap snippet (project install)

```text
1. Ensure spine: AGENTS.md, CONTEXT.md, MCP.md (copy from protocol), README
2. Discover: proxy list/search + known swarm mounts + optional LAN notes from operator
3. Write MCP.local.md from templates/MCP.local.md.example
4. Register project in launcher_registry if missing
5. Continue LTM bootstrap (BOOTSTRAP.md) using MCP to verify claims where possible
```

## Intent shortcuts

| Need | Try first |
|------|-----------|
| Heavy build/test/parallel | resource_sentinel |
| Ports / where is repo | launcher_registry |
| Security audit | AuditScan |
| Planning research | article-research-mcp → else brave/perplexity/fetch |
| Live UI proof | browseros-neo / playwright |
| Activate unknown | dynamic_proxy |
| Wiki/notes | basic-memory |

## Anti-patterns

- Empty `proxy_list_active_servers` ⇒ “no MCPs exist”
- Skipping sentinel when installed
- Putting tokens in MCP.local.md
- Treating AuditScan as full Owner acceptance (ADR-0001)
