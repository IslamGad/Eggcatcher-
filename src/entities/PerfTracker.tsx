import { useFrame, useThree } from '@react-three/fiber';
import { useRef } from 'react';
import { perfStats } from '../utils/perfStats';

const SAMPLE_INTERVAL_MS = 500;

/** Samples renderer stats twice a second into the shared perfStats object. Renders nothing. */
export function PerfTracker() {
  const gl = useThree((s) => s.gl);
  const frameCount = useRef(0);
  const lastSampleAt = useRef(performance.now());

  useFrame(() => {
    frameCount.current += 1;
    const now = performance.now();
    const elapsed = now - lastSampleAt.current;
    if (elapsed >= SAMPLE_INTERVAL_MS) {
      perfStats.fps = Math.round((frameCount.current * 1000) / elapsed);
      perfStats.drawCalls = gl.info.render.calls;
      perfStats.triangles = gl.info.render.triangles;
      frameCount.current = 0;
      lastSampleAt.current = now;
    }
  });

  return null;
}
