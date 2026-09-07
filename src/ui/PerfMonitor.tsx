import { useEffect, useRef, useState } from 'react';
import { perfStats } from '../utils/perfStats';

/**
 * Press "D" to toggle a lightweight FPS / draw-call / triangle overlay.
 * Useful for spot-checking performance directly on TV hardware where you
 * can't easily attach devtools. Writes to the DOM via refs on its own rAF
 * loop instead of React state, so it never itself perturbs the numbers it's
 * measuring.
 */
export function PerfMonitor() {
  const [visible, setVisible] = useState(false);
  const fpsRef = useRef<HTMLSpanElement>(null);
  const drawCallsRef = useRef<HTMLSpanElement>(null);
  const trianglesRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'd' || e.key === 'D') setVisible((v) => !v);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    if (!visible) return;
    let frameId: number;
    const update = () => {
      if (fpsRef.current) fpsRef.current.textContent = String(perfStats.fps);
      if (drawCallsRef.current) drawCallsRef.current.textContent = String(perfStats.drawCalls);
      if (trianglesRef.current) trianglesRef.current.textContent = String(perfStats.triangles);
      frameId = requestAnimationFrame(update);
    };
    frameId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frameId);
  }, [visible]);

  if (!visible) return null;

  return (
    <div className="perf-monitor" aria-hidden="true">
      <div>
        FPS: <span ref={fpsRef}>0</span>
      </div>
      <div>
        Draw calls: <span ref={drawCallsRef}>0</span>
      </div>
      <div>
        Triangles: <span ref={trianglesRef}>0</span>
      </div>
    </div>
  );
}
