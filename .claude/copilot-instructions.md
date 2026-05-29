---
name: Karpathy Guidelines for All Agents
description: Use the karpathy-guidelines skill for all coding conversations to ensure focused, simple, and goal-driven code
skills:
  - karpathy-guidelines
---

# Project-Wide Guidelines

All agents in this project follow the Karpathy Guidelines for code quality:

1. **Think Before Coding** — Surface assumptions, present tradeoffs, ask for clarity
2. **Simplicity First** — Minimum code that solves the problem, no speculation
3. **Surgical Changes** — Touch only what's necessary, clean up only your own mess
4. **Goal-Driven Execution** — Define success criteria, loop until verified

These guidelines are applied automatically to every agent conversation. For coding tasks, the system will prioritize:
- Avoiding overcomplication and bloated abstractions
- Making only necessary, focused changes
- Clear assumptions before implementation
- Verifiable success criteria
