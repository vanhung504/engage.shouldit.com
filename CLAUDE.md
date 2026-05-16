# CLAUDE.md

@AGENTS.md

## Priority Order
1. Simplicity (RULES.md takes precedence)
2. Readability
3. Style conventions (Airbnb as reference, not strict law)

## Code Style
- TypeScript
- Airbnb as reference — skip rules that add unnecessary complexity
- Flag: magic numbers, deep nesting (>3 levels)
- Prefer early returns, descriptive naming
- Suggest refactor ONLY when it clearly reduces complexity, not just to comply with style

## Structure
- Keep functions small but don't split if it hurts readability
- No helper functions unless logic is reused in 2+ places

## Testing
- Auto-generate tests after every new function
- Framework: Vitest
- Min coverage: happy path + 2 edge cases + 1 error case
- Test name format: `should [expected behavior] when [condition]`
- Never mark a task done without corresponding test