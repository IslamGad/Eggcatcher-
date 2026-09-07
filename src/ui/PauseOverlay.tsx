import { useAutoFocus } from '../hooks/useAutoFocus';
import { useGameStore } from '../state/gameStore';

export function PauseOverlay() {
  const resumeGame = useGameStore((s) => s.resumeGame);
  const returnToMenu = useGameStore((s) => s.returnToMenu);
  const resumeRef = useAutoFocus<HTMLButtonElement>();

  return (
    <div className="overlay">
      <div className="panel" role="dialog" aria-labelledby="pause-title">
        <h2 id="pause-title">Paused</h2>
        <button ref={resumeRef} type="button" className="primary-button" onClick={resumeGame}>
          Resume
        </button>
        <button type="button" className="secondary-button" onClick={returnToMenu}>
          Quit to Menu
        </button>
      </div>
    </div>
  );
}
