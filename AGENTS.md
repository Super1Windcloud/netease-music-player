# Repository Guidelines

## Project Structure & Module Organization
- `src/app`: Expo Router entry points; `_layout.tsx` configures navigation, `(tabs)` holds main screens, `(modals)` holds modal routes, and `player.tsx` renders the music player flow.
- `src/components`: Reusable UI parts (controls, lists, overlays).
- `src/constants`, `src/helpers`, `src/hooks`: Shared values, utilities, and custom hooks that wrap player logic and data fetching.
- `src/store`: Zustand stores; keep side effects thin and colocate selectors.
- `src/styles`: Theme tokens and shared style sheets.
- `src/types`: Cross-cutting TypeScript definitions.
- `assets`: Images/fonts used by the app; keep binary assets optimized.

## Build, Test, and Development Commands
- `npm install`: Install dependencies.
- `npm start`: Launch Expo in development; use the device chooser to open on web, Android, or iOS simulators.
- `npm run android` / `npm run ios`: Build and run on a connected device or simulator via `expo run`.
- `npm run lint`: ESLint over the repo; run before committing. Husky `prepare` is present; add hooks as needed.

## Coding Style & Naming Conventions
- Language: TypeScript + React Native with strict mode (`tsconfig.json` extends `expo/tsconfig.base`).
- Formatting: Prettier enforced (tabs width 2, single quotes, no semicolons, trailing commas, `printWidth` 100, LF endings). Run `npx prettier .` if you add a format script.
- Linting: ESLint with React/TypeScript plugins; unused vars warn, JSX imports not required. Prefer functional components and hooks.
- Naming: Components and screens in `PascalCase`, hooks `useThing`, Zustand stores `useXStore`, files in `kebab-case` or `index.tsx` when colocated.
- Imports: Use path aliases `@/*` and `@/assets/*` instead of long relative paths.

## Testing Guidelines
- No automated tests are present yet. When adding them, prefer Jest + React Native Testing Library; colocate under `__tests__` near the module or mirror `src/**` in a `tests/` folder.
- Favor small, focused tests for hooks and stores (player state, queue updates, error handling). For components, assert rendered text/controls rather than snapshots.

## Commit & Pull Request Guidelines
- Commits: Short, imperative subjects (e.g., `Add queue controls`, `Fix track seek timing`). Keep related changes together.
- Pull requests: Include a brief summary of behavior changes, linked issue/ticket, and screenshots or screen recordings for UI updates. Note which platforms/devices were exercised (`npm start` on web, Android emulator, iOS simulator). Ensure `npm run lint` passes before requesting review.

## Security & Configuration Tips
- Do not commit secrets; prefer `.env` or CI secrets and read via Expo config if needed. Keep `app.json` and any native assets (icons/splash) in sync.
- Adding native modules may require `expo prebuild`; document any new iOS/Android setup steps in the PR.
