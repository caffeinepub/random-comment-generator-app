import { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

function Cube() {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const { viewport } = useThree();
  const mousePosition = useRef({ x: 0, y: 0 });

  // Track mouse position and add continuous rotation
  useFrame(({ mouse }) => {
    mousePosition.current = { x: mouse.x, y: mouse.y };

    if (meshRef.current) {
      // Add continuous base rotation
      meshRef.current.rotation.x += 0.01;
      meshRef.current.rotation.y += 0.01;

      // Add mouse-based rotation on top of base rotation
      meshRef.current.rotation.y += mousePosition.current.x * 0.02;
      meshRef.current.rotation.x += mousePosition.current.y * 0.02;

      // Smooth color transition
      const material = meshRef.current.material as THREE.MeshStandardMaterial;
      const targetColor = hovered
        ? new THREE.Color(0x3b82f6) // Blue when hovered
        : new THREE.Color(0xff6b4a); // Orange-coral default

      material.color.lerp(targetColor, 0.1);
    }
  });

  return (
    <mesh
      ref={meshRef}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      scale={1.5}
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial
        color="#ff6b4a"
        metalness={0.3}
        roughness={0.4}
        emissive="#ff6b4a"
        emissiveIntensity={0.2}
      />
      {/* Corner accents */}
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(1, 1, 1)]} />
        <lineBasicMaterial color="#14b8a6" linewidth={2} />
      </lineSegments>
    </mesh>
  );
}

export default function Interactive3DCube() {
  return (
    <div className="w-full h-64 rounded-3xl overflow-hidden bg-gradient-to-br from-blue-100/50 via-teal-100/50 to-orange-100/50 dark:from-blue-900/20 dark:via-teal-900/20 dark:to-orange-900/20 border-2 border-blue-200/50 dark:border-blue-800/50">
      <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#14b8a6" />
        <Cube />
      </Canvas>
    </div>
  );
}
