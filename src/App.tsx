import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';
import { AssetPreloader } from './entities/AssetPreloader';
import { useExitOnRemoteBack } from './hooks/useExitOnRemoteBack';
import { useGlobalShortcuts } from './hooks/useGlobalShortcuts';
import { GameScene } from './scenes/GameScene';
import { useGameStore } from './state/gameStore';
import { GameOverScreen } from './ui/GameOverScreen';
import { HUD } from './ui/HUD';
import { LoadingScreen } from './ui/LoadingScreen';
import { PauseOverlay } from './ui/PauseOverlay';
import { PerfMonitor } from './ui/PerfMonitor';
import { ScreenReaderAnnouncer } from './ui/ScreenReaderAnnouncer';
import { StartMenu } from './ui/StartMenu';

export default function App() {
  const status = useGameStore((s) => s.status);
  useGlobalShortcuts();
  useExitOnRemoteBack();

  return (
    <div className="app-root">
      {/* <Canvas> itself must never sit inside a Suspense boundary: if that
          boundary ever re-suspends, React unmounts everything inside it —
          including the Canvas — which tears down and recreates the WebGL
          context. On constrained GPUs (TV hardware included) that shows up
          as a dead, permanently blank canvas ("Context Lost") rather than a
          brief flicker. So the Canvas mounts unconditionally, exactly once,
          and only *its own contents* (GameScene) sit behind a Suspense —
          the same shape the original code used before AssetPreloader
          existed. */}
      <div className="canvas-layer" aria-hidden="true">
        <Canvas
          orthographic
          dpr={[1, 1.5]}
          gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
          // Idle screens (menu / paused / game over) render a single frame on
          // demand instead of a continuous 60fps loop — real GPU/CPU savings
          // on TV hardware for however long the player lingers on a menu.
          frameloop={status === 'playing' ? 'always' : 'demand'}
        >
          <color attach="background" args={['#8ecae6']} />
          <Suspense fallback={null}>
            <GameScene />
          </Suspense>
        </Canvas>
      </div>

      {/* Separate Suspense boundary for the UI layer: the menu doesn't
          appear until AssetPreloader resolves, so Start Game is never
          clickable before every texture is already loaded and cached —
          but this one never touches the Canvas above. */}
      <Suspense fallback={<LoadingScreen />}>
        <AssetPreloader>
          <div className="ui-layer">
            {status === 'menu' && <StartMenu />}
            {status === 'playing' && <HUD />}
            {status === 'paused' && (
              <>
                <HUD />
                <PauseOverlay />
              </>
            )}
            {status === 'gameover' && <GameOverScreen />}
          </div>
        </AssetPreloader>
      </Suspense>

      <PerfMonitor />
      <ScreenReaderAnnouncer />
    </div>
  );
}
