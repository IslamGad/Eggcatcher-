import { useEffect, useRef } from 'react';

export type Direction = -1 | 0 | 1;

const LEFT_KEYS = new Set(['ArrowLeft', 'Left']);
const RIGHT_KEYS = new Set(['ArrowRight', 'Right']);

/**
 * Tracks left/right arrow key state in a ref rather than React state.
 * The basket reads this once per animation frame, so key presses never
 * trigger a re-render — important for a smooth 60fps loop on TV hardware.
 */
export function useKeyboardControls() {
  const direction = useRef<Direction>(0);
  const leftHeld = useRef(false);
  const rightHeld = useRef(false);

  useEffect(() => {
    const recompute = () => {
      if (leftHeld.current && !rightHeld.current) direction.current = -1;
      else if (rightHeld.current && !leftHeld.current) direction.current = 1;
      else direction.current = 0;
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
      direction.current = 0;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
    };
  }, []);

  return direction;
}
