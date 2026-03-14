# HikerHunger Agent Conventions

Scope: entire repository.

## Working style
- Keep implementation conservative and maintainable.
- Prefer simple direct code over abstraction unless repeated complexity requires it.
- Avoid adding new dependencies unless clearly necessary for MVP requirements.
- Keep mobile-first UX as the default for layout and interactions.

## Project conventions
- Use TypeScript throughout.
- Use Next.js App Router patterns.
- Persist user data locally (IndexedDB) for offline-friendly behavior.
- Keep tab names and core domain naming consistent with product language: Trips, Map, Food/Water, Settings.

## File hygiene
- Do not add throwaway/demo files beyond required docs, samples, and tests.
- Update README when assumptions or user-visible behavior changes.
- Add/adjust tests only for pure logic in `lib/`.

## Validation expectations
- Run `npm run lint`, `npm run build`, and `npm run test` when dependencies are available.
- If environment constraints block command execution (for example network/package install restrictions), clearly report it.
