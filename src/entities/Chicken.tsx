import { useFrame, useThree } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import {
  CHICKEN_BODY_RECT,
  CHICKEN_HAPPY_EYES_RECT_LOCAL,
  CHICKEN_HAPPY_FACE_NATIVE_SIZE,
  CHICKEN_WING_LEFT_PIVOT,
  CHICKEN_WING_LEFT_RECT,
  CHICKEN_WING_RIGHT_PIVOT,
  CHICKEN_WING_RIGHT_RECT,
  faceLocalRectToWorldLayout,
  faceWorldLayout,
  pixelPivotLocalOffset,
  pixelPointToWorldOffset,
  pixelRectToWorldLayout,
  type WorldSpriteLayout,
} from '../config/chickenArt';
import type { ChickenConfig } from '../config/chickens';
import { CHICKEN_EYELID_COLORS, isChickenActive } from '../config/chickens';
import {
  ANGRY_DURATION_SECONDS,
  ANGRY_SPEED_MULTIPLIER,
  ANGRY_TINT_COLOR,
  ANGRY_TINT_MAX_STRENGTH,
  ANGRY_TINT_TRANSITION_SECONDS,
  CHICKEN_BLINK_DURATION_SECONDS,
  CHICKEN_BLINK_MAX_INTERVAL_SECONDS,
  CHICKEN_BLINK_MIN_INTERVAL_SECONDS,
  CHICKEN_FLAP_ANGLE_DEGREES,
  CHICKEN_FLAP_CYCLE_SECONDS,
  CHICKEN_RAIL_MARGIN,
  CHICKEN_WANDER_RETARGET_MAX_SECONDS,
  CHICKEN_WANDER_RETARGET_MIN_SECONDS,
  CHICKEN_WANDER_SEEK_RATE,
  CHICKEN_WIDTH,
  CHICKEN_Y,
  CHICKEN_VERTICAL_BOB_AMPLITUDE_1,
  CHICKEN_VERTICAL_BOB_AMPLITUDE_2,
  CHICKEN_VERTICAL_BOB_FREQUENCY_1,
  CHICKEN_VERTICAL_BOB_FREQUENCY_2,
} from '../config/constants';
import {
  DEFAULT_IDLE_EXPRESSION,
  EXPRESSIONS,
  LOW_TIME_EXPRESSION_THRESHOLD_SECONDS,
  REACTION_EXPRESSION,
  REACTION_HOLD_SECONDS,
  type Expression,
  type ReactionEvent,
} from '../config/expressions';
import { useGameStore } from '../state/gameStore';
import { getDifficulty } from '../systems/difficulty';
import { getAngryPhase } from '../systems/chickenMood';
import { randomRange } from '../utils/random';
import { useSpriteTexture } from './useSpriteTexture';

export interface ChickenPosition {
  x: number;
  y: number;
}

interface ChickenProps {
  config: ChickenConfig;
  /** This chicken's slot in chickenPositionsRef — written every frame so EggManager can spawn eggs under its current position. */
  index: number;
  chickenPositionsRef: React.RefObject<ChickenPosition[]>;
  elapsedRef: React.RefObject<number>;
  /** Shared across all chickens — set by EggManager on catch/miss/rotten-catch/golden-drop, read here to pick the current face. */
  reactionEventRef: React.RefObject<ReactionEvent>;
}

/** Rotates a normally-static plane around a pivot other than its own center — used for the wings, which hinge from a fixed shoulder joint rather than spinning around their own middle. */
function pivotedPlaneGeometry(width: number, height: number, localPivot: { x: number; y: number }): THREE.PlaneGeometry {
  const geometry = new THREE.PlaneGeometry(width, height);
  geometry.translate(-localPivot.x, -localPivot.y, 0);
  return geometry;
}

/**
 * Renders one chicken as a body, two wings that rotate around their real
 * shoulder pivots, and one of six interchangeable face overlays (Happy,
 * Curious, Surprised, Angry, Sad, Determined). The idle default is a steady
 * Happy (with an eyelid overlay blinking over it periodically); a reaction
 * event briefly overrides it; and periodically the chicken enters an angry
 * phase (see systems/chickenMood) where the angry face and a red tint hold
 * for the whole phase, movement and egg fall speed pick up, and every drop
 * is rotten (that part is EggManager's concern, driven by the same pure
 * getAngryPhase function so the two never need to be kept in sync).
 *
 * The faces aren't cut from the body art — they're separate portraits sized
 * to a shared reference height (config/chickenArt.ts's faceWorldLayout) so
 * any of the six drops into the same spot at the same size. All six face
 * meshes are always mounted with only the active one visible: the same
 * technique already proven for the wing-pose swap this replaced — toggling
 * `.visible` on pre-declared meshes, rather than mutating a shared
 * material's texture at runtime.
 */
export function Chicken({ config, index, chickenPositionsRef, elapsedRef, reactionEventRef }: ChickenProps) {
  const bodyMeshRef = useRef<THREE.Mesh>(null);
  const wingLeftMeshRef = useRef<THREE.Mesh>(null);
  const wingRightMeshRef = useRef<THREE.Mesh>(null);
  const eyelidMeshRef = useRef<THREE.Mesh>(null);
  const faceMeshRefs = useRef<Partial<Record<Expression, THREE.Mesh | null>>>({});
  // Stable per-expression ref callbacks, created once. An inline arrow
  // function passed directly as `ref` gets a new identity every render,
  // which — because this component also re-renders once a second from the
  // timeRemaining subscription below — made React detach and reattach every
  // face ref each second. During that gap a mesh already marked visible
  // could miss its "hide" write for a frame, showing two faces at once.
  const faceRefCallbacks = useMemo(() => {
    const callbacks = {} as Record<Expression, (mesh: THREE.Mesh | null) => void>;
    for (const expression of EXPRESSIONS) {
      callbacks[expression] = (mesh: THREE.Mesh | null) => {
        faceMeshRefs.current[expression] = mesh;
      };
    }
    return callbacks;
  }, []);

  const suffix = config.colorVariant === 'default' ? '' : `-${config.colorVariant}`;
  const bodyTexture = useSpriteTexture(`/sprites/chicken2-body${suffix}.png`);
  const wingLeftTexture = useSpriteTexture(`/sprites/chicken2-wing-left${suffix}.png`);
  const wingRightTexture = useSpriteTexture(`/sprites/chicken2-wing-right${suffix}.png`);
  const happyTexture = useSpriteTexture(`/sprites/chicken2-face-happy${suffix}.png`);
  const curiousTexture = useSpriteTexture(`/sprites/chicken2-face-curious${suffix}.png`);
  const surprisedTexture = useSpriteTexture(`/sprites/chicken2-face-surprised${suffix}.png`);
  const angryTexture = useSpriteTexture(`/sprites/chicken2-face-angry${suffix}.png`);
  const sadTexture = useSpriteTexture(`/sprites/chicken2-face-sad${suffix}.png`);
  const determinedTexture = useSpriteTexture(`/sprites/chicken2-face-determined${suffix}.png`);

  const faceTextures = useMemo<Record<Expression, THREE.Texture>>(
    () => ({
      happy: happyTexture,
      curious: curiousTexture,
      surprised: surprisedTexture,
      angry: angryTexture,
      sad: sadTexture,
      determined: determinedTexture,
    }),
    [happyTexture, curiousTexture, surprisedTexture, angryTexture, sadTexture, determinedTexture],
  );

  const viewportWidth = useThree((s) => s.viewport.width);
  const status = useGameStore((s) => s.status);
  const timeRemaining = useGameStore((s) => s.timeRemaining);

  const bodyLayout = useMemo(() => pixelRectToWorldLayout(CHICKEN_BODY_RECT, CHICKEN_WIDTH), []);
  const wingLeftLayout = useMemo(() => pixelRectToWorldLayout(CHICKEN_WING_LEFT_RECT, CHICKEN_WIDTH), []);
  const wingRightLayout = useMemo(() => pixelRectToWorldLayout(CHICKEN_WING_RIGHT_RECT, CHICKEN_WIDTH), []);
  const eyelidLayout = useMemo(
    () => faceLocalRectToWorldLayout(CHICKEN_HAPPY_EYES_RECT_LOCAL, CHICKEN_HAPPY_FACE_NATIVE_SIZE.w, CHICKEN_HAPPY_FACE_NATIVE_SIZE.h, CHICKEN_WIDTH),
    [],
  );
  const eyelidColor = CHICKEN_EYELID_COLORS[config.colorVariant];

  const wingLeftPivotWorld = useMemo(() => pixelPointToWorldOffset(CHICKEN_WING_LEFT_PIVOT, CHICKEN_WIDTH), []);
  const wingRightPivotWorld = useMemo(() => pixelPointToWorldOffset(CHICKEN_WING_RIGHT_PIVOT, CHICKEN_WIDTH), []);

  const wingLeftGeometry = useMemo(() => {
    const localPivot = pixelPivotLocalOffset(CHICKEN_WING_LEFT_PIVOT, CHICKEN_WING_LEFT_RECT, CHICKEN_WIDTH);
    return pivotedPlaneGeometry(wingLeftLayout.width, wingLeftLayout.height, localPivot);
  }, [wingLeftLayout]);
  const wingRightGeometry = useMemo(() => {
    const localPivot = pixelPivotLocalOffset(CHICKEN_WING_RIGHT_PIVOT, CHICKEN_WING_RIGHT_RECT, CHICKEN_WIDTH);
    return pivotedPlaneGeometry(wingRightLayout.width, wingRightLayout.height, localPivot);
  }, [wingRightLayout]);

  const faceLayouts = useMemo(() => {
    const layouts = {} as Record<Expression, WorldSpriteLayout>;
    for (const expression of EXPRESSIONS) {
      const image = faceTextures[expression].image as { width: number; height: number };
      layouts[expression] = faceWorldLayout(image.width, image.height, CHICKEN_WIDTH);
    }
    return layouts;
  }, [faceTextures]);

  const targetXRef = useRef(randomRange(-1, 1));
  const retargetInRef = useRef(0);
  const flapTimerRef = useRef(0);
  const blinkTimerRef = useRef(-1);
  const blinkNextInRef = useRef(randomRange(CHICKEN_BLINK_MIN_INTERVAL_SECONDS, CHICKEN_BLINK_MAX_INTERVAL_SECONDS));

  const whiteColor = useMemo(() => new THREE.Color('#ffffff'), []);
  const angryColor = useMemo(() => new THREE.Color(ANGRY_TINT_COLOR), []);
  const tintScratch = useMemo(() => new THREE.Color(), []);

  const reducedMotion = useMemo(
    () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
    [],
  );

  useFrame((_, delta) => {
    const bodyMesh = bodyMeshRef.current;
    const wingLeftMesh = wingLeftMeshRef.current;
    const wingRightMesh = wingRightMeshRef.current;
    const eyelidMesh = eyelidMeshRef.current;
    if (!bodyMesh || !wingLeftMesh || !wingRightMesh || !eyelidMesh) return;

    const active = status === 'playing' && isChickenActive(config, elapsedRef.current);
    bodyMesh.visible = active;
    wingLeftMesh.visible = active;
    wingRightMesh.visible = active;
    eyelidMesh.visible = false;
    for (const expression of EXPRESSIONS) {
      const mesh = faceMeshRefs.current[expression];
      if (mesh) mesh.visible = false;
    }
    if (!active) return;

    const position = chickenPositionsRef.current[index];
    const amplitude = Math.max(0, viewportWidth / 2 - CHICKEN_WIDTH / 2 - CHICKEN_RAIL_MARGIN);
    const { chickenSpeedMultiplier } = getDifficulty(elapsedRef.current);
    const { isAngry, phaseElapsedSeconds } = getAngryPhase(config, elapsedRef.current);
    const speedMultiplier = chickenSpeedMultiplier * config.speedMultiplier * (isAngry ? ANGRY_SPEED_MULTIPLIER : 1);

    retargetInRef.current -= delta;
    if (retargetInRef.current <= 0) {
      targetXRef.current = randomRange(-amplitude, amplitude);
      retargetInRef.current = randomRange(CHICKEN_WANDER_RETARGET_MIN_SECONDS, CHICKEN_WANDER_RETARGET_MAX_SECONDS);
    }

    const seekAmount = 1 - Math.exp(-CHICKEN_WANDER_SEEK_RATE * speedMultiplier * delta);
    const x = THREE.MathUtils.lerp(position.x, targetXRef.current, seekAmount);

    const baseY = CHICKEN_Y + config.altitudeOffset;
    const verticalPhase = elapsedRef.current + config.phaseOffset;
    const bobY = reducedMotion
      ? 0
      : Math.sin(verticalPhase * CHICKEN_VERTICAL_BOB_FREQUENCY_1) * CHICKEN_VERTICAL_BOB_AMPLITUDE_1 +
        Math.sin(verticalPhase * CHICKEN_VERTICAL_BOB_FREQUENCY_2) * CHICKEN_VERTICAL_BOB_AMPLITUDE_2;
    const y = baseY + bobY;

    position.x = x;
    position.y = y;

    bodyMesh.position.set(x + bodyLayout.x, y + bodyLayout.y, 0);
    wingLeftMesh.position.set(x + wingLeftPivotWorld.x, y + wingLeftPivotWorld.y, 0.01);
    wingRightMesh.position.set(x + wingRightPivotWorld.x, y + wingRightPivotWorld.y, 0.01);

    // Wing flap: continuous rotation around each shoulder pivot — a real
    // flap arc through the rest pose, not a swap between two art frames.
    flapTimerRef.current += delta;
    const flapAngular = ((Math.PI * 2) / CHICKEN_FLAP_CYCLE_SECONDS) * speedMultiplier;
    const flapAngle = Math.sin(flapTimerRef.current * flapAngular) * THREE.MathUtils.degToRad(CHICKEN_FLAP_ANGLE_DEGREES);
    wingLeftMesh.rotation.z = -flapAngle;
    wingRightMesh.rotation.z = flapAngle;

    // Angry red tint: fades in at the start of the angry phase and fades
    // back out before it ends, rather than snapping — a slow, deliberate
    // transition rather than an instant color swap.
    let tintAmount = 0;
    if (isAngry) {
      const fadeIn = Math.min(1, phaseElapsedSeconds / ANGRY_TINT_TRANSITION_SECONDS);
      const remaining = ANGRY_DURATION_SECONDS - phaseElapsedSeconds;
      const fadeOut = Math.min(1, remaining / ANGRY_TINT_TRANSITION_SECONDS);
      tintAmount = Math.max(0, Math.min(fadeIn, fadeOut)) * ANGRY_TINT_MAX_STRENGTH;
    }
    tintScratch.copy(whiteColor).lerp(angryColor, tintAmount);
    (bodyMesh.material as THREE.MeshBasicMaterial).color.copy(tintScratch);
    (wingLeftMesh.material as THREE.MeshBasicMaterial).color.copy(tintScratch);
    (wingRightMesh.material as THREE.MeshBasicMaterial).color.copy(tintScratch);

    // Expression priority: an angry phase holds the angry face for its
    // whole duration (overriding everything else so it reads as a
    // sustained mood, not a blip); otherwise a fresh reaction event briefly
    // overrides the idle face; otherwise idle is a steady Happy, swapping to
    // a nervous Sad only in the last few seconds of the match.
    const reaction = reactionEventRef.current;
    const sinceReaction = elapsedRef.current - reaction.at;
    const idleExpression: Expression = timeRemaining <= LOW_TIME_EXPRESSION_THRESHOLD_SECONDS ? 'sad' : DEFAULT_IDLE_EXPRESSION;
    const currentExpression: Expression = isAngry
      ? 'angry'
      : sinceReaction < REACTION_HOLD_SECONDS
        ? REACTION_EXPRESSION[reaction.type]
        : idleExpression;

    const faceMesh = faceMeshRefs.current[currentExpression];
    if (faceMesh) {
      const layout = faceLayouts[currentExpression];
      faceMesh.position.set(x + layout.x, y + layout.y, 0.02);
      faceMesh.visible = true;
      (faceMesh.material as THREE.MeshBasicMaterial).color.copy(tintScratch);
    }

    // Eye blink: a brief eyelid over the Happy face's eyes, randomly re-timed after each one.
    if (currentExpression === 'happy') {
      blinkNextInRef.current -= delta;
      if (blinkNextInRef.current <= 0 && blinkTimerRef.current < 0) {
        blinkTimerRef.current = 0;
      }
      if (blinkTimerRef.current >= 0) {
        blinkTimerRef.current += delta;
        const t = blinkTimerRef.current / CHICKEN_BLINK_DURATION_SECONDS;
        if (t >= 1) {
          blinkTimerRef.current = -1;
          blinkNextInRef.current = randomRange(CHICKEN_BLINK_MIN_INTERVAL_SECONDS, CHICKEN_BLINK_MAX_INTERVAL_SECONDS);
        } else {
          const closedAmount = t < 0.5 ? t * 2 : (1 - t) * 2;
          eyelidMesh.position.set(x + eyelidLayout.x, y + eyelidLayout.y, 0.03);
          eyelidMesh.scale.y = closedAmount;
          eyelidMesh.visible = true;
        }
      }
    }
  });

  return (
    <>
      <mesh ref={bodyMeshRef}>
        <planeGeometry args={[bodyLayout.width, bodyLayout.height]} />
        <meshBasicMaterial map={bodyTexture} transparent alphaTest={0.05} />
      </mesh>
      <mesh ref={wingLeftMeshRef} geometry={wingLeftGeometry}>
        <meshBasicMaterial map={wingLeftTexture} transparent alphaTest={0.05} />
      </mesh>
      <mesh ref={wingRightMeshRef} geometry={wingRightGeometry}>
        <meshBasicMaterial map={wingRightTexture} transparent alphaTest={0.05} />
      </mesh>
      {EXPRESSIONS.map((expression) => (
        <mesh key={expression} ref={faceRefCallbacks[expression]} visible={false}>
          <planeGeometry args={[faceLayouts[expression].width, faceLayouts[expression].height]} />
          <meshBasicMaterial map={faceTextures[expression]} transparent alphaTest={0.05} />
        </mesh>
      ))}
      <mesh ref={eyelidMeshRef} visible={false}>
        <planeGeometry args={[eyelidLayout.width, eyelidLayout.height]} />
        <meshBasicMaterial color={eyelidColor} />
      </mesh>
    </>
  );
}
