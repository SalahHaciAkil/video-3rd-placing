import React, { useRef, useState, useEffect } from "react";
import ReactPlayer from "react-player";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import { Slider, Typography, Button, TextField, Box } from "@mui/material";
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
}) => {
  const ref = useRef();
  const raycaster = useRef(new THREE.Raycaster());
  const plane = useRef(new THREE.Plane());
  const planeNormal = new THREE.Vector3();
  const intersectPoint = new THREE.Vector3();
  const [dragging, setDragging] = useState(false);

  const { scene, animations } = useGLTF(url);
  const mixer = useRef();

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

    // Set the movement plane's position and normal
    const object = ref.current;
    object.getWorldPosition(intersectPoint);
    planeNormal.copy(event.camera.getWorldDirection(new THREE.Vector3()));
    plane.current.setFromNormalAndCoplanarPoint(planeNormal, intersectPoint);

    setDragging(true);
  };

  const handlePointerMove = (event) => {
    if (!dragging) return;
    event.stopPropagation();

    // Calculate mouse position in normalized device coordinates
    const mouse = new THREE.Vector2(
      (event.clientX / window.innerWidth) * 2 - 1,
      -(event.clientY / window.innerHeight) * 2 + 1
    );

    // Update raycaster and find intersection with the plane
    raycaster.current.setFromCamera(mouse, event.camera);
    raycaster.current.ray.intersectPlane(plane.current, intersectPoint);

    // Update the model's position
    if (intersectPoint) {
      setPosition([intersectPoint.x, intersectPoint.y, intersectPoint.z]);
    }
  };

  const handlePointerUp = (event) => {
    event.stopPropagation();
    setDragging(false);
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
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      <primitive object={scene} />
    </group>
  );
};

const App = () => {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const [position, setPosition] = useState([0, 0, 0]);
  const [scale, setScale] = useState(2);
  const [rotation, setRotation] = useState([0, 0, 0]);
  const [xRotationDegrees, setXRotationDegrees] = useState(0);
  const [yRotationDegrees, setYRotationDegrees] = useState(0);
  const [animationSpeed, setAnimationSpeed] = useState(1);
  const [isAnimationRunning, setIsAnimationRunning] = useState(true);
  const [animationStartTime, setAnimationStartTime] = useState(0);
  const [videoCurrentTime, setVideoCurrentTime] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(true);

  const handleVideoProgress = (state) => {
    setVideoCurrentTime(state.playedSeconds);
  };

  const getBoundingBox = () => {
    const box = new THREE.Box3().setFromObject(ref.current);
    console.log("Bounding Box:", box);
    return box;
  };

  const downloadParameters = () => {
    const data = JSON.stringify({
      position,
      scale,
      rotation,
      animationStartTime,
    });
    const blob = new Blob([data], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "parameters.json";
    link.click();
  };

  useEffect(() => {
    const handleResize = () => {
      const container = containerRef.current;
      if (container) {
        const canvas = container.querySelector("canvas");
        if (canvas) {
          canvas.style.width = `${container.clientWidth}px`;
          canvas.style.height = `${container.clientHeight}px`;
        }
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <div className="App">
      <h1>3D Overlay on Video</h1>
      <div className="video-container" ref={containerRef}>
        <ReactPlayer
          ref={videoRef}
          url="src/assets/example.mp4"
          playing={isVideoPlaying}
          controls
          loop
          width="100%"
          height="100%"
          onProgress={handleVideoProgress}
        />
        <Canvas
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
          <OrbitControls enablePan={false} enableZoom={false} enableDamping />
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
          />
        </Canvas>
      </div>
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
          <Typography variant="h6">Animation Speed</Typography>
          <Slider
            value={animationSpeed}
            min={0}
            max={5}
            step={0.1}
            onChange={(e, value) => setAnimationSpeed(value)}
            sx={{ width: 200 }}
          />
        </Box>
        <Box>
          <Typography variant="h6">Move Right/Left (X Axis)</Typography>
          <Slider
            value={position[0]}
            min={-10}
            max={10}
            step={0.1}
            onChange={(e, value) => {
              console.log("value", value);
              setPosition([value, position[1], position[2]]);
            }}
            sx={{ width: 200 }}
          />
        </Box>
        <Box>
          <Typography variant="h6">Move Right/Left (X Axis)</Typography>
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
      </Box>
    </div>
  );
};

export default App;
