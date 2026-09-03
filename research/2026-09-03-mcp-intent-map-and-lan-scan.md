# Research: MCP intent map and LAN scan

**Date:** 2026-09-03  
**Decision:** ADR-0003 — MCP.md + bootstrap discovery.

## Problem

Installed/activatable MCPs (AuditScan, article-research, Resource Sentinel, launcher, …) are invisible mid-task when not in the session tool list. Dynamic proxy alone does not fix routing memory.

## Evidence

### Hermes local plane (operator)

Always-on style mounts observed in config (names only):  
`dynamic_proxy`, `agent_coordination`, `resource_sentinel`, `user_context`, `agent_communication`, `launcher_registry`, `basic-memory`, `browseros-neo`, plus docker-related entries.

### Dynamic MCP Proxy catalogue

~57 available servers including swarm names (`agent_coordination`, `resource_sentinel`, `launcher_registry`, …) and generic catalogue (github, postgres, playwright, …).  
**Gap:** HappyMonkey specialty components (e.g. AuditScan, article-research-mcp) may need explicit catalogue registration or stdio activate — still list as intents in MCP.md.

### MonkeySwarm profiles

- `swarm`: teamwork, Agents Protocol, coordination, communication, launcher, sentinel, user-context, dynamic proxy  
- `research`: + article-research, social-research, devto  
- `data`: + OpenUK/OpenUS public data  
- `full` / `incubating`: GA, keymaster, …

### 192.168.5.215 probe (partial)

| Port | Result |
|------|--------|
| 22 | open (SSH) |
| 443 | nginx HTTPS (app HTML present) |
| 8080 | nginx default welcome |
| 8081 | nginx bad-request on plain HTTP (likely TLS-only) |
| 9000 | Express “WebShare” style LAN file share |

**Conclusion:** .215 is a useful LAN host for deploys/files/services, **not** the MCP source of truth. Do not bootstrap MCP expectations solely from this host.

## Cherry-pick

* Intent table in MCP.md  
* Bootstrap discovery → MCP.local.md  
* Live proxy search before “unavailable”  
* Sentinel + launcher + AuditScan + article-research as named intents  

## Avoid

* Committing tokens from Hermes config  
* Assuming every GitHub MCP is mounted  
* Replacing Owner verification with AuditScan alone  
