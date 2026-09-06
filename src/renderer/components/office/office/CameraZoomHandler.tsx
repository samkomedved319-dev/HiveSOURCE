import { useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useSceneStore } from '@/components/office/runtime/scene.store';

const GROUND_PLANE = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

function wheelDelta(e: WheelEvent): number {
  const raw =
    e.deltaMode === WheelEvent.DOM_DELTA_LINE
      ? e.deltaY * 16
      : e.deltaMode === WheelEvent.DOM_DELTA_PAGE
        ? e.deltaY * 320
        : e.deltaY;
  return raw * 0.00035;
}

export function CameraZoomHandler() {
  const { gl, camera, raycaster } = useThree();
  const zoomAtWorldPoint = useSceneStore((s) => s.zoomAtWorldPoint);
  const setZoomLevel = useSceneStore((s) => s.setZoomLevel);
  const groundHit = useRef(new THREE.Vector3());

  useEffect(() => {
    const el = gl.domElement;

    const pointerToGround = (e: WheelEvent): THREE.Vector3 | null => {
      const rect = el.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return null;

      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(new THREE.Vector2(x, y), camera);
      return raycaster.ray.intersectPlane(GROUND_PLANE, groundHit.current) ? groundHit.current : null;
    };

    const onWheel = (e: WheelEvent) => {
      if ((e.target as HTMLElement | null)?.closest('.chat-panel')) return;

      e.preventDefault();

      const delta = wheelDelta(e);
      if (delta === 0) return;

      const ground = pointerToGround(e);
      if (ground) {
        zoomAtWorldPoint(delta, ground.x, ground.z);
        return;
      }

      const current = useSceneStore.getState().zoomLevel;
      setZoomLevel(current + delta);
    };

    el.addEventListener('wheel', onWheel, { passive: false });

    return () => {
      el.removeEventListener('wheel', onWheel);
    };
  }, [gl, camera, raycaster, zoomAtWorldPoint, setZoomLevel]);

  return null;
}
