# Music Player Project Context

## Project Overview

This is a **React Native** application built with **Expo**, designed as a music player inspired by NetEase and Apple Music. It utilizes **Expo Router** for navigation and **Zustand** for state management. The app features a home feed, a music library, an explore tab, and a comprehensive player interface.

**Key Technologies:**
-   **Framework:** React Native, Expo (SDK ~54)
-   **Navigation:** Expo Router (v6)
-   **State Management:** Zustand
-   **Audio:** React Native Track Player / Expo Audio
-   **Styling:** StyleSheet with custom theming
-   **Linting/Formatting:** Biome

## Building and Running

The project is managed via `npm`.

*   **Install Dependencies:**
    ```bash
    npm install
    ```

*   **Start Development Server:**
    ```bash
    npm start
    ```

*   **Run on Android:**
    ```bash
    npm run android
    ```

*   **Run on iOS:**
    ```bash
    npm run ios
    ```

*   **Lint & Format Code:**
    ```bash
    npm run fix
    ```

*   **Type Check:**
    ```bash
    npm run type-check
    ```

## Project Structure

*   `src/app`: Contains the Expo Router file-based routing logic and screen components.
    *   `_layout.tsx`: Root layout configuration.
    *   `(tabs)`: Tab-based navigation stack.
    *   `player.tsx`: Full-screen player modal.
*   `src/components`: Reusable UI components (e.g., `PlayerControls`, `TracksList`).
*   `src/hooks`: Custom React hooks, including Zustand stores for state management (e.g., `useTheme`, `useSetupTrackPlayer`).
*   `src/lib`: Utility libraries and configurations (e.g., `expo-track-player.ts`).
*   `src/constants`: App constants, tokens, and static data.
*   `assets/data/library.json`: Local JSON file serving as the music library data source.
*   `biome.json`: Configuration for the Biome linter and formatter.

## Development Conventions

*   **Styling:** Uses standard `StyleSheet.create` combined with a `useTheme` hook to handle light/dark modes and custom color schemes.
*   **State:** Global state (queue, preferences) is managed via Zustand stores found in `src/store` and exposed via hooks.
*   **Formatting:** The project uses **Biome** for formatting. Run `npm run fix` to automatically format files.
    *   Indentation: Tabs
    *   Quotes: Double
    *   Trailing Commas: All
    *   Semicolons: Always
*   **Navigation:** Follows Expo Router conventions with `_layout.tsx` files defining navigators.
*   **Absolute Imports:** Uses `@/` alias for `src/` (configured in `tsconfig.json`).
