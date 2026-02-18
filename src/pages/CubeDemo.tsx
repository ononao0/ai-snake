import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { Mesh } from "three";

function SpinningCube() {
  const meshRef = useRef<Mesh>(null);
  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 0.5;
      meshRef.current.rotation.y += delta * 0.8;
    }
  });
  return (
    <mesh ref={meshRef}>
      <boxGeometry args={[2, 2, 2]} />
      <meshStandardMaterial color="#4488ff" wireframe />
    </mesh>
  );
}

export default function CubeDemo() {
  return (
    <div className="canvas-container">
      <Canvas camera={{ position: [4, 3, 4] }}>
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 5, 5]} intensity={1} />
        <SpinningCube />
        <OrbitControls />
        <gridHelper args={[10, 10, "#333", "#222"]} />
      </Canvas>
    </div>
  );
}
