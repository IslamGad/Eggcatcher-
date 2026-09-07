// World space is a fixed-height orthographic frustum; width follows the
// screen's aspect ratio. Keeping everything in world units (not pixels)
// means the layout scales cleanly from a phone browser to a 4K TV panel.
export const WORLD_HEIGHT = 10;

export const GAME_DURATION_SECONDS = 5 * 60;
export const EGG_SPAWN_INTERVAL_SECONDS = 2;

export const BASKET_WIDTH = 2.4;
export const BASKET_HEIGHT = BASKET_WIDTH * (640 / 600);
export const BASKET_SPEED = 7;
export const BASKET_Y = -WORLD_HEIGHT / 2 + BASKET_HEIGHT / 2 + 0.4;
export const BASKET_EDGE_MARGIN = 0.2;

export const CHICKEN_WIDTH = 2.1;
const CHICKEN_HEIGHT = CHICKEN_WIDTH * (263 / 238);
export const CHICKEN_RAIL_MARGIN = 0.6;
export const CHICKEN_Y = WORLD_HEIGHT / 2 - CHICKEN_HEIGHT / 2 - 0.3;

// Horizontal wandering: the chicken eases toward a randomly re-picked target
// x instead of following a fixed periodic path — a fixed path combined with
// a fixed egg-spawn interval would make eggs keep landing at the same few
// spots. Both the retarget cadence and the seek rate are randomized/varied
// enough that spawn positions don't fall into a repeating pattern.
export const CHICKEN_WANDER_RETARGET_MIN_SECONDS = 1.0;
export const CHICKEN_WANDER_RETARGET_MAX_SECONDS = 2.6;
export const CHICKEN_WANDER_SEEK_RATE = 1.8;

// Vertical "flying" bob: two summed sines (different frequencies, offset per
// chicken) read as a wandering flutter rather than a single robotic wave.
export const CHICKEN_VERTICAL_BOB_AMPLITUDE_1 = 0.35;
export const CHICKEN_VERTICAL_BOB_AMPLITUDE_2 = 0.15;
export const CHICKEN_VERTICAL_BOB_FREQUENCY_1 = 0.9;
export const CHICKEN_VERTICAL_BOB_FREQUENCY_2 = 2.3;

// Wing-flap: a real rigged rotation of the two wing pieces around their
// shoulder pivots (not a pose swap), one full up/down cycle per this many
// seconds at 1x speed — scaled faster as difficulty and the chicken's own
// speed multiplier ramp up.
export const CHICKEN_FLAP_CYCLE_SECONDS = 0.35;
export const CHICKEN_FLAP_ANGLE_DEGREES = 30;

// Eye blink: a brief, randomly-timed eyelid that covers the (idle/happy)
// face's eyes. The eyelid is a flat-colored plane, not a cropped art asset —
// its color is sampled from the cream/feather tone right next to the eyes on
// each color variant's happy face (see config/chickens.ts's
// CHICKEN_EYELID_COLORS), so it reads as skin rather than a visible patch.
export const CHICKEN_BLINK_DURATION_SECONDS = 0.14;
export const CHICKEN_BLINK_MIN_INTERVAL_SECONDS = 2;
export const CHICKEN_BLINK_MAX_INTERVAL_SECONDS = 5;

// Angry cycle: every ANGRY_CYCLE_NORMAL_SECONDS of normal behavior, a chicken
// flares up for ANGRY_DURATION_SECONDS — red-tinted (fading in/out, not an
// instant snap), moving and dropping eggs faster, and every drop during that
// window is rotten. Pure function of time-since-active, so both the visual
// (Chicken) and the spawn logic (EggManager) derive the same state
// independently — see systems/chickenMood.ts.
export const ANGRY_CYCLE_NORMAL_SECONDS = 10;
export const ANGRY_DURATION_SECONDS = 5;
export const ANGRY_SPEED_MULTIPLIER = 1.6;
export const ANGRY_EGG_FALL_MULTIPLIER = 1.8;
// How long the red tint takes to fade in when anger starts and fade back out
// before it ends — deliberately slower than a snap so it doesn't feel abrupt.
export const ANGRY_TINT_TRANSITION_SECONDS = 0.8;
export const ANGRY_TINT_COLOR = '#e63946';
export const ANGRY_TINT_MAX_STRENGTH = 0.75;

// Golden egg: a rare, high-value, fast-falling bonus drop on its own
// independent cadence (not part of the normal 1-in-N-drops rotten pattern).
export const GOLDEN_EGG_INTERVAL_SECONDS = 30;
export const GOLDEN_EGG_SCORE = 5;
export const GOLDEN_EGG_FALL_SPEED_MULTIPLIER = 3;
export const GOLDEN_EGG_POOL_SIZE = 3;

// Eggs spawn just below the chicken's current (possibly bobbing) position,
// not a fixed height.
export const EGG_SPAWN_OFFSET_Y = -(CHICKEN_HEIGHT / 2) + 0.15;

export const EGG_WIDTH = 0.62;
export const EGG_HEIGHT = EGG_WIDTH * (256 / 195);
export const EGG_FALL_SPEED = 2.2;
export const EGG_ROTATION_SPEED = 1.4;
export const EGG_POOL_SIZE = 18;

export const CATCH_X_TOLERANCE = 0.15;
export const CATCH_Y_TOLERANCE = 0.5;
export const SCORE_PER_CATCH = 1;

const GROUND_HEIGHT = WORLD_HEIGHT * 0.22;
export const GROUND_Y = -WORLD_HEIGHT / 2 + GROUND_HEIGHT / 2;

// Every Nth egg the chicken drops is rotten instead of a regular egg.
export const ROTTEN_EGG_EVERY_N_DROPS = 5;
export const ROTTEN_EGG_PENALTY = 3;
export const ROTTEN_EGG_POOL_SIZE = 6;
export const ROTTEN_EGG_WIDTH = 0.5;
export const ROTTEN_EGG_HEIGHT = ROTTEN_EGG_WIDTH * (280 / 221);

// Difficulty ramp: every full minute of active play, chicken speed and egg
// drop rate both grow by this factor (compounding).
export const DIFFICULTY_TIER_SECONDS = 60;
export const DIFFICULTY_GROWTH_PER_TIER = 1.2;

// Cracked-egg decal left behind by a missed egg. Sits on the grass and fades
// out after SPLAT_LIFETIME_SECONDS.
export const BROKEN_EGG_WIDTH = 1.1;
export const BROKEN_EGG_HEIGHT = BROKEN_EGG_WIDTH * (397 / 480);
export const BROKEN_EGG_Y = GROUND_Y + GROUND_HEIGHT / 2 - BROKEN_EGG_HEIGHT / 2 + 0.12;
export const GROUND_SPLAT_POOL_SIZE = 12;
export const SPLAT_LIFETIME_SECONDS = 10;
export const SPLAT_FADE_SECONDS = 0.6;

// Small eggs that pile up inside the basket as a visual "trophy" of catches.
export const BASKET_PILE_MAX = 10;
export const PILE_EGG_WIDTH = 0.42;
export const PILE_EGG_HEIGHT = PILE_EGG_WIDTH * (256 / 195);
export const CATCH_POP_DURATION_SECONDS = 0.2;

export const HIGH_SCORE_STORAGE_KEY = 'egg-catcher:high-score';

export const TIME_WARNING_THRESHOLDS = [60, 30, 10] as const;
