import React, { useRef, useState, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
const DraggableAnimatedModel = ({
  url,
  position,
  setPosition,
  scale,
  rotation,
  animationSpeed,
  isAnimationRunning,
  animationStartTime,
  videoCurrentTime,
  reference,
}) => {
  const ref = reference;
  const { scene, animations } = useGLTF(url);
  const mixer = useRef(null);
  const [dragging, setDragging] = useState(false);

  // Recenter model geometry to ensure pivot is centered
  useEffect(() => {
    if (scene) {
      const box = new THREE.Box3().setFromObject(scene);
      const center = box.getCenter(new THREE.Vector3());
      // Shift the scene so that its center is at the origin
      scene.position.sub(center);
    }
  }, [scene]);

  // Setup animations
  useEffect(() => {
    if (!scene) return;
    mixer.current = new THREE.AnimationMixer(scene);
    animations.forEach((clip) => mixer.current.clipAction(clip).play());

    return () => {
      animations.forEach((clip) => {
        const action = mixer.current.clipAction(clip);
        action.stop();
        action.reset();
      });
      mixer.current?.stopAllAction();
    };
  }, [scene, animations]);

  // Update animation speed and only run after the start time
  useFrame((state, delta) => {
    if (
      mixer.current &&
      isAnimationRunning &&
      videoCurrentTime >= animationStartTime
    ) {
      mixer.current.update(delta * animationSpeed);
    }
  });

  const handlePointerDown = (event) => {
    event.stopPropagation();
    setDragging(true);
    event.target.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event) => {
    if (!dragging) return;
    event.stopPropagation();
    const deltaX = event.movementX * 0.01;
    const deltaY = -event.movementY * 0.01;
    setPosition([position[0] + deltaX, position[1] + deltaY, position[2]]);
  };

  const handlePointerUp = (event) => {
    event.stopPropagation();
    setDragging(false);
    event.target.releasePointerCapture(event.pointerId);
  };

  useEffect(() => {
    if (ref.current && scene) {
      const helper = new THREE.BoxHelper(scene, 0xff0000);
      ref.current.add(helper);
    }
  }, [scene, ref]);

  return (
    <group
      ref={ref}
      position={position}
      scale={[scale, scale, scale]}
      rotation={rotation} // Keep rotation unchanged
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      <primitive object={scene} />
    </group>
  );
};

export default DraggableAnimatedModel;
