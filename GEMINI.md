## Project Overview

This project is a "Card Battle Card Maker," a Windows-first desktop application for creating and managing assets for trading card games. It's built with Electron, React, and Vite, and it uses the Google Gemini AI to generate card concepts and stats.

The application features a visual editor for card layouts, data-driven batch processing from CSV or Excel files, and the ability to export game-ready assets.

## ✨ Key Features

- **🤖 AI-Powered Generation**: Instantly generate card concepts, stats (HP, Attack), lore descriptions, and image prompts based on a theme using **Google Gemini AI** (`gemini-1.5-flash`).
- **📊 Bulk Data Management**: Import and manage card data via **CSV** or **Excel (.xlsx)** files.
- **⚖️ Auto-Balancing**: Includes advanced algorithms to calculate balanced stats based on rarity (Common to Legendary), cost, and abilities.
- **🎨 Visual Editor**: A professional canvas editor (powered by Konva) with snapping, layers, and multi-selection for designing card layouts.
- **📦 Game-Ready Export**: Batch export cards as images or generate a comprehensive `cards.json` with a ZIP of assets for direct integration into game engines.
- **⚔️ Deck Simulator**: Built-in simulation tools to test win rates and balance between generated decks.
- **🌍 Localization**: Full support for English and Arabic (RTL), including localized template rendering.

## Architecture

```
cardforge/
  apps/
    main/        # Electron main process + preload + packaging
    renderer/    # React UI (Vite) + Konva editor
  packages/
    core/        # Models, bindings, export logic, utils
    storage/     # Project serialization + recent projects
  templates/     # Built-in blueprint JSON templates
  docs/          # Roadmap, notes, samples
```

## Architecture Decisions

- **Electron + Vite + React** for fast iteration and a native Windows-first desktop shell.
- **Konva** for a performant canvas editor with transforms and export.
- **Zustand** for light state management.
- **PapaParse** for CSV ingestion.

## Core Concepts

- **Project**: A single `.cardsmith.json` file containing sets, blueprints, items, data tables, and assets.
- **Set**: A collection such as "Base Deck" or "Tokens".
- **Blueprint**: A template describing layout + layers + bindings.
- **Item**: An instance generated from a blueprint + row of data.

## Building and Running

### Prerequisites

*   Node.js (v18+ or v20+)
*   Windows 10/11

### Development

To run the application in development mode, follow these steps:

1.  **Install root dependencies:**
    ```bash
    npm install
    ```
2.  **Install application sub-package dependencies:**
    ```bash
    npm --prefix apps/main install
    npm --prefix apps/renderer install
    ```
3.  **Run the development server:**
    ```bash
    npm run dev
    ```

### Building for Production

To build the application for production, run the following command:

```bash
npm run dist
```

This will create a distributable installer for Windows.

### Testing

To run the tests for the `core` package, use the following commands:

```bash
npm --prefix packages/core install
npm run test
```

## Development Conventions

*   **State Management:** The application uses Zustand for state management in the React-based renderer process.
*   **AI Integration:** The `@google/generative-ai` package is used to integrate with the Google Gemini AI for content generation.
*   **Code Style:** The project uses Prettier for code formatting. You can format the code by running:
    ```bash
    npm run format
    ```
*   **Linting:** ESLint is used for linting. You can lint the renderer process code by running:
    ```bash
    npm --prefix apps/renderer run lint
    ```
*   **Shortcuts:**
    *   `Ctrl+S` save
    *   `Ctrl+Z` undo
    *   `Ctrl+Y` redo
    *   `Ctrl+D` duplicate
    *   `Arrow keys` nudge by 1px
    *   `Shift+Arrow` nudge by 10px
    *   `Space+drag` pan
    *   `Ctrl+wheel` zoom

## Troubleshooting

- **Windows path issues**: Use local file paths or `file://` URLs for bound images.
- **Export permissions**: Ensure the destination folder is writable.
- **Packaging**: Run `npm run dist` from the repo root.
- **Missing modules**: Run the per-package installs above if `npm run dev` cannot find Electron or Vite dependencies.

## Roadmap

- PDF sheet export (imposition) and SVG export
- Icon library + asset manager
- Blueprint rules (auto-fit, overflow, text shrink)
- Plugin system for custom exporters and renderers
- Cloud sync for templates and data