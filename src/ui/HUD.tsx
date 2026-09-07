import { TIME_WARNING_THRESHOLDS } from '../config/constants';
import { useGameStore } from '../state/gameStore';
import { formatTime } from '../utils/format';

export function HUD() {
  const score = useGameStore((s) => s.score);
  const timeRemaining = useGameStore((s) => s.timeRemaining);
  const pauseGame = useGameStore((s) => s.pauseGame);
  const isLowTime = timeRemaining <= TIME_WARNING_THRESHOLDS[1];

  return (
    <div className="hud">
      <div className="hud__stat" aria-hidden="true">
        <span className="hud__label">Score</span>
        <span className="hud__value">{score}</span>
      </div>

      <div className={`hud__stat${isLowTime ? ' hud__stat--warning' : ''}`} aria-hidden="true">
        <span className="hud__label">Time</span>
        <span className="hud__value">{formatTime(timeRemaining)}</span>
      </div>

      <button type="button" className="icon-button" onClick={pauseGame} aria-label="Pause game">
        &#10074;&#10074;
      </button>
    </div>
  );
}
