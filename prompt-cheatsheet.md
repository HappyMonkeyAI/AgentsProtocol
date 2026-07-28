# Prompt Cheat Sheet

Copy-paste these. Remember: you direct, the agent executes.

---

## 🔧 Setup & Environment

### Build a Project
```
Build this project. Install any missing dependencies first. Tell me if anything fails.
```

### Run Tests
```
Run the test suite. Show me a summary of pass/fail results. If anything fails, explain why.
```

---

## 🔍 Understanding Code

### Explore a New Codebase
```
Read README.md. Give me a high-level overview of this project - what it does, main components, and how they fit together.
```

### Find Where Something Lives
```
Read README.md. Where is [FEATURE] implemented? Show me the key files and explain how they work together.
```

### Trace a Code Path
```
Read README.md. Trace how [ACTION] flows through the system from entry point to completion. Show me the relevant code.
```

---

## 📋 Spec-First Development

### Research Before Implementing
```
Read README.md and AGENTS.md.

I need to implement [FEATURE/FIX].

Before writing any code:
1. Research the relevant parts of the codebase
2. Identify what files would need to change
3. Note any patterns I should follow
4. List questions or concerns

Don't implement yet - just research and report back.
```

### Create a Feature Spec
```
Based on your research, create a feature spec covering:
- Problem we're solving
- Proposed approach
- Files to change
- Testing strategy
- Risks

I'll review before you implement.
```

### Spec a Bug Fix
```
Read README.md.

Bug: [DESCRIPTION]
Evidence: [LOGS/ERROR MESSAGES]

Create a spec for this bug fix covering:
1. Root cause analysis
2. Proposed fix
3. Files to change
4. How to verify it's fixed

Don't fix yet - spec first.
```

---

## 📝 Documentation

### Create README
```
README-TEMPLATE.md. Read the source files in src/ in sqlite-fork.

Using the README-TEMPLATE.md as a guide, create a comprehensive README.md 
Analyze this codebase and create a README.md with:
- What this project does (2-3 sentences)
- Quick start instructions
- Project structure overview
- How to run tests

Write the file.
```

### Create AGENTS.md
```

First, search the web for what an AGENTS.md file should contain and what coding conventions it typically includes.
Analyze the code style and patterns in this project. Create an AGENTS.md with:
- Code style rules you observed
- Key files and what they do
- Testing requirements
- Things to avoid changing

Write the file.
```

### Create Architecture Doc
```
Read the main source files. Create docs/ARCHITECTURE.md explaining:
- How the system works at a high level
- Key components and their responsibilities
- How data flows through the system
- Include a simple diagram

Write the file.
```

---

## 🐛 Bug Fixing

### Diagnose with Evidence
```
Read README.md and docs/TROUBLESHOOTING.md.

Bug report: [DESCRIPTION]
Logs: [PASTE RELEVANT LOGS]

Diagnose this:
1. What is the actual error?
2. What code path leads here?
3. What's the likely root cause?

Don't fix yet - just diagnose.
```

### Fix and Verify
```
Implement the fix we specced. Then:
1. Show me the changes
2. Run the tests
3. Verify the bug is fixed
4. Update TROUBLESHOOTING.md with this issue
```

---

## ⚙️ DevOps

### Create CI Pipeline
```
Read README.md and docs/BUILD.md.

Create a GitHub Actions workflow that:
1. Triggers on push and PR
2. Builds the project
3. Runs tests
4. Reports results

First create a spec, then implement.
```

### Fix Build Issues
```
The build is failing with: [ERROR]

Diagnose the issue and fix it. Show me what was wrong and how you fixed it.
```

---

## 🧪 Testing

### Add Tests
```
Read README.md and docs/TESTING.md.

Create tests for [COMPONENT/FEATURE]:
- Follow existing test patterns
- Cover happy path and error cases
- Make them runnable

Write the test file and run it.
```

---

## 🔄 Recovery

### Wrong Direction
```
Stop. That's not the right approach because [REASON]. Let's try [NEW DIRECTION] instead.
```
---

## 🎯 The CRAFT Method (When in Doubt)

**C**ontext → **R**equirement → **A**nchor → **F**eedback → **T**une

1. **Context** - Read the docs first ("Read README.md")
2. **Requirement** - State exactly what you need
3. **Anchor** - Set a constraint ("Don't implement yet")
4. **Feedback** - Review the output before moving on
5. **Tune** - Refine until right, then build
