# Diverged repos — reconcile plan (report only)

Generated after git fetch scan. Do **not** blind `pull --ff-only`.
Protocol commits are usually `docs(protocol): Spine ADR-0005 + local MCP stack routing` (ahead=1).

## Strategy (per repo)

1. `git fetch origin`
2. `git log --oneline --left-right HEAD...@{u}` — confirm local tip is only protocol (or list extras)
3. Prefer:
   - **rebase** if local tip is only the protocol commit(s): `git pull --rebase --autostash`
   - **merge** if local has real product commits mixed in
4. Resolve conflicts (likely `AGENTS.md` / `MCP.md` only)
5. Push when clean

## Repos

| Repo | behind | ahead | dirty | Likely local tip | Suggested |
|------|-------:|------:|------:|------------------|-----------|
| Resource-Sentinel-MCP | 1 | 1 | 0 | protocol docs | rebase onto origin/main, push |
| EchoesOfAion | 1 | 1 | 0 | protocol docs | rebase onto origin/dev, push |
| article-research-mcp | 24 | 1 | 0 | protocol docs | rebase onto origin/main (24 remote commits), push |
| kev-mcp-http | 7 | 1 | 0 | protocol docs | rebase onto origin/main, push |
| songbird-agent-mcp | 2 | 1 | 1 | protocol + 1 dirty | stash/keep dirty, rebase, push |
| devto-mcp-server | 3 | 1 | 4 | protocol + dirty | inspect tip; rebase if protocol-only |
| Agent-Voice-TTS | 2 | 3 | 26 | 3 local commits + heavy dirty | **manual** — inspect all 3 local commits before rebase |

## Commands (template)

```bash
cd <repo>
git fetch origin
git log --oneline --left-right HEAD...@{u} | head -40
# if left side is only docs(protocol):
git pull --rebase --autostash
# if conflicts only in AGENTS.md/MCP.md: keep both intent tables / Spine block
git push origin HEAD
```

## Do not auto-run here

Heavy dirty trees and multi-commit ahead (Agent-Voice-TTS) need human/session judgment.
article-research-mcp is clean but 24 behind — rebase is fine but long; run when ready.

## After reconcile

Re-scan: `python3` scan script or `git status -sb` per repo.

## MRPGRealms tracking fix (done 2026-11-01)

**Problem:** `main` tracked `agentsprotocol/main` (HappyMonkeyAI/AgentsProtocol) instead of `origin/main` (MRPGRealms). Local tip sat on the old `docs-agents-protocol` lineage (~10 docs commits, **422 behind** real game `main`).

**Fix applied:**
1. `git fetch origin` (ref lock cleared via explicit `+refs/heads/main:refs/remotes/origin/main`)
2. `git branch --set-upstream-to=origin/main main`
3. `git reset --hard origin/main` (untracked dirty only; no tracked loss)
4. Re-ran `align_project_protocol.py` → commit `docs(protocol): …` on real main
5. Pushed when ahead-only protocol

**Still present:** remote named `agentsprotocol` pointing at AgentsProtocol — harmless if unused; remove later if desired (`git remote remove agentsprotocol`).
