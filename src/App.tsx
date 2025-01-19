import React, { useRef, useState, useEffect, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { Html, OrbitControls, useGLTF } from "@react-three/drei";
import ReactPlayer from "react-player";
import { Box, Slider, Button, Typography } from "@mui/material";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import Draggable from "react-draggable"; // Import react-draggable

//
// A helper component to load a GLB file.
//
function Model({ url, position, rotation, scale, animationSpeed }) {
  const { scene, animations } = useGLTF(url);

  const [mixer] = useState(() => new THREE.AnimationMixer());
  useEffect(() => {
    if (!animations?.length) return;
    const action = mixer.clipAction(animations[0], scene);
    action.play();
    return () => {
      action.stop();
    };
  }, [animations, scene, mixer]);

  // Update the mixer on every frame to control the animation speed
  useFrame((state, delta) => {
    mixer.update(delta * animationSpeed);
  });

  return (
    <group position={position} rotation={rotation} scale={scale}>
      <primitive object={scene} />
    </group>
  );
}

export default function App() {
  const [videoUrl, setVideoUrl] = useState("/src/assets/example.mp4");
  const [modelUrl, setModelUrl] = useState("/src/assets/Pathfinder_1k.glb");

  // Transform states
  const [modelPosition, setModelPosition] = useState([0, 0, 0]);
  const [modelRotation, setModelRotation] = useState([0, 0, 0]);
  const [modelScale, setModelScale] = useState(1);
  const [animationSpeed, setAnimationSpeed] = useState(1);

  const videoRef = useRef(null);
  const [startTime, setStartTime] = useState(0);

  // For bounding rect
  const [boundingRect, setBoundingRect] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });

  // Refs to measure the size of the canvas for bounding box
  const canvasWrapperRef = useRef(null);

  // A function to handle bounding rect calculation
  const updateBoundingRect = () => {
    if (!canvasWrapperRef.current) return;

    const rect = canvasWrapperRef.current.getBoundingClientRect();
    const width = 150;
    const height = 250;
    const x = rect.width / 2 - width / 2;
    const y = rect.height / 2 - height / 2;
    console.log("ket qua", x, y, width, height);

    setBoundingRect({ x, y, width, height });
  };

  useEffect(() => {
    updateBoundingRect();
  }, [modelPosition, modelRotation, modelScale]);

  const handleDownloadParams = () => {
    const data = JSON.stringify(boundingRect, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bounding-rect-params.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSetStartTime = () => {
    if (!videoRef.current) return;
    videoRef.current.seekTo(parseFloat(startTime), "seconds");
  };

  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: 1200,
        margin: "0 auto",
        position: "relative",
      }}
    >
      {/* VIDEO */}
      <Box sx={{ position: "relative", width: "100%", aspectRatio: "16/9" }}>
        <ReactPlayer
          ref={videoRef}
          url={videoUrl}
          controls
          width="100%"
          height="100%"
        />

        {/* 3D CANVAS OVERLAY */}
        <Box
          ref={canvasWrapperRef}
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "calc(100% - 60px)", // 40px for video controls
            pointerEvents: "none", // so user can still interact with video controls
          }}
        >
          <Canvas camera={{ position: [0, 0, 5], fov: 30 }}>
            <Suspense fallback={null}>
              <ambientLight intensity={0.8} />
              <group>
                <Model
                  url={modelUrl}
                  position={modelPosition}
                  rotation={modelRotation}
                  scale={modelScale}
                  animationSpeed={animationSpeed}
                />
              </group>
              <OrbitControls
                enablePan={false}
                enableRotate={false}
                enableZoom={false}
              />{" "}
            </Suspense>
          </Canvas>

          {/* RED BOX overlay for bounding rect */}
          <div
            style={{
              position: "absolute",
              border: "2px solid red",
              boxSizing: "border-box",
              left: boundingRect.x,
              top: boundingRect.y,
              width: boundingRect.width,
              height: boundingRect.height,
              // should be updated with the sclae of the model
              transform: `scale(${modelScale})`,
              pointerEvents: "none",
            }}
          />
        </Box>
      </Box>

      {/* CONTROLS */}
      <Box
        sx={{ marginTop: 2, display: "flex", flexDirection: "column", gap: 2 }}
      >
        {/* Rotation */}
        <Box>
          <Typography variant="subtitle1">Rotation Y</Typography>
          <Slider
            min={0}
            max={360}
            step={1}
            value={modelRotation[1] * (180 / Math.PI)}
            onChange={(_, val) => {
              const degrees = Array.isArray(val) ? val[0] : val;
              const radians = degrees * (Math.PI / 180);
              setModelRotation([modelRotation[0], radians, modelRotation[2]]);
            }}
          />
        </Box>

        {/* Scale */}
        <Box>
          <Typography variant="subtitle1">Scale</Typography>
          <Slider
            min={0.1}
            max={5}
            step={0.1}
            value={modelScale}
            onChange={(_, val) => {
              const scaleVal = Array.isArray(val) ? val[0] : val;
              setModelScale(scaleVal);
            }}
          />
        </Box>

        {/* Animation Speed */}
        <Box>
          <Typography variant="subtitle1">Animation Speed</Typography>
          <Slider
            min={0.1}
            max={3}
            step={0.1}
            value={animationSpeed}
            onChange={(_, val) => {
              const speed = Array.isArray(val) ? val[0] : val;
              setAnimationSpeed(speed);
            }}
          />
        </Box>

        {/* Start Time */}
        <Box>
          <Typography variant="subtitle1">
            Animation Start Time (seconds)
          </Typography>
          <input
            type="number"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
          />
          <Button variant="contained" onClick={handleSetStartTime}>
            Seek Video
          </Button>
        </Box>

        {/* Download bounding rect */}
        <Button variant="contained" onClick={handleDownloadParams}>
          Download Bounding Rect
        </Button>

        {/* Display boundingRect on screen */}
        <Box
          sx={{ background: "#f0f0f0", padding: 2, fontFamily: "monospace" }}
        >
          {JSON.stringify(boundingRect, null, 2)}
        </Box>
      </Box>
    </Box>
  );
}
