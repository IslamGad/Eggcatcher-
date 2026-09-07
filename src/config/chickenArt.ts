// Pixel measurements taken from the source illustration before it was split
// into independently-animatable layers (body, two wings) plus a set of
// interchangeable face/expression overlays. Keeping the raw rects/pivots
// here — rather than baking pre-computed world-unit numbers into
// constants.ts — means re-cropping an asset only requires updating one
// rectangle, not re-deriving downstream math by hand.
const CHICKEN_ART_WIDTH = 238;
const CHICKEN_ART_HEIGHT = 263;

interface PixelRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface PixelPoint {
  x: number;
  y: number;
}

export const CHICKEN_BODY_RECT: PixelRect = { x: 0, y: 0, w: 238, h: 263 };

export const CHICKEN_WING_LEFT_RECT: PixelRect = { x: 0, y: 91, w: 103, h: 115 };
export const CHICKEN_WING_LEFT_PIVOT: PixelPoint = { x: 96, y: 138 };

export const CHICKEN_WING_RIGHT_RECT: PixelRect = { x: 151, y: 96, w: 87, h: 109 };
export const CHICKEN_WING_RIGHT_PIVOT: PixelPoint = { x: 156, y: 138 };

// The face/expression overlays aren't cut from the body art, so there's no
// single shared rect to derive their placement from — each expression PNG
// has its own native aspect ratio and gets fit to this shared height,
// centered here, so swapping expressions never stretches or jumps position.
const CHICKEN_FACE_CENTER_X = 119;
const CHICKEN_FACE_TOP_Y = -6;
const CHICKEN_FACE_HEIGHT = 215;

// The blink eyelid covers both eyes on the "happy" face specifically (the
// idle default). Measured directly in that source PNG's own 210x234 pixel
// space, not the shared 238x263 character canvas.
export const CHICKEN_HAPPY_FACE_NATIVE_SIZE = { w: 210, h: 234 };
export const CHICKEN_HAPPY_EYES_RECT_LOCAL: PixelRect = { x: 5, y: 105, w: 100, h: 50 };

export interface WorldSpriteLayout {
  width: number;
  height: number;
  /** Mesh position offset from the character's own center, in world units. */
  x: number;
  y: number;
}

/** Converts a piece's source-art bounding rect into a plane size + centered position offset, given the world-unit width the full original canvas should map to. */
export function pixelRectToWorldLayout(rect: PixelRect, worldWidth: number): WorldSpriteLayout {
  const scale = worldWidth / CHICKEN_ART_WIDTH;
  const centerPxX = rect.x + rect.w / 2 - CHICKEN_ART_WIDTH / 2;
  const centerPxY = rect.y + rect.h / 2 - CHICKEN_ART_HEIGHT / 2;
  return {
    width: rect.w * scale,
    height: rect.h * scale,
    x: centerPxX * scale,
    // Image Y grows downward, world Y grows upward.
    y: -centerPxY * scale,
  };
}

/** A pivot's offset from the character's own center, in world units — used to position a rotating piece's mesh so its pivot (not its plane center) lands at the right spot. */
export function pixelPointToWorldOffset(point: PixelPoint, worldWidth: number): { x: number; y: number } {
  const scale = worldWidth / CHICKEN_ART_WIDTH;
  return {
    x: (point.x - CHICKEN_ART_WIDTH / 2) * scale,
    y: -(point.y - CHICKEN_ART_HEIGHT / 2) * scale,
  };
}

/** A pivot's offset from ITS OWN piece's plane center, in world units — fed to geometry.translate() so the plane's local origin becomes the pivot instead of its center. */
export function pixelPivotLocalOffset(pivot: PixelPoint, rect: PixelRect, worldWidth: number): { x: number; y: number } {
  const scale = worldWidth / CHICKEN_ART_WIDTH;
  const localPxX = pivot.x - rect.x - rect.w / 2;
  const localPxY = pivot.y - rect.y - rect.h / 2;
  return { x: localPxX * scale, y: -localPxY * scale };
}

/**
 * Fits a face/expression image (given its native pixel size) to the shared
 * CHICKEN_FACE_HEIGHT, preserving its own aspect ratio, centered on
 * CHICKEN_FACE_CENTER_X with its top at CHICKEN_FACE_TOP_Y — so every
 * expression lands in the same place at the same visual size regardless of
 * how tightly each was originally cropped.
 */
export function faceWorldLayout(nativeWidth: number, nativeHeight: number, worldWidth: number): WorldSpriteLayout {
  const scale = worldWidth / CHICKEN_ART_WIDTH;
  const heightPx = CHICKEN_FACE_HEIGHT;
  const widthPx = heightPx * (nativeWidth / nativeHeight);
  const centerYPx = CHICKEN_FACE_TOP_Y + heightPx / 2;
  return {
    width: widthPx * scale,
    height: heightPx * scale,
    x: (CHICKEN_FACE_CENTER_X - CHICKEN_ART_WIDTH / 2) * scale,
    y: -(centerYPx - CHICKEN_ART_HEIGHT / 2) * scale,
  };
}

/**
 * Maps a rect defined in a face image's OWN native pixel space (e.g. the eye
 * band on the happy face) into world size/position — riding along with
 * wherever faceWorldLayout placed that face, so the eyelid overlay tracks
 * correctly even if CHICKEN_FACE_HEIGHT or CHICKEN_WIDTH ever change.
 */
export function faceLocalRectToWorldLayout(
  rectLocal: PixelRect,
  faceNativeWidth: number,
  faceNativeHeight: number,
  worldWidth: number,
): WorldSpriteLayout {
  const faceLayout = faceWorldLayout(faceNativeWidth, faceNativeHeight, worldWidth);
  const scaleX = faceLayout.width / faceNativeWidth;
  const scaleY = faceLayout.height / faceNativeHeight;
  const faceTopLeftWorldX = faceLayout.x - faceLayout.width / 2;
  const faceTopWorldY = faceLayout.y + faceLayout.height / 2;
  return {
    width: rectLocal.w * scaleX,
    height: rectLocal.h * scaleY,
    x: faceTopLeftWorldX + (rectLocal.x + rectLocal.w / 2) * scaleX,
    y: faceTopWorldY - (rectLocal.y + rectLocal.h / 2) * scaleY,
  };
}
