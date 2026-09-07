export type Expression = 'happy' | 'curious' | 'surprised' | 'angry' | 'sad' | 'determined';

export const EXPRESSIONS: Expression[] = ['happy', 'curious', 'surprised', 'angry', 'sad', 'determined'];

type ReactionEventType = 'catch' | 'rottenCatch' | 'miss' | 'goldenDrop';

export interface ReactionEvent {
  type: ReactionEventType;
  /** Elapsed play seconds (GameScene's elapsedRef) when this fired. */
  at: number;
}

/** What a chicken's face shows right after each kind of game event. */
export const REACTION_EXPRESSION: Record<ReactionEventType, Expression> = {
  catch: 'happy',
  rottenCatch: 'angry',
  miss: 'surprised',
  goldenDrop: 'happy',
};

/** How long a triggered reaction expression holds before falling back to idle. */
export const REACTION_HOLD_SECONDS = 0.7;

/**
 * Idle default: a steady smile (with a blink overlay for life), rather than
 * cycling between expressions — an earlier version alternated idle faces
 * every few seconds and that read as switching moods too fast.
 */
export const DEFAULT_IDLE_EXPRESSION: Expression = 'happy';

/** Below this many seconds left, the idle expression switches to a nervous "sad" instead. */
export const LOW_TIME_EXPRESSION_THRESHOLD_SECONDS = 10;
