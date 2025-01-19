import { useRef, useState } from "react";

function useGetAppStates() {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const [position, setPosition] = useState<number[]>([0, 0, 0]);
  const [scale, setScale] = useState<number>(2);
  const [rotation, setRotation] = useState<number[]>([0, 0, 0]);
  const [xRotationDegrees, setXRotationDegrees] = useState<number>(0);
  const [yRotationDegrees, setYRotationDegrees] = useState(0);
  const [animationSpeed, setAnimationSpeed] = useState<number>(1);
  const [isAnimationRunning, setIsAnimationRunning] = useState(true);
  const [animationStartTime, setAnimationStartTime] = useState(0);
  const [videoCurrentTime, setVideoCurrentTime] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const modelRef = useRef(null);
  const [openModal, setOpenModal] = useState(false);
  const [corners, setCorners] = useState([]);

  return {
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
  };
}

export default useGetAppStates;
