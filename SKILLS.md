# Agents Protocol Skills Catalog

This catalog contains skills integrated from the [antigravity-skills](https://github.com/rmyndharis/antigravity-skills) repository, curated to support the Agents Protocol.

## Skills by Protocol Capability

### 🏗️ For Ripple (Dependency Awareness)

| Skill | Purpose |
|-------|---------|
| [`architect-review`](skills/architect-review/SKILL.md) | System architecture reviews and design validation |
| [`architecture-decision-records`](skills/architecture-decision-records/SKILL.md) | Documenting architectural decisions as ADRs |

### 📝 For Coding Standards

| Skill | Purpose |
|-------|---------|
| [`code-refactoring-refactor-clean`](skills/code-refactoring-refactor-clean/SKILL.md) | Code refactoring and clean code principles |
| [`code-review-ai-ai-review`](skills/code-review-ai-ai-review/SKILL.md) | AI-powered code review workflows |

### 🧠 For Echo (Structural Memory)

| Skill | Purpose |
|-------|---------|
| [`context-manager`](skills/context-manager/SKILL.md) | Context engineering and knowledge management |
| [`reference-builder`](skills/reference-builder/SKILL.md) | Creating technical references and documentation |
| [`code-documentation-doc-generate`](skills/code-documentation-doc-generate/SKILL.md) | Automated code documentation |

### ⚡ For Pulse (Velocity Monitor)

| Skill | Purpose |
|-------|---------|
| [`error-detective`](skills/error-detective/SKILL.md) | Error pattern detection across logs and code |

### ✅ For Autonomous Verification

| Skill | Purpose |
|-------|---------|
| [`tdd-orchestrator`](skills/tdd-orchestrator/SKILL.md) | Test-driven development workflows (Worker V0; not Owner V2) |
| [`owner-adversary-verification`](skills/owner-adversary-verification/SKILL.md) | Owner-as-Adversary Verification Ladder V0–V4 before Done/Ratchet (ADR-0001) |

### 🔄 For Atomic Momentum Checkpoints

| Skill | Purpose |
|-------|---------|
| [`git-pr-workflows-git-workflow`](skills/git-pr-workflows-git-workflow/SKILL.md) | Git workflow and PR management |

### 🌐 Technology & Language Mastery

| Skill | Purpose |
|-------|---------|
| [`python-pro`](skills/python-pro/SKILL.md) | Python programming expertise |
| [`typescript-pro`](skills/typescript-pro/SKILL.md) | TypeScript programming expertise |
| [`javascript-pro`](skills/javascript-pro/SKILL.md) | JavaScript programming expertise |
| [`rust-pro`](skills/rust-pro/SKILL.md) | Rust programming expertise |
| [`golang-pro`](skills/golang-pro/SKILL.md) | Go programming expertise |

---

## How Skills Work

Hermes Agent automatically activates relevant skills based on context. When you request:
- "Review this architecture" → Activates `architect-review`
- "Refactor this code" → Activates `code-refactoring-refactor-clean`
- "Debug this error" → Activates `error-detective`

## Adding More Skills

To add more skills from antigravity-skills, run:

```bash
# Find available skills
curl -s https://raw.githubusercontent.com/rmyndharis/antigravity-skills/main/CATALOG.md

# Or browse the repo directly
https://github.com/rmyndharis/antigravity-skills/tree/main/skills
```

Total skills available: **305**  
Currently integrated: **16** (core set)
