import React, { useRef, useState, useEffect } from "react";
import ReactPlayer from "react-player";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import {
  Slider,
  Typography,
  Button,
  TextField,
  Box,
  Modal,
} from "@mui/material";
import * as THREE from "three";
import "./styles.css";

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
  const mixer = useRef();
  const [dragging, setDragging] = useState(false);

  // Setup animations
  useEffect(() => {
    mixer.current = new THREE.AnimationMixer(scene);
    animations.forEach((clip) => mixer.current.clipAction(clip).play());
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
    setDragging(true); // Start dragging
    event.target.setPointerCapture(event.pointerId); // Capture pointer for consistent drag tracking
  };

  const handlePointerMove = (event) => {
    if (!dragging) return; // Only move if dragging
    event.stopPropagation();

    // Convert mouse movement to position update
    const deltaX = event.movementX * 0.01; // Adjust the multiplier to fine-tune sensitivity
    const deltaY = -event.movementY * 0.01; // Inverted Y-axis for dragging
    setPosition([position[0] + deltaX, position[1] + deltaY, position[2], 1]);
  };

  const handlePointerUp = (event) => {
    event.stopPropagation();
    setDragging(false); // Stop dragging
    event.target.releasePointerCapture(event.pointerId); // Release pointer capture
  };

  // Add a red border around the model
  useEffect(() => {
    if (ref.current) {
      const helper = new THREE.BoxHelper(scene, 0xff0000);
      ref.current.add(helper);
    }
  }, [scene]);

  return (
    <group
      ref={ref}
      position={position}
      scale={[scale, scale, scale]} // Apply scale uniformly
      rotation={rotation}
      onPointerDown={handlePointerDown} // Start dragging on pointer down
      onPointerMove={handlePointerMove} // Move while dragging
      onPointerUp={handlePointerUp} // Stop dragging on pointer up
    >
      <primitive object={scene} />
    </group>
  );
};

const App = () => {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const [position, setPosition] = useState([0, 0, 1]);
  const [scale, setScale] = useState(2);
  const [rotation, setRotation] = useState([0, 0, 0]);
  const [xRotationDegrees, setXRotationDegrees] = useState(0);
  const [yRotationDegrees, setYRotationDegrees] = useState(0);
  const [animationSpeed, setAnimationSpeed] = useState(1);
  const [isAnimationRunning, setIsAnimationRunning] = useState(true);
  const [animationStartTime, setAnimationStartTime] = useState(0);
  const [videoCurrentTime, setVideoCurrentTime] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(true);
  const modelRef = useRef(null);
  const [openModal, setOpenModal] = useState(false);

  const handleVideoProgress = (state) => {
    setVideoCurrentTime(state.playedSeconds);
  };

  const getBoundingBox = () => {
    if (!modelRef.current) return null;

    const box = new THREE.Box3().setFromObject(modelRef.current);
    const boundingBox = {
      min: { x: box.min.x, y: box.min.y, z: box.min.z },
      max: { x: box.max.x, y: box.max.y, z: box.max.z },
    };
    return boundingBox;
  };

  const downloadBoundingBox = () => {
    const boundingBox = getBoundingBox();
    if (!boundingBox) {
      console.error("Bounding box could not be calculated.");
      return;
    }

    const data = JSON.stringify(boundingBox, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "boundingBox.json";
    link.click();
  };


  return (
    <div className="App">
      <h1>3D Overlay on Video</h1>
      <div className="video-container" ref={containerRef}>
        <ReactPlayer
          ref={videoRef}
          url="src/assets/example.mp4"
          playing={isVideoPlaying}
          loop
          width="100%"
          height="100%"
          onProgress={handleVideoProgress}
        />
        <Canvas
          // camera={{ position: [0.4, 0, 5], fov: 75 }} // Camera 5 units away from origin
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "all",
          }}
        >
          <ambientLight intensity={1} />
          <directionalLight position={[10, 10, 10]} intensity={1.5} />
          <OrbitControls
            enablePan={false}
            enableZoom={false}
            enableDamping
            enableRotate={false}
          />
          <DraggableAnimatedModel
            url="src/assets/model.glb"
            position={position}
            setPosition={setPosition}
            scale={scale}
            rotation={rotation}
            animationSpeed={animationSpeed}
            isAnimationRunning={isAnimationRunning}
            animationStartTime={animationStartTime}
            videoCurrentTime={videoCurrentTime}
            reference={modelRef} // Attach ref to the model for bounding box calculations
          />
        </Canvas>
      </div>

      <Box>
        <Typography variant="h6">
          Video Time: {Math.floor(videoCurrentTime)}
        </Typography>
      </Box>

      {/* print bounding */}
      <Modal
        open={openModal}
        onClose={() => setOpenModal(false)}
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "rgba(0, 0, 0, 0.5)",
        }}
      >
        <Box>
          <Typography variant="h6">Bounding Box</Typography>
          <pre>{JSON.stringify(getBoundingBox(), null, 2)}</pre>
        </Box>
      </Modal>
      <Box
        className="controls-container"
        sx={{
          mt: 2,
          display: "flex",
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Box>
          <Typography variant="h6">Move Right/Left (X Axis)</Typography>
          <Slider
            value={position[0]}
            min={-10}
            max={10}
            step={0.1}
            onChange={(e, value) => {
              setPosition([value, position[1], position[2]]);
            }}
            sx={{ width: 200 }}
          />
        </Box>
        <Box>
          <Typography variant="h6">Move Up/Down (Y Axis)</Typography>
          <Slider
            value={position[1]}
            min={-10}
            max={10}
            step={0.1}
            onChange={(e, value) => {
              setPosition([position[0], value, position[2]]);
            }}
            sx={{ width: 200 }}
          />
        </Box>
        <Box>
          <Typography variant="h6">Scale</Typography>
          <Slider
            value={scale}
            min={0.1}
            max={10}
            step={0.1}
            onChange={(e, value) => setScale(value)}
            sx={{ width: 200 }}
          />
        </Box>
        <Box>
          <Typography variant="h6">X Rotation</Typography>
          <Slider
            value={xRotationDegrees}
            min={0}
            max={360}
            step={1}
            onChange={(e, value) => {
              setXRotationDegrees(value);
              setRotation([value * (Math.PI / 180), rotation[1], rotation[2]]);
            }}
            sx={{ width: 200 }}
          />
        </Box>
        <Box>
          <Typography variant="h6">Y Rotation</Typography>
          <Slider
            value={yRotationDegrees}
            min={0}
            max={360}
            step={1}
            onChange={(e, value) => {
              setYRotationDegrees(value);
              setRotation([rotation[0], value * (Math.PI / 180), rotation[2]]);
            }}
            sx={{ width: 200 }}
          />
        </Box>
        <Box>
          <Typography variant="h6">Z Rotation</Typography>
          <Slider
            value={rotation[2] * (180 / Math.PI)} // Convert radians to degrees
            min={0}
            max={360}
            step={1}
            onChange={(e, value) => {
              setRotation([
                rotation[0],
                rotation[1],
                value * (Math.PI / 180), // Convert degrees to radians
              ]);
            }}
            sx={{ width: 200 }}
          />
        </Box>
        <Box>
          <Typography variant="h6">Animation Speed</Typography>
          <Slider
            value={animationSpeed}
            min={0}
            max={5}
            step={0.1}
            onChange={(e, value) => setAnimationSpeed(value)
              
            }
            sx={{ width: 200 }}
          />
        </Box>
        <Box>
          <TextField
            label="Animation Start Time (seconds)"
            type="number"
            variant="outlined"
            value={animationStartTime}
            onChange={(e) => setAnimationStartTime(Number(e.target.value))}
            sx={{
              width: 200,
              backgroundColor: "#121212",
              borderRadius: 1,
              "& .MuiOutlinedInput-root": {
                "& fieldset": {
                  borderColor: "#424242",
                },
                "&:hover fieldset": {
                  borderColor: "#1E88E5",
                },
                "&.Mui-focused fieldset": {
                  borderColor: "#1E88E5",
                },
              },
              "& .MuiInputLabel-root": {
                color: "#B0BEC5",
              },
              "& .MuiInputBase-input": {
                color: "#FFFFFF",
              },
            }}
          />
        </Box>

        <Box sx={{ display: "flex", gap: 1, maxHeight: 40 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={downloadBoundingBox}
          >
            Download Bounding Box
          </Button>

          <Button
            size="small"
            variant="contained"
            color="primary"
            onClick={() => setIsVideoPlaying(!isVideoPlaying)}
          >
            {isVideoPlaying ? "Pause Video" : "Play Video"}
          </Button>

          <Button
            variant="contained"
            color="primary"
            onClick={() => setIsAnimationRunning(!isAnimationRunning)}
          >
            {isAnimationRunning ? "Stop Animation" : "Start Animation"}
          </Button>

          <Button
            variant="contained"
            color="primary"
            onClick={() => setOpenModal(true)}
          >
            Print Bounding Box
          </Button>
        </Box>
      </Box>
      {/* print here the Rect as json */}
    </div>
  );
};

export default App;
