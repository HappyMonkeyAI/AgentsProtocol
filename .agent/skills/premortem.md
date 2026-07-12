---
name: premortem
description: "Run a premortem on any plan, launch, product, hire, strategy, or decision. Assumes it already failed 6 months from now and works backward to find every reason why. Produces a revised plan with blind spots exposed."
triggers: ["premortem this", "premortem [plan]", "run premortem"]
---

# 🧠 Premortem Skill (The Klein Protocol)

## 1. Framing & Context
- **The Premortem Premise:** "It is 6 months from now. The plan has failed spectacularly. We are looking at the wreckage. Why did it die?"
- **Context Gathering:** Before starting, ensure we have:
    - What are we doing? (The Plan)
    - Who is involved? (The Team)
    - What did success look like? (Criteria)

## 2. Phase I: The Raw Brainstorm
- Generate a comprehensive list of every possible reason for failure. 
- **Analytical Lenses:**
    - **Technical:** Bugs, scale, performance, security.
    - **Operational:** Logistics, human error, resource strain.
    - **External:** Market shift, competitor move, environment change.
    - **Psychological:** Optimism bias, groupthink, ignored warnings.

## 3. Phase II: The Story of Failure (Sub-Agent Audit)
For the top 3-5 failure modes, spawn a sub-agent to:
- **Narrate the Failure:** Write a 1-paragraph story of how this specific failure unfolded.
- **Identify Assumptions:** What were we taking for granted that turned out to be false?
- **Early Warning Signs:** What are the first 2-3 observable metrics that would indicate this path is starting?

## 4. Phase III: Synthesis & Mitigation
- **The Fatal Flaw:** The single most likely cause of death.
- **The Hidden Dragon:** The most dangerous, non-obvious risk.
- **The Revised Plan:** Updated steps to neutralize the identified threats.
- **Pre-Launch Checklist:** A list of "Tripwires" and "Gates" that must be passed.

## 5. Output Format
- **The Post-Mortem from the Future:** A narrative summary of the failure.
- **The Mitigation Map:** A table of Risks vs. Tripwires vs. Actions.
- **The Revised Protocol:** Surgical updates to the original plan.
