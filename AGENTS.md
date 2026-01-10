## Project purpose
- Build a desktop LLM translation app with Electron + React.
- Provide auto/explicit language selection, fast translation, and configurable LLM base URL/API key/model.
- Use a modern, minimal UI with system-integrated title bar controls and light/dark support.

## Architecture
- Clean Architecture with DI and MVVM.
- Layers:
  - Domain: `src/domain` (models, ports, use cases)
  - Infrastructure: `src/infrastructure` (LLM adapter, settings storage, detectors)
  - App/DI: `src/app/di` (container, tokens)
  - UI: `src/renderer` (views, viewmodels, UI components)
  - Main/Preload: `src/main`, `src/preload` (Electron app + IPC bridge)
- MVVM:
  - ViewModel: `src/renderer/viewmodels/TranslatorViewModel.ts`
  - View: `src/renderer/views/TranslatorView.tsx`

## Development conventions
- UI stack: React + Tailwind v3 + shadcn/ui components.
- Theme:
  - Use `document.documentElement.classList.toggle("dark", ...)`.
  - Theme mode (system/light/dark) stored in local storage.
- Title bar:
  - Use `titleBarStyle: "hidden"` + `titleBarOverlay` in Electron.
  - Drag region uses `.drag-region`; interactive controls use `.no-drag`.
- Avoid introducing non-ASCII text in source unless necessary.
- Keep UI minimal and functional; no "translator" marketing copy in the main view.

## Useful commands
- Dev: `npm run dev`
- Build: `npm run build`
