import { useAutoFocus } from '../hooks/useAutoFocus';
import { useGameStore } from '../state/gameStore';
import { primeAudio } from '../systems/sfx';

export function GameOverScreen() {
  const score = useGameStore((s) => s.score);
  const highScore = useGameStore((s) => s.highScore);
  const startGame = useGameStore((s) => s.startGame);
  const returnToMenu = useGameStore((s) => s.returnToMenu);
  const isNewHighScore = score > 0 && score >= highScore;
  const playAgainRef = useAutoFocus<HTMLButtonElement>();

  const handlePlayAgain = () => {
    primeAudio();
    startGame();
  };

  return (
    <div className="overlay">
      <div className="panel" role="dialog" aria-labelledby="gameover-title">
        <h2 id="gameover-title">Time's Up!</h2>
        {isNewHighScore && <p className="badge">New High Score!</p>}

        <div className="stat-card">
          <span className="stat-card__label">Score</span>
          <span className="stat-card__value">{score}</span>
        </div>
        <div className="stat-card stat-card--secondary">
          <span className="stat-card__label">Best</span>
          <span className="stat-card__value">{highScore}</span>
        </div>

        <button ref={playAgainRef} type="button" className="primary-button" onClick={handlePlayAgain}>
          Play Again
        </button>
        <button type="button" className="secondary-button" onClick={returnToMenu}>
          Main Menu
        </button>
      </div>
    </div>
  );
}
