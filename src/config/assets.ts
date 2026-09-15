/**
 * Every texture the game can possibly show, in one place. Every chicken
 * color variant reuses this same art (see config/chickens.ts's
 * CHICKEN_TINT_COLORS) rather than adding its own files here, so this list
 * — and the download it drives — doesn't grow with the chicken roster.
 *
 * AssetPreloader loads all of these up front, before the menu appears, so
 * nothing pops in or stalls mid-match: by the time the player can press
 * Start, every texture used during play is already decoded and cached.
 */
export const PRELOAD_TEXTURE_URLS: readonly string[] = [
  '/backgrounds/farm.jpg',
  '/sprites/basket.png',
  '/sprites/egg.png',
  '/sprites/egg-rotten.png',
  '/sprites/egg-golden.png',
  '/sprites/egg-broken.png',
  '/sprites/chicken2-body.png',
  '/sprites/chicken2-wing-left.png',
  '/sprites/chicken2-wing-right.png',
  '/sprites/chicken2-face-happy.png',
  '/sprites/chicken2-face-curious.png',
  '/sprites/chicken2-face-surprised.png',
  '/sprites/chicken2-face-angry.png',
  '/sprites/chicken2-face-sad.png',
  '/sprites/chicken2-face-determined.png',
];
