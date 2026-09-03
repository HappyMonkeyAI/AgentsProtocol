# ADR-0003: MCP intent map and bootstrap discovery

## Status

Accepted

## Context

HappyMonkey / Hermes environments expose many MCP servers (swarm core via always-on mounts, plus Dynamic MCP Proxy catalogue, MonkeySwarm profiles, and specialty tools such as AuditScan and article-research). Agents still lose the plot mid-task: tools are installed or activatable, but not in the immediate tool list, so agents fall back to shell improvisation or skip security/research/capacity gates.

`AGENTS.md` already says “prefer MCP” and documents Resource Sentinel, but Sanity grounding only named README / CONTEXT / AGENTS — no **intent → server** map and no **bootstrap discovery** step when installing the protocol into a project.

A LAN probe of `192.168.5.215` (2026-09-03) showed a general host (SSH, nginx, WebShare on :9000), not a full MCP catalogue endpoint. The durable catalogue for this operator is local Hermes + MonkeySwarm + dynamic_proxy — reinforcing that discovery must be **explicit and file-backed**, not assumed from a single host.

## Decision Drivers

* Re-align agents to purpose-built MCPs without stuffing every schema into context
* Work when servers are lazy-loaded (dynamic_proxy)
* Bootstrap projects with a relevant, verified subset
* No secrets in git
* Stay compatible with MonkeySwarm component profiles

## Considered Options

### Option 1: Rely only on dynamic_proxy at runtime
- **Pros**: Always fresh
- **Cons**: Agents forget to search; empty active list feels like “no tools”

### Option 2: Giant generated dump of all tools into AGENTS.md
- **Pros**: Visible
- **Cons**: Token bloat, stale fast, secrets risk

### Option 3: MCP.md intent map + bootstrap discovery + optional MCP.local.md (chosen)
- **Pros**: Small routing table; live verify; project overlay; spine-grounded
- **Cons**: Rows need occasional maintenance

## Decision

1. Add **`MCP.md`** to the documentation spine: purpose → preferred server → when → activate path.
2. **`AGENTS.md` Sanity** includes MCP.md (and MCP.local.md if present).
3. **`BOOTSTRAP.md`** gains an MCP discovery phase: query dynamic_proxy / known mounts / optional host hints; write or refresh **`MCP.local.md`** with mounted vs wanted; never commit secrets.
4. Live catalogue wins disputes; MCP.md wins “what should I look for.”
5. Specialty servers (AuditScan, article-research, public-data, …) are first-class **intents** even if not currently activated.
6. Optional thin skill `mcp-intent-routing` operationalizes the checklist.

## Consequences

### Positive

* Agents regain auditscan/research/sentinel/launcher habits
* Bootstrap produces project-relevant MCP awareness
* Dynamic proxy remains the runtime source of truth for availability

### Costs

* MCP.md can drift — mitigate with bootstrap refresh and “one live search” rule
* Operators must maintain MCP.local.md on multi-machine setups

## Related

* MCP.md, templates/MCP.local.md.example, BOOTSTRAP.md
* MonkeySwarm `components.json` profiles
* HappyMonkeyAI/DynamicMCPProxy, Resource-Sentinel-MCP, AuditScan, article-research-mcp
* research/2026-09-03-mcp-intent-map-and-lan-scan.md
