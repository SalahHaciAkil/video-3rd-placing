import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";

function BoundingBoxCoordinates({ modelRef, containerRef, setCorners }) {
  const { camera } = useThree();

  useEffect(() => {
    if (!modelRef.current || !containerRef.current) return;

    // Compute the bounding box of the model
    const box = new THREE.Box3().setFromObject(modelRef.current);
    const { min, max } = box;

    // Define the 8 corners of the bounding box in 3D space
    const vertices = [
      new THREE.Vector3(min.x, min.y, min.z),
      new THREE.Vector3(min.x, min.y, max.z),
      new THREE.Vector3(min.x, max.y, min.z),
      new THREE.Vector3(min.x, max.y, max.z),
      new THREE.Vector3(max.x, min.y, min.z),
      new THREE.Vector3(max.x, min.y, max.z),
      new THREE.Vector3(max.x, max.y, min.z),
      new THREE.Vector3(max.x, max.y, max.z),
    ];

    // Project each vertex to 2D screen space relative to the container
    const projected = vertices.map((v) => {
      const vClone = v.clone();
      vClone.project(camera);
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      return {
        x: ((vClone.x + 1) / 2) * width,
        y: ((-vClone.y + 1) / 2) * height,
      };
    });

    setCorners(projected);
  }, [camera, modelRef, containerRef, setCorners]);

  return null;
}

export default BoundingBoxCoordinates;
