import { useEffect } from 'react';
import { useGameStore } from '../state/gameStore';

const PAUSE_KEYS = new Set(['Escape', 'p', 'P', 'Enter', 'NumpadEnter', 'MediaPause', 'MediaPlayPause']);

/**
 * Escape / P / Enter — which is what a TV remote's OK/Select button reports
 * as in the browser — toggles pause during play. The pause overlay itself
 * (Resume / Quit to Menu) is just regular focusable buttons, so this is the
 * only bespoke shortcut needed to open it from the game.
 */
export function useGlobalShortcuts() {
  const status = useGameStore((s) => s.status);
  const pauseGame = useGameStore((s) => s.pauseGame);
  const resumeGame = useGameStore((s) => s.resumeGame);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!PAUSE_KEYS.has(e.key)) return;
      if (status === 'playing') pauseGame();
      else if (status === 'paused') resumeGame();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [status, pauseGame, resumeGame]);
}
