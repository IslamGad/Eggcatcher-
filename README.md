# Eggcatcher-

A 3-minute arcade game built with React, react-three-fiber, and Three.js — optimized to run on smart TV browsers (LG webOS / Samsung Tizen class hardware), embedded in a host page via `<iframe>`.

## Running it

```bash
npm install
npm run dev      # dev server
npm run build    # production build (tsc -b && vite build)
```

## TV performance notes

- **Shared, tinted chicken art**: every chicken color variant (default/blue/orange/purple/green) loads the exact same body/wing/face PNGs — one request each, cached and reused — and gets its color from a per-instance material `color` multiply tint (`config/chickens.ts`'s `CHICKEN_TINT_COLORS`) instead of a duplicated image set per color. See `entities/Chicken.tsx`.
- **Upfront preloading**: `entities/AssetPreloader.tsx` loads every texture the game can show (`config/assets.ts`) behind a single Suspense boundary before the menu ever appears, so nothing pops in or stalls mid-match.
- **On-demand rendering**: the Canvas only renders continuously while a match is in progress (`frameloop="always"`); the menu, pause, and game-over screens render a single frame on demand — real GPU/CPU savings for however long a player lingers on a screen.
- **Conservative build target**: `vite.config.ts` pins the build target to cover Chromium ~63+ / Safari 12+ (roughly Tizen 5+ / webOS 4+), since TV browser engines lag years behind desktop Chrome.

## Embedding (iframe integration)

The game expects to run inside an `<iframe>` on a host TV app page, and has no way to close its own tab/frame. Instead, pressing the remote's **Back** button posts a message to the parent window and leaves the actual closing (removing/hiding the iframe) to the host:

```js
window.addEventListener('message', (event) => {
  if (event.data?.type === 'egg-catcher:close') {
    // e.g. remove or hide the iframe
  }
});
```

See `hooks/useExitOnRemoteBack.ts` for the key codes/names it listens for (LG webOS, Samsung Tizen) and why Escape/Backspace are deliberately excluded (Escape already opens the in-game pause menu via `hooks/useGlobalShortcuts.ts`).

## Oxlint

```bash
npm run lint
```

Type-aware rules aren't enabled by default — see [Oxlint's docs](https://oxc.rs/docs/guide/usage/linter/rules) to add them in `.oxlintrc.json`.
