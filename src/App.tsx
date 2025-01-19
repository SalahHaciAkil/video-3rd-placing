import ReactPlayer from "react-player";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import {
  Slider,
  Typography,
  Button,
  TextField,
  Box,
  Modal,
} from "@mui/material";
import "./styles.css";
import DraggableAnimatedModel from "./components/DraggableAnimatedModel";
import BoundingBoxCoordinates from "./components/BoundingBoxCoordinates";
import useGetAppStates from "./hooks/useGetAppStates";

const glbFile = "/model.glb";
const videoFile = "/example.mp4";

const App = () => {
  const {
    videoRef,
    containerRef,
    position,
    setPosition,
    scale,
    setScale,
    rotation,
    setRotation,
    xRotationDegrees,
    setXRotationDegrees,
    yRotationDegrees,
    setYRotationDegrees,
    animationSpeed,
    setAnimationSpeed,
    isAnimationRunning,
    setIsAnimationRunning,
    animationStartTime,
    setAnimationStartTime,
    videoCurrentTime,
    setVideoCurrentTime,
    isVideoPlaying,
    setIsVideoPlaying,
    modelRef,
    openModal,
    setOpenModal,
    corners,
    setCorners,
  } = useGetAppStates();

  const handleVideoProgress = (state) => {
    setVideoCurrentTime(state.playedSeconds);
  };
  const downloadBoundingBox = () => {
    const data = JSON.stringify(corners, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "boundingBox.json";
    link.click();
  };

  return (
    <Box className="App">
      <Typography variant="h3">3D Overlay on Video</Typography>
      <Box
        className="video-container"
        ref={containerRef}
        style={{ position: "relative" }}
      >
        <ReactPlayer
          ref={videoRef}
          url={videoFile}
          playing={isVideoPlaying}
          loop
          width="100%"
          height="100%"
          onProgress={handleVideoProgress}
        />
        <Canvas
          orthographic
          camera={{ zoom: 100, position: [0, 0, 10] }}
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
            enableRotate={false}
          />
          <DraggableAnimatedModel
            url={glbFile}
            position={position}
            setPosition={setPosition}
            scale={scale}
            rotation={rotation}
            animationSpeed={animationSpeed}
            isAnimationRunning={isAnimationRunning}
            animationStartTime={animationStartTime}
            videoCurrentTime={videoCurrentTime}
            reference={modelRef}
          />
          {/* New component to calculate bounding box corners */}
          <BoundingBoxCoordinates
            key={JSON.stringify(position)}
            modelRef={modelRef}
            containerRef={containerRef}
            setCorners={setCorners}
          />
        </Canvas>
      </Box>

      <Box>
        <Typography variant="h6">
          Video Time: {Math.floor(videoCurrentTime)}
        </Typography>
      </Box>

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
        <Box mt={2}>
          <Typography variant="h6">Bounding Box Corners:</Typography>
          <pre>{JSON.stringify(corners, null, 2)}</pre>
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
          backgroundColor: "#121212",
        }}
      >
        <Box>
          <Typography variant="h6">Move Right/Left (X Axis)</Typography>
          <Slider
            value={position[0]}
            min={-10}
            max={10}
            step={0.1}
            onChange={(_e, value) => {
              setPosition([value as number, position[1], position[2]]);
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
            onChange={(_e, value) => {
              setPosition([position[0], value as number, position[2]]);
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
            onChange={(_e, value) => setScale(value as number)}
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
            onChange={(_e, value) => {
              setXRotationDegrees(value as number);
              setRotation([
                (value as number) * (Math.PI / 180),
                rotation[1],
                rotation[2],
              ]);
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
            onChange={(_e, value) => {
              setYRotationDegrees(value as number);
              setRotation([
                rotation[0],
                (value as number) * (Math.PI / 180),
                rotation[2],
              ]);
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
            onChange={(_e, value) => {
              setRotation([
                rotation[0],
                rotation[1],
                (value as number) * (Math.PI / 180), // Convert degrees to radians
              ] as number[]);
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
            onChange={(_e, value) => setAnimationSpeed(value as number)}
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

        {/* ... all your control boxes/buttons ... */}
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, maxHeight: 40 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={downloadBoundingBox}
          >
            Download Bounding Box
          </Button>

          <Button
            variant="contained"
            color="primary"
            onClick={() => setOpenModal(true)}
          >
            View Bounding Box
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
        </Box>
      </Box>
    </Box>
  );
};

export default App;
