import { useThree } from '@react-three/fiber';
import { useEffect } from 'react';
import { useSpriteTexture } from './useSpriteTexture';

/**
 * Full-screen farm backdrop, "cover" fit: the plane always exactly fills the
 * viewport (no letterboxing), and the texture's own UV repeat/offset crop
 * whichever axis overflows so the art is never stretched. Recomputed only
 * when the viewport size actually changes, not per frame.
 */
export function Background() {
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

  return (
    <mesh position={[0, 0, -2]}>
      <planeGeometry args={[viewportWidth, viewportHeight]} />
      <meshBasicMaterial map={texture} />
    </mesh>
  );
}
