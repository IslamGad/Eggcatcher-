import { useEffect, useRef, useState } from 'react';
import { TIME_WARNING_THRESHOLDS } from '../config/constants';
import { useGameStore } from '../state/gameStore';

/**
 * A visually-hidden aria-live region announcing catches, low-time warnings,
 * and status changes for screen reader users (e.g. TalkBack/VoiceOver on a
 * smart TV). The canvas itself is aria-hidden, so this is the only account
 * of what's happening for anyone not tracking it visually.
 */
export function ScreenReaderAnnouncer() {
  const score = useGameStore((s) => s.score);
  const status = useGameStore((s) => s.status);
  const timeRemaining = useGameStore((s) => s.timeRemaining);
  const runId = useGameStore((s) => s.runId);
  const [message, setMessage] = useState('');
  const announcedWarnings = useRef(new Set<number>());
  const prevScore = useRef(score);

  // Runs before the score-comparison effect below (same commit, declaration
  // order) so a fresh run's score reset to 0 isn't misread as a rotten-egg
  // penalty against the previous run's final score.
  useEffect(() => {
    prevScore.current = score;
  }, [runId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (status === 'playing') {
      if (score > prevScore.current) setMessage(`Egg caught! Score: ${score}`);
      else if (score < prevScore.current) setMessage(`Rotten egg! Score: ${score}`);
    }
    prevScore.current = score;
  }, [score, status]);

  useEffect(() => {
    if (status !== 'playing') {
      announcedWarnings.current.clear();
      return;
    }
    if ((TIME_WARNING_THRESHOLDS as readonly number[]).includes(timeRemaining) && !announcedWarnings.current.has(timeRemaining)) {
      announcedWarnings.current.add(timeRemaining);
      setMessage(`${timeRemaining} seconds remaining`);
    }
  }, [timeRemaining, status]);

  useEffect(() => {
    if (status === 'gameover') setMessage(`Time's up! Final score: ${score}.`);
    if (status === 'paused') setMessage('Game paused');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  return (
    <div className="visually-hidden" role="status" aria-live="polite">
      {message}
    </div>
  );
}
