---
description: Sync local memories and learnings to the Global Neo4j Codex Vault
---

# Workflow: Global Memory Sync

This workflow automates the process of taking local project learnings from `.agent/memories/patterns_and_lessons.md` and pushing them into the global Neo4j LLM-Codex-Reference-Vault.

## Steps

1. **Review Local Memories**: Ensure that `.agent/memories/patterns_and_lessons.md` contains the latest insights from your recent tasks.

2. **Run Sync Script**:
// turbo
```bash
python3 /home/stephen/projects/AntigravityAgentsPromptProtocol/scripts/sync_memories.py &
```

3. **Verify in Neo4j**: Use the `neo4j-semantic-search` tool or query Neo4j directly to ensure the new `Memory` nodes are linked to the `Agents Protocol` project and associated `Concept` nodes.

4. **Iterate**: The synced memories will now be available as semantic context for all future planning phases via the `AGENTS.md` protocol.
