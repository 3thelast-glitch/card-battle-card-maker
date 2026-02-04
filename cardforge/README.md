# CardSmith Studio

CardSmith Studio is a Windows-first desktop app for designing and exporting tabletop and card-game components. It combines a professional blueprint editor with data-driven batch export.

## Quick Start

### Requirements
- Node.js 18+ or 20+
- Windows 10/11 (primary target)

### Install (No Workspaces)
This repo intentionally avoids npm workspaces, so each package installs its own dependencies.

```bash
npm install
npm --prefix apps/main install
npm --prefix apps/renderer install
```

### Run (Dev)
```bash
npm run dev
```

### Package (Windows build)
```bash
npm run dist
```

### Optional (Tests)
```bash
npm --prefix packages/core install
npm run test
```

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

## Phase 1 - Editor UX (Implemented)

New features:
- Multi-selection with Shift+Click and marquee drag selection.
- Snap system with grid + smart guides (canvas center and element edges/centers).
- Optional grid visibility toggle.
- Pro-grade layers panel with drag-and-drop reorder, visibility, lock, and rename.
- Properties panel supports multi-selection with mixed state indicators.
- Resize elements via canvas handles (Konva Transformer), with image lock-ratio toggle.
- Image fit modes for image layers: contain / cover / fill.

Shortcuts:
- `Ctrl+S` save
- `Ctrl+Z` undo
- `Ctrl+Y` redo
- `Ctrl+D` duplicate
- `Arrow keys` nudge by 1px
- `Shift+Arrow` nudge by 10px
- `Space+drag` pan
- `Ctrl+wheel` zoom

Known limitations:
- Multi-selection transforms are disabled (move/nudge only).
- Snapping uses axis-aligned bounds (rotated elements snap by bounds).

Next steps:
- Phase 2 export pipeline (batch/export settings + PDF sheet export).

## Phase 2 - Data + Export (Implemented)

New features:
- CSV/JSON import with dot-path keys (e.g., `stats.attack`) normalized into nested data.
- Binding mapper for text/image elements via `bindingKey`.
- Batch export pipeline with progress UI and cancel.
- Windows-safe filename templating with `{{name}}_{{id}}` and quantity suffixes.

Known limitations:
- Export is PNG-only (PDF/SVG are still roadmap items).

Next steps:
- PDF sheet export (imposition) and SVG export.

## Phase 3 - Template Library + Assets (Implemented)

New features:
- Template Gallery with search, categories, thumbnails, and “Create Project”.
- Asset pipeline under `apps/renderer/public/assets/...` for template imagery.
- Assets screen to import project images and drag them onto the canvas.

Known limitations:
- Built-in template set is minimal (expandable).

Next steps:
- Add more curated templates and thumbnails.

## Phase 5 - Localization (Implemented)

New features:
- Full i18n (English + Arabic) with runtime language toggle.
- RTL layout switching and Arabic-friendly font stack.
- Localized template names and descriptions.

Known limitations:
- Arabic copy will be refined during UX review.

Next steps:
- Expand localized sample data and help content.

## Template JSON Schema (Brief)

Each template is a JSON file in `/templates`:

```json
{
  "id": "fantasy-basic",
  "name": "Fantasy Basic",
  "category": "Fantasy",
  "size": { "w": 750, "h": 1050 },
  "background": "#0f1c33",
  "elements": [
    {
      "id": "title",
      "type": "text",
      "name": "Title",
      "x": 90, "y": 40, "w": 570, "h": 60,
      "rotation": 0, "visible": true, "zIndex": 1,
      "text": "{{name}}"
    }
  ]
}
```

Each element supports:
- `id, type, name, x, y, w, h, rotation, visible, zIndex`
- Style props per type (text, shape, image, icon)
- `bindingKey` to bind data directly

## Data Bindings

Text supports placeholders:
- `{{name}}`
- `{{stats.attack}}`

Image elements can bind to a field via `bindingKey`:
- `bindingKey: "art"` (expects a data URL or local file path)

Assets:
- Use `/assets/...` URLs (from `apps/renderer/public/assets`) inside templates or data.
- Imported project images are stored under `<projectRoot>/assets/images/` and referenced as `assets/images/<file>`.
- Drag assets from the **Assets** screen onto the canvas to create image elements.

Set assignment:
- Add a `set` column in your CSV/JSON matching a Set name (defaults to the first Set if missing).

## Batch Export Workflow

1. Import CSV/JSON in **Data**.
2. Map columns to bindings.
3. Set `quantity` per row (optional).
4. Go to **Export**, choose output folder.
5. Export batch PNGs.

Filenames are generated from templates such as `{{name}}_{{id}}` and sanitized to be Windows-safe. When `quantity` is greater than 1, copies are exported with `_1.._N` suffixes.

Progress and cancel controls are available during batch export.

## Security Model (Electron)

- `contextIsolation: true`
- `nodeIntegration: false`
- `sandbox: true`
- Minimal preload API (`open/save/read/write/selectFolder/openImageFiles/copyFile`)

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
