// Mutable, module-level snapshot updated every ~500ms by PerfTracker (inside
// the Canvas) and read directly by PerfMonitor's own rAF loop (outside the
// Canvas). Deliberately bypasses React state/props so watching performance
// never itself costs a re-render.
interface PerfSnapshot {
  fps: number;
  drawCalls: number;
  triangles: number;
}

export const perfStats: PerfSnapshot = { fps: 0, drawCalls: 0, triangles: 0 };
