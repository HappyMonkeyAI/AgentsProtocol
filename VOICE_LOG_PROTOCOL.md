# VOICE_LOG_PROTOCOL.md

## 🎙 Overview
The Voice Log Protocol ensures that all autonomous actions, task completions, and system audits performed by the Agents Protocol agent are audible and accessible. This protocol bridges the gap between silent code execution and user awareness via the AG Voice Log application.

## 🧠 Core Directive
Every significant milestone in a task MUST be logged to the centralized voice reports directory. This allows the user to stay informed of the agent's progress and decisions without needing to monitor the terminal or files manually.

## 🛠 Logging Mechanism
1. **Target Directory**: `/tmp/antigravity_reports/`
2. **Frequency**: 
   - Upon completion of a major task.
   - Upon generation of any audit report (Vibes, Security, etc.).
   - Upon discovery of critical blockers or pivots.
3. **File Format**: 
   - Extension: `.md`
   - Naming: `YYYY-MM-DD_HHMM_[Task_Name].md` (e.g., `2026-05-14_1155_WatcherUpdate.md`)

## 📝 Content Guidelines (TTS Optimization)
To ensure high-quality speech synthesis, follow these formatting rules:
- **Conciseness**: Keep logs under 1000 characters when possible.
- **Header Structure**: Use single `#` for the main title and `##` for sections.
- **Narrative Style**: Use first-person ("I have updated...") or neutral ("System updated...").
- **Code Avoidance**: DO NOT include large code blocks. Use descriptions like "Updated the watcher logic to support multiple directories" instead of showing the diff.
- **Tone**: Professional, clear, and informative.

## 🏁 Verification
After writing a log file, verify its existence. The AG Voice Log server will automatically detect and read the report aloud.

---
*Follow this protocol to maintain a high-velocity, audible development loop.*
