import React, { useRef, useState, useEffect, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { Html, OrbitControls, useGLTF } from "@react-three/drei";
import ReactPlayer from "react-player";
import { Box, Slider, Button, Typography } from "@mui/material";
import videoUrll from "./assets/example.mp4";
//
// A helper component to load a GLB file.
// We'll use the @react-three/drei 'useGLTF' hook.
//
function Model({ url, position, rotation, scale, animationSpeed }) {
  const { scene, animations } = useGLTF(url);

  // If there's animation, we can use a mixer here
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
  useEffect(() => {
    let lastTime = 0;
    function updateMixer(state, delta) {
      // Multiply delta by animationSpeed for speed control
      mixer.update(delta * animationSpeed);
      lastTime += delta;
    }
    return state.subscribe(({ delta }) => updateMixer(state, delta));
  }, [mixer, animationSpeed]);

  return (
    <group position={position} rotation={rotation} scale={scale}>
      <primitive object={scene} />
    </group>
  );
}

const assetsVideoUrl = "./assets/example.mp4";
const robotUrl = "./assets/Pathfinder_1k.glb";

export default function App() {
  const [videoUrl, setVideoUrl] = useState(assetsVideoUrl); // your mp4
  const [modelUrl, setModelUrl] = useState(robotUrl); // your glb

  // Transform states
  const [modelPosition, setModelPosition] = useState([0, 0, 0]);
  const [modelRotation, setModelRotation] = useState([0, 0, 0]);
  const [modelScale, setModelScale] = useState(1);
  const [animationSpeed, setAnimationSpeed] = useState(1);

  // Video player state
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
  // For real usage, you'd measure the actual 3D object in screen space.
  // This example just draws a simple rectangle that "follows" the model.
  const updateBoundingRect = () => {
    if (!canvasWrapperRef.current) return;

    console.log("Updating bounding rect");

    // The "bounding box" here can be computed from the model's projected corners
    // But as a quick hack, let's just imagine a box in the center.

    // For example, let's place the bounding box around the center (0,0) in 3D
    // which might project to the center of the canvas.
    // A real approach would:
    //   1) Use the object's boundingBox in 3D
    //   2) Project corners with camera, get 2D x,y
    //   3) Then find minX, minY, maxX, maxY
    // but here we’ll keep it super-simple for demonstration.

    const rect = canvasWrapperRef.current.getBoundingClientRect();

    // We'll just define a rectangle in the middle:
    const width = 150;
    const height = 250;
    const x = rect.width / 2 - width / 2;
    const y = rect.height / 2 - height / 2;

    console.log({ x, y, width, height });

    setBoundingRect({ x, y, width, height });
  };

  useEffect(() => {
    // Example: update bounding rect whenever the transform changes
    updateBoundingRect();
  }, [modelPosition, modelRotation, modelScale]);

  // Download bounding rect JSON
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

  // Example of controlling the video start time
  // This sets the player time to "startTime" when user clicks "Set Start Time"
  const handleSetStartTime = () => {
    if (!videoRef.current) return;
    // videoRef.current.seekTo(parseFloat(startTime), "seconds");
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
          url={videoUrll}
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
            height: "100%",
            pointerEvents: "none", // so user can still interact with video controls
          }}
        >
          {/* <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
            <Suspense fallback={null}>
              <ambientLight intensity={0.8} />
              <Model
                url={modelUrl}
                position={modelPosition}
                rotation={modelRotation}
                scale={modelScale}
                animationSpeed={animationSpeed}
              />
              <OrbitControls enablePan={false} enableRotate={false} />
            </Suspense>
          </Canvas> */}

          {/* RED BOX overlay for bounding rect. Just a div absolutely positioned. */}
          <Box
            sx={{
              position: "absolute",
              border: "2px solid red",
              boxSizing: "border-box",
              left: boundingRect.x,
              top: boundingRect.y,
              width: boundingRect.width,
              height: boundingRect.height,
              pointerEvents: "none",
            }}
          />
        </Box>
      </Box>

      {/* CONTROLS */}
      <Box
        sx={{ marginTop: 2, display: "flex", flexDirection: "column", gap: 2 }}
      >
        {/* Rotation (example: controlling Y rotation in degrees) */}
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
