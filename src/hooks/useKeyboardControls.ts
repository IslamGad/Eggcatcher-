import { useEffect, useRef } from 'react';

export type Direction = -1 | 0 | 1;

const LEFT_KEYS = new Set(['ArrowLeft', 'Left']);
const RIGHT_KEYS = new Set(['ArrowRight', 'Right']);

// Some Samsung TV browsers default a remote to "pointer" mode for ordinary
// web pages (as opposed to a key-driven "Link Browsing" mode): the D-pad
// moves an actual on-screen mouse cursor instead of firing ArrowLeft/
// ArrowRight keydowns, so the keyboard listener below never sees anything
// and the basket can't move at all. That cursor still dispatches standard
// pointermove events as it travels, though, so a steady horizontal drift of
// pointer events (rather than a single key) is treated as the same
// held-direction signal. PX_PER_SECOND_THRESHOLD filters out jitter from a
// literal mouse being rested on a desk (tiny, slow moves) while still
// reacting promptly to a TV cursor's much larger per-frame jumps.
const POINTER_IDLE_MS = 120;
const PX_PER_SECOND_THRESHOLD = 40;

/**
 * Tracks left/right arrow key state in a ref rather than React state.
 * The basket reads this once per animation frame, so key presses never
 * trigger a re-render — important for a smooth 60fps loop on TV hardware.
 */
export function useKeyboardControls() {
  const direction = useRef<Direction>(0);
  const leftHeld = useRef(false);
  const rightHeld = useRef(false);
  const pointerDirection = useRef<Direction>(0);

  useEffect(() => {
    const recompute = () => {
      if (leftHeld.current && !rightHeld.current) direction.current = -1;
      else if (rightHeld.current && !leftHeld.current) direction.current = 1;
      else direction.current = pointerDirection.current;
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (LEFT_KEYS.has(e.key)) {
        leftHeld.current = true;
        recompute();
      } else if (RIGHT_KEYS.has(e.key)) {
        rightHeld.current = true;
        recompute();
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (LEFT_KEYS.has(e.key)) {
        leftHeld.current = false;
        recompute();
      } else if (RIGHT_KEYS.has(e.key)) {
        rightHeld.current = false;
        recompute();
      }
    };

    const onBlur = () => {
      leftHeld.current = false;
      rightHeld.current = false;
      pointerDirection.current = 0;
      direction.current = 0;
    };

    let lastPointerX: number | null = null;
    let lastPointerTime = 0;
    let idleTimer: ReturnType<typeof setTimeout> | null = null;

    const stopPointerDrift = () => {
      lastPointerX = null;
      pointerDirection.current = 0;
      recompute();
    };

    const onPointerMove = (e: PointerEvent) => {
      const now = performance.now();
      if (lastPointerX !== null) {
        const dt = (now - lastPointerTime) / 1000;
        const speed = dt > 0 ? (e.clientX - lastPointerX) / dt : 0;
        if (Math.abs(speed) >= PX_PER_SECOND_THRESHOLD) {
          pointerDirection.current = speed > 0 ? 1 : -1;
          recompute();
        }
      }
      lastPointerX = e.clientX;
      lastPointerTime = now;

      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = setTimeout(stopPointerDrift, POINTER_IDLE_MS);
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    window.addEventListener('pointermove', onPointerMove);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('pointermove', onPointerMove);
      if (idleTimer) clearTimeout(idleTimer);
    };
  }, []);

  return direction;
}
