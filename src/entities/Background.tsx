import { useThree } from '@react-three/fiber';
import { useEffect } from 'react';
import { useSpriteTexture } from './useSpriteTexture';

/** Same flat color as the Canvas's own clear color / the loading screen (see App.tsx, index.css) — used instead of the farm art on the menu, so there's no visual seam between "no image" states. */
const MENU_BACKGROUND_COLOR = '#8ecae6';

interface BackgroundProps {
  /** false paints MENU_BACKGROUND_COLOR instead of the farm art — used for the start menu, which doesn't need the scenery. The texture still loads either way (it's shared/preloaded for gameplay), this just skips *sampling* it. */
  showImage: boolean;
}

/**
 * Full-screen backdrop, "cover" fit: the plane always exactly fills the
 * viewport (no letterboxing), and the texture's own UV repeat/offset crop
 * whichever axis overflows so the art is never stretched. Recomputed only
 * when the viewport size actually changes, not per frame.
 */
export function Background({ showImage }: BackgroundProps) {
  const texture = useSpriteTexture('/backgrounds/farm.jpg');
  const viewportWidth = useThree((s) => s.viewport.width);
  const viewportHeight = useThree((s) => s.viewport.height);

  useEffect(() => {
    const image = texture.image as { width: number; height: number } | undefined;
    if (!image) return;

    const imageAspect = image.width / image.height;
    const viewAspect = viewportWidth / viewportHeight;

    if (viewAspect > imageAspect) {
      texture.repeat.set(1, imageAspect / viewAspect);
      texture.offset.set(0, (1 - imageAspect / viewAspect) / 2);
    } else {
      texture.repeat.set(viewAspect / imageAspect, 1);
      texture.offset.set((1 - viewAspect / imageAspect) / 2, 0);
    }
    texture.needsUpdate = true;
  }, [texture, viewportWidth, viewportHeight]);

  // Two separate meshes, toggled via `visible`, rather than swapping this
  // one material's `map` between a texture and null: the same technique
  // Chicken.tsx uses for its face swap — a material's shader is compiled
  // around whether `map` is present, and flipping that reactively on a
  // single shared material doesn't reliably force a recompile.
  return (
    <>
      <mesh position={[0, 0, -2]} visible={showImage}>
        <planeGeometry args={[viewportWidth, viewportHeight]} />
        <meshBasicMaterial map={texture} />
      </mesh>
      <mesh position={[0, 0, -2]} visible={!showImage}>
        <planeGeometry args={[viewportWidth, viewportHeight]} />
        <meshBasicMaterial color={MENU_BACKGROUND_COLOR} />
      </mesh>
    </>
  );
}
