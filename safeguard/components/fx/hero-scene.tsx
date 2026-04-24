"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Icosahedron, MeshDistortMaterial, Float, Stars } from "@react-three/drei";
import { useRef, Suspense } from "react";
import type * as THREE from "three";

/**
 * A softly-morphing icosahedron that tracks the cursor, wrapped in a star
 * field. Renders in a fixed-position canvas behind the hero content.
 *
 * - `MeshDistortMaterial` continually deforms the surface using a noise shader.
 * - `Float` from drei adds idle bob-and-drift.
 * - `Stars` renders thousands of procedural points at negligible cost.
 */
function Blob() {
  const mesh = useRef<THREE.Mesh>(null);
  useFrame(({ pointer, clock }) => {
    if (!mesh.current) return;
    const targetX = pointer.y * 0.4;
    const targetY = pointer.x * 0.6;
    mesh.current.rotation.x += (targetX - mesh.current.rotation.x) * 0.04;
    mesh.current.rotation.y += (targetY - mesh.current.rotation.y) * 0.04;
    mesh.current.rotation.z = clock.elapsedTime * 0.04;
  });

  return (
    <Float speed={1.2} rotationIntensity={0.4} floatIntensity={1.2}>
      <Icosahedron ref={mesh} args={[1.6, 6]}>
        <MeshDistortMaterial
          color="#e91e8c"
          emissive="#a8126b"
          emissiveIntensity={0.6}
          metalness={0.3}
          roughness={0.2}
          distort={0.45}
          speed={1.6}
        />
      </Icosahedron>
    </Float>
  );
}

export function HeroScene() {
  return (
    <Canvas
      className="absolute inset-0"
      camera={{ position: [0, 0, 5], fov: 50 }}
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
    >
      <ambientLight intensity={0.4} />
      <pointLight position={[4, 4, 4]} intensity={1.4} color="#e91e8c" />
      <pointLight position={[-4, -2, 3]} intensity={0.9} color="#6366f1" />
      <Suspense fallback={null}>
        <Blob />
        <Stars
          radius={60}
          depth={40}
          count={2500}
          factor={3}
          saturation={0}
          fade
          speed={0.5}
        />
      </Suspense>
    </Canvas>
  );
}
