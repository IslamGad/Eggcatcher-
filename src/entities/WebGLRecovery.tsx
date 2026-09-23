import { useThree } from '@react-three/fiber';
import { useEffect } from 'react';

/**
 * TV GPUs are far more prone to real WebGL context loss (driver resets under
 * memory/thermal pressure) than desktop hardware — this isn't the
 * Suspense-remount kind of context loss fixed elsewhere, it's the browser's
 * own 'webglcontextlost' event firing on a context that's still mounted.
 *
 * Three.js's WebGLRenderer already does the mandatory half of recovering
 * from that: it calls preventDefault() on the loss event (without which the
 * browser would never restore the context at all) and re-initializes its
 * own GL state once 'webglcontextrestored' fires. What it can't do on its
 * own is get react-three-fiber to actually *render a frame* afterward —
 * and this app runs frameloop="demand" on every idle screen (menu / paused
 * / game over), where nothing else would naturally trigger one. Without
 * this, a context loss during an idle moment restores silently but stays
 * visually frozen (or blank) forever, since no one ever asks for a new
 * frame. Renders nothing itself.
 */
export function WebGLRecovery() {
  const gl = useThree((s) => s.gl);
  const invalidate = useThree((s) => s.invalidate);

  useEffect(() => {
    const canvas = gl.domElement;
    const onContextRestored = () => invalidate();
    canvas.addEventListener('webglcontextrestored', onContextRestored);
    return () => canvas.removeEventListener('webglcontextrestored', onContextRestored);
  }, [gl, invalidate]);

  return null;
}
