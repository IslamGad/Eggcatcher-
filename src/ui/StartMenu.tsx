import { useAutoFocus } from '../hooks/useAutoFocus';
import { useGameStore } from '../state/gameStore';
import { primeAudio } from '../systems/sfx';

export function StartMenu() {
  const startGame = useGameStore((s) => s.startGame);
  const highScore = useGameStore((s) => s.highScore);
  const startRef = useAutoFocus<HTMLButtonElement>();

  const handleStart = () => {
    // Must happen inside a real click handler — browsers only allow audio
    // to start playing if it traces back to a user gesture like this one.
    primeAudio();
    startGame();
  };

  return (
    <div className="overlay">
      <div className="panel" role="dialog" aria-labelledby="menu-title">
        <p className="eyebrow">Farmyard Frenzy</p>
        <h1 id="menu-title">Egg Catcher</h1>
        <p className="subtitle">
          Catch every egg the chicken drops — but watch out, every 5th one is rotten. You've got 3 minutes, and it only gets faster.
        </p>

        <div className="stat-card">
          <span className="stat-card__label">High Score</span>
          <span className="stat-card__value">{highScore}</span>
        </div>

        <button ref={startRef} type="button" className="primary-button" onClick={handleStart}>
          Start Game
        </button>

        <p className="hint">Use ◀ ▶ arrow keys to move the basket &middot; Esc to pause</p>
      </div>
    </div>
  );
}
