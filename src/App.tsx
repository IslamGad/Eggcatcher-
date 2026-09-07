import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';
import { useGlobalShortcuts } from './hooks/useGlobalShortcuts';
import { GameScene } from './scenes/GameScene';
import { useGameStore } from './state/gameStore';
import { GameOverScreen } from './ui/GameOverScreen';
import { HUD } from './ui/HUD';
import { PauseOverlay } from './ui/PauseOverlay';
import { PerfMonitor } from './ui/PerfMonitor';
import { ScreenReaderAnnouncer } from './ui/ScreenReaderAnnouncer';
import { StartMenu } from './ui/StartMenu';

export default function App() {
  const status = useGameStore((s) => s.status);
  useGlobalShortcuts();

  return (
    <div className="app-root">
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

      <PerfMonitor />
      <ScreenReaderAnnouncer />
    </div>
  );
}
