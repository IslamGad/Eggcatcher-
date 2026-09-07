import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Smart TV browser engines (Tizen/webOS Chromium ports) lag years behind
    // desktop Chrome. Vite's default target is a recent "widely available"
    // baseline that's newer than many TV engines still in the field, so pin
    // an explicit conservative target instead — covers Chromium ~63+ /
    // Safari 12+ (roughly Tizen 5+ / webOS 4+, ~2018 onward) without
    // reaching so far back that React 19 / Three.js r185 themselves would
    // need polyfills they don't ship.
    target: ['es2018', 'chrome63', 'safari12'],
  },
})
