import { useEffect, useRef } from 'react';

/**
 * Focuses the returned ref's element one frame after mount, instead of via
 * the native `autofocus` attribute.
 *
 * Why: `autofocus` applies synchronously, inside whatever event turn caused
 * the element to mount. If that turn is itself a keydown handler for
 * Enter/Space (as our pause shortcut is), the browser's own "Enter activates
 * the currently-focused element" default action can then fire *again* for
 * that same keypress — now against the element that just autofocused —
 * immediately undoing the transition that revealed it. Deferring the focus
 * by a frame keeps the same "land on the primary action" UX for keyboard/TV
 * remote users without racing the keypress that caused it.
 */
export function useAutoFocus<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const frame = requestAnimationFrame(() => ref.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, []);

  return ref;
}
