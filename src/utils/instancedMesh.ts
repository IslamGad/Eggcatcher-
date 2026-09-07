import * as THREE from 'three';

/** Parked far off-screen so a hidden (scale-0) instance can never be mistaken for a stray visible one. */
const HIDDEN_INSTANCE_Y = 9999;

/** Zeroes out instances [from, to) of an InstancedMesh — the "clear whatever this pool isn't using this frame" half of the pooled-rendering pattern shared by every entity in this game. */
export function hideInstances(mesh: THREE.InstancedMesh, dummy: THREE.Object3D, from: number, to: number): void {
  for (let i = from; i < to; i += 1) {
    dummy.position.set(0, HIDDEN_INSTANCE_Y, 0);
    dummy.scale.setScalar(0);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
  }
}
