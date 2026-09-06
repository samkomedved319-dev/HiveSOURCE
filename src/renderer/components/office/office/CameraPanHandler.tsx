import { useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useSceneStore } from '@/components/office/runtime/scene.store';

export function CameraPanHandler() {
  const { gl, camera, raycaster, scene } = useThree();
  const addPan = useSceneStore((s) => s.addPan);
  const dragging = useRef(false);
  const lastGroundPoint = useRef<THREE.Vector3 | null>(null);
  const groundPlane = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0));

  const intersectsPanBlockedObject = (e: PointerEvent): boolean => {
    const rect = gl.domElement.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(new THREE.Vector2(x, y), camera);
    const hits = raycaster.intersectObjects(scene.children, true);

    return hits.some((hit) => {
      let obj: THREE.Object3D | null = hit.object;
      while (obj) {
        if (obj.userData?.blockPan === true) return true;
        obj = obj.parent;
      }
      return false;
    });
  };

  const pointerToGround = (e: PointerEvent): THREE.Vector3 | null => {
    const rect = gl.domElement.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(new THREE.Vector2(x, y), camera);
    const hit = new THREE.Vector3();
    const ok = raycaster.ray.intersectPlane(groundPlane.current, hit);
    return ok ? hit : null;
  };

  useEffect(() => {
    const el = gl.domElement;

    const onDown = (e: PointerEvent) => {
      const leftDragOnBackground = e.button === 0 && !intersectsPanBlockedObject(e);
      if (e.button === 2 || (e.button === 0 && e.shiftKey) || leftDragOnBackground) {
        const ground = pointerToGround(e);
        if (!ground) return;
        dragging.current = true;
        lastGroundPoint.current = ground;
        e.preventDefault();
      }
    };

    const onMove = (e: PointerEvent) => {
      if (!dragging.current) return;
      const currentGround = pointerToGround(e);
      const prevGround = lastGroundPoint.current;
      if (!currentGround || !prevGround) return;

      const dx = prevGround.x - currentGround.x;
      const dz = prevGround.z - currentGround.z;
      addPan(dx, dz);
      lastGroundPoint.current = currentGround;
    };

    const onUp = () => {
      dragging.current = false;
      lastGroundPoint.current = null;
    };

    const onContext = (e: Event) => e.preventDefault();

    el.addEventListener('pointerdown', onDown);
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerup', onUp);
    el.addEventListener('pointerleave', onUp);
    el.addEventListener('contextmenu', onContext);

    return () => {
      el.removeEventListener('pointerdown', onDown);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerup', onUp);
      el.removeEventListener('pointerleave', onUp);
      el.removeEventListener('contextmenu', onContext);
    };
  }, [gl, addPan, camera, raycaster, scene]);

  return null;
}
