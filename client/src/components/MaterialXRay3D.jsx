import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';

function HollowBlockModel() {
  return (
    <group>
      {/* 450mm x 225mm x 225mm scaled 4x for clear view */}
      <mesh position={[0, 0, -0.35]} castShadow>
        <boxGeometry args={[1.8, 0.9, 0.16]} />
        <meshStandardMaterial color="#94a3b8" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0, 0.35]} castShadow>
        <boxGeometry args={[1.8, 0.9, 0.16]} />
        <meshStandardMaterial color="#94a3b8" roughness={0.9} />
      </mesh>
      <mesh position={[-0.82, 0, 0]}>
        <boxGeometry args={[0.16, 0.9, 0.72]} />
        <meshStandardMaterial color="#94a3b8" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.16, 0.9, 0.72]} />
        <meshStandardMaterial color="#94a3b8" roughness={0.9} />
      </mesh>
      <mesh position={[0.82, 0, 0]}>
        <boxGeometry args={[0.16, 0.9, 0.72]} />
        <meshStandardMaterial color="#94a3b8" roughness={0.9} />
      </mesh>
      {/* 10mm mortar bed joint highlight */}
      <mesh position={[0, -0.5, 0]}>
        <boxGeometry args={[1.9, 0.08, 0.96]} />
        <meshStandardMaterial color="#d97706" />
      </mesh>
    </group>
  );
}

function EpsCutawayModel() {
  return (
    <group position={[0, -0.2, 0]}>
      {/* Raised Concrete Foundation Platform */}
      <mesh position={[0, -0.75, 0]}>
        <boxGeometry args={[2.4, 0.35, 1.4]} />
        <meshStandardMaterial color="#64748b" roughness={0.9} />
      </mesh>
      {/* Vertical Starter Iron Pegs anchored in platform */}
      {[-0.8, -0.25, 0.3, 0.85].map((x, idx) => (
        <mesh key={idx} position={[x, -0.15, 0]}>
          <cylinderGeometry args={[0.035, 0.035, 1.0, 10]} />
          <meshStandardMaterial color="#1e293b" metalness={0.85} roughness={0.2} />
        </mesh>
      ))}
      {/* Expanded Polystyrene (EPS) Foam Core */}
      <mesh position={[0, 0.25, 0]}>
        <boxGeometry args={[1.9, 1.65, 0.28]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.6} />
      </mesh>
      {/* Galvanized Welded Wire Mesh Cage */}
      <mesh position={[0, 0.25, 0]}>
        <boxGeometry args={[1.94, 1.68, 0.34]} />
        <meshStandardMaterial color="#0284c7" wireframe />
      </mesh>
      {/* Cutaway Shotcrete Plaster Coat (left half only so interior is visible!) */}
      <mesh position={[-0.48, 0.25, 0.23]}>
        <boxGeometry args={[0.96, 1.65, 0.1]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.9} />
      </mesh>
      <mesh position={[-0.48, 0.25, -0.23]}>
        <boxGeometry args={[0.96, 1.65, 0.1]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.9} />
      </mesh>
    </group>
  );
}

export default function MaterialXRay3D({ mode = 'eps' }) {
  return (
    <div className="xray-canvas-box">
      <Canvas camera={{ position: [2.4, 1.4, 2.8], fov: 42 }}>
        <color attach="background" args={['#f1f5f9']} />
        <ambientLight intensity={0.85} />
        <directionalLight position={[4, 6, 4]} intensity={1.1} />
        {mode === 'eps' ? <EpsCutawayModel /> : <HollowBlockModel />}
        <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={1.4} />
      </Canvas>
    </div>
  );
}
