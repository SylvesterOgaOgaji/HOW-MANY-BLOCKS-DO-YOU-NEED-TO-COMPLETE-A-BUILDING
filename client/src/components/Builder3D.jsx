import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, Line } from '@react-three/drei';
import * as THREE from 'three';

function createSandcreteTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#9b9489';
  ctx.fillRect(0, 0, 256, 256);

  // Subtle aggregate speckle
  for (let i = 0; i < 1600; i += 1) {
    const x = (i * 73) % 256;
    const y = (i * 137) % 256;
    ctx.fillStyle = i % 2 === 0 ? 'rgba(60, 56, 50, 0.25)' : 'rgba(215, 210, 200, 0.22)';
    ctx.fillRect(x, y, 2, 2);
  }

  // Running bond mortar courses (2 rows per tile)
  ctx.strokeStyle = '#5c574f';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(0, 128);
  ctx.lineTo(256, 128);
  ctx.moveTo(0, 254);
  ctx.lineTo(256, 254);
  ctx.moveTo(128, 0);
  ctx.lineTo(128, 128);
  ctx.moveTo(0, 128);
  ctx.lineTo(0, 256);
  ctx.stroke();

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.needsUpdate = true;
  return tex;
}

function createEpsPanelTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  // Expanded polystyrene bead base
  ctx.fillStyle = '#eef2f6';
  ctx.fillRect(0, 0, 256, 256);

  for (let i = 0; i < 900; i += 1) {
    const x = (i * 59) % 256;
    const y = (i * 97) % 256;
    ctx.fillStyle = i % 3 === 0 ? '#dbe4ee' : '#ffffff';
    ctx.fillRect(x, y, 4, 4);
  }

  // Galvanized 3D welded wire mesh grid
  ctx.strokeStyle = 'rgba(51, 65, 85, 0.52)';
  ctx.lineWidth = 2;
  for (let i = 0; i <= 256; i += 32) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, 256);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(256, i);
    ctx.stroke();
  }

  // 1.2m panel vertical joint stripe
  ctx.strokeStyle = '#0284c7';
  ctx.lineWidth = 6;
  ctx.strokeRect(2, 2, 252, 252);

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.needsUpdate = true;
  return tex;
}

function RoomLabelPlaque({ room }) {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.88)';
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.roundRect(24, 36, 464, 184, 24);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#0f172a';
    ctx.textAlign = 'center';
    ctx.font = 'bold 46px sans-serif';
    ctx.fillText(room.name, 256, 114);
    ctx.fillStyle = '#475569';
    ctx.font = 'bold 38px monospace';
    ctx.fillText(`${room.width}m × ${room.depth}m`, 256, 178);

    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }, [room.name, room.width, room.depth]);

  useEffect(() => () => texture.dispose(), [texture]);

  return (
    <mesh position={[0, 0.25, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[Math.min(room.width * 0.82, 3.0), Math.min(room.depth * 0.45, 1.5)]} />
      <meshBasicMaterial map={texture} transparent />
    </mesh>
  );
}

function computeWallSegmentsClient(rooms) {
  const edgeMap = new Map();
  for (const room of rooms) {
    const x1 = Number(room.x) || 0;
    const z1 = Number(room.z) || 0;
    const x2 = x1 + (Number(room.width) || 3);
    const z2 = z1 + (Number(room.depth) || 3);
    const edges = [
      { ax: x1, az: z1, bx: x2, bz: z1, dir: 'h' },
      { ax: x1, az: z2, bx: x2, bz: z2, dir: 'h' },
      { ax: x1, az: z1, bx: x1, bz: z2, dir: 'v' },
      { ax: x2, az: z1, bx: x2, bz: z2, dir: 'v' }
    ];
    for (const e of edges) {
      const fixed = e.dir === 'h' ? e.az.toFixed(2) : e.ax.toFixed(2);
      const start = e.dir === 'h' ? Math.min(e.ax, e.bx) : Math.min(e.az, e.bz);
      const end = e.dir === 'h' ? Math.max(e.ax, e.bx) : Math.max(e.az, e.bz);
      const key = `${e.dir}:${fixed}`;
      if (!edgeMap.has(key)) edgeMap.set(key, []);
      edgeMap.get(key).push([start, end]);
    }
  }

  const segments = [];
  for (const [key, intervals] of edgeMap.entries()) {
    const [dir, coordStr] = key.split(':');
    const coord = Number(coordStr);
    const points = Array.from(new Set(intervals.flat())).sort((a, b) => a - b);
    for (let i = 0; i < points.length - 1; i += 1) {
      const a = points[i];
      const b = points[i + 1];
      const len = b - a;
      if (len <= 0.05) continue;
      let count = 0;
      for (const [s, e] of intervals) {
        if (s <= a + 0.001 && e >= b - 0.001) count += 1;
      }
      if (count > 0) {
        segments.push({ dir, coord, start: a, end: b, length: len, isInterior: count >= 2 });
      }
    }
  }
  return segments;
}

function getBounds(rooms, plot) {
  if (!rooms.length) {
    return {
      minX: 1.5,
      maxX: Math.max(4, plot.width - 1.5),
      minZ: 2.0,
      maxZ: Math.max(6, plot.depth - 2.0),
      width: Math.max(4, plot.width - 3),
      depth: Math.max(4, plot.depth - 4),
      cx: plot.width / 2,
      cz: plot.depth / 2
    };
  }
  let minX = Infinity;
  let maxX = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;
  for (const r of rooms) {
    minX = Math.min(minX, r.x);
    maxX = Math.max(maxX, r.x + r.width);
    minZ = Math.min(minZ, r.z);
    maxZ = Math.max(maxZ, r.z + r.depth);
  }
  return {
    minX,
    maxX,
    minZ,
    maxZ,
    width: maxX - minX,
    depth: maxZ - minZ,
    cx: (minX + maxX) / 2,
    cz: (minZ + maxZ) / 2
  };
}

function WallSegmentMesh({
  seg,
  wallHeight,
  wallSystem,
  floorIdx,
  xrayMode,
  showOpenings,
  blockTex,
  epsTex
}) {
  const thickness = wallSystem === 'block_9' ? 0.225 : wallSystem === 'block_6' ? 0.15 : 0.14;
  const cx = seg.dir === 'h' ? (seg.start + seg.end) / 2 : seg.coord;
  const cz = seg.dir === 'h' ? seg.coord : (seg.start + seg.end) / 2;
  const rotY = seg.dir === 'h' ? 0 : Math.PI / 2;
  const baseY = floorIdx * wallHeight + 0.28;

  const isEps = wallSystem === 'eps_panel';
  const hasOpening = showOpenings && seg.length >= 2.2;
  const openingWidth = seg.isInterior ? 0.95 : 1.25;
  const openingHeight = seg.isInterior ? 2.1 : 1.25;
  const openingBottom = seg.isInterior ? 0 : 0.95;

  const activeTex = useMemo(() => {
    const src = isEps ? epsTex : blockTex;
    const cloned = src.clone();
    cloned.repeat.set(
      Math.max(1, isEps ? seg.length / 1.2 : seg.length / 0.9),
      Math.max(1, isEps ? wallHeight / 3.0 : wallHeight / 0.45)
    );
    cloned.needsUpdate = true;
    return cloned;
  }, [isEps, epsTex, blockTex, seg.length, wallHeight]);

  useEffect(() => () => activeTex.dispose(), [activeTex]);

  const wallMatProps = {
    map: activeTex,
    color: isEps ? '#f8fafc' : '#d6cfc3',
    transparent: xrayMode,
    opacity: xrayMode ? (isEps ? 0.78 : 0.72) : 1,
    roughness: isEps ? 0.55 : 0.88
  };

  if (!hasOpening) {
    return (
      <group position={[cx, baseY, cz]} rotation={[0, rotY, 0]}>
        <mesh position={[0, wallHeight / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[seg.length, wallHeight, thickness]} />
          <meshStandardMaterial {...wallMatProps} />
        </mesh>
        {isEps && xrayMode && (
          <mesh position={[0, wallHeight / 2, 0]}>
            <boxGeometry args={[seg.length + 0.01, wallHeight, thickness + 0.015]} />
            <meshStandardMaterial color="#0284c7" wireframe />
          </mesh>
        )}
        {!isEps && (
          <mesh position={[0, wallHeight - 0.11, 0]}>
            <boxGeometry args={[seg.length + 0.02, 0.22, thickness + 0.02]} />
            <meshStandardMaterial color="#64748b" roughness={0.7} />
          </mesh>
        )}
      </group>
    );
  }

  const sideLen = Math.max(0.25, (seg.length - openingWidth) / 2);
  const leftX = -(openingWidth / 2 + sideLen / 2);
  const rightX = openingWidth / 2 + sideLen / 2;
  const topH = Math.max(0.2, wallHeight - (openingBottom + openingHeight));

  return (
    <group position={[cx, baseY, cz]} rotation={[0, rotY, 0]}>
      <mesh position={[leftX, wallHeight / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[sideLen, wallHeight, thickness]} />
        <meshStandardMaterial {...wallMatProps} />
      </mesh>
      <mesh position={[rightX, wallHeight / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[sideLen, wallHeight, thickness]} />
        <meshStandardMaterial {...wallMatProps} />
      </mesh>
      <mesh position={[0, openingBottom + openingHeight + topH / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[openingWidth, topH, thickness]} />
        <meshStandardMaterial {...wallMatProps} />
      </mesh>
      {openingBottom > 0.05 && (
        <mesh position={[0, openingBottom / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[openingWidth, openingBottom, thickness]} />
          <meshStandardMaterial {...wallMatProps} />
        </mesh>
      )}
      <mesh position={[0, openingBottom + openingHeight / 2, 0]}>
        <boxGeometry args={[openingWidth - 0.04, openingHeight - 0.04, thickness * 0.45]} />
        <meshStandardMaterial
          color={seg.isInterior ? '#7c2d12' : '#0284c7'}
          transparent={!seg.isInterior}
          opacity={seg.isInterior ? 1 : 0.45}
          metalness={seg.isInterior ? 0.1 : 0.4}
          roughness={0.3}
        />
      </mesh>
      {isEps && xrayMode && (
        <mesh position={[0, wallHeight / 2, 0]}>
          <boxGeometry args={[seg.length + 0.01, wallHeight, thickness + 0.015]} />
          <meshStandardMaterial color="#0284c7" wireframe />
        </mesh>
      )}
    </group>
  );
}

function HollowBlockSingleMesh({ position, rotY, thickness = 0.225, ghost = false }) {
  return (
    <group position={position} rotation={[0, rotY, 0]}>
      {/* Block body */}
      <mesh position={[0, 0.112, 0]} castShadow={!ghost} receiveShadow>
        <boxGeometry args={[0.45, 0.225, thickness]} />
        <meshStandardMaterial
          color={ghost ? '#f59e0b' : '#9b9489'}
          roughness={0.92}
          transparent={ghost}
          opacity={ghost ? 0.55 : 1}
        />
      </mesh>
      {/* Dual dark hollow core openings visible from top */}
      <mesh position={[-0.1, 0.227, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.14, thickness * 0.56]} />
        <meshBasicMaterial color="#1e293b" />
      </mesh>
      <mesh position={[0.1, 0.227, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.14, thickness * 0.56]} />
        <meshBasicMaterial color="#1e293b" />
      </mesh>
    </group>
  );
}

function PlacedPieceMesh({
  piece,
  wallHeight,
  xrayMode,
  epsTex,
  blockTex,
  isEraser,
  onClickPiece
}) {
  const rotY = piece.dir === 'v' ? Math.PI / 2 : 0;
  const cx =
    piece.type === 'eps_panel'
      ? piece.dir === 'h'
        ? piece.x + 0.6
        : piece.x
      : piece.type === 'block_9_bay' || piece.type === 'block_6_bay'
        ? piece.dir === 'h'
          ? piece.x + 0.45
          : piece.x
        : piece.x;
  const cz =
    piece.type === 'eps_panel'
      ? piece.dir === 'v'
        ? piece.z + 0.6
        : piece.z
      : piece.type === 'block_9_bay' || piece.type === 'block_6_bay'
        ? piece.dir === 'v'
          ? piece.z + 0.45
          : piece.z
        : piece.z;

  const baseY = 0.24;

  const handleClick = (e) => {
    if (isEraser && onClickPiece) {
      e.stopPropagation();
      onClickPiece(piece.id);
    }
  };

  if (piece.type === 'starter_peg') {
    return (
      <mesh position={[cx, baseY + 0.28, cz]} castShadow onClick={handleClick}>
        <cylinderGeometry args={[0.025, 0.025, 0.58, 10]} />
        <meshStandardMaterial color={isEraser ? '#ef4444' : '#d97706'} metalness={0.8} roughness={0.25} />
      </mesh>
    );
  }

  if (piece.type === 'eps_panel') {
    return (
      <group position={[cx, baseY, cz]} rotation={[0, rotY, 0]} onClick={handleClick}>
        <mesh position={[0, wallHeight / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.19, wallHeight, 0.14]} />
          <meshStandardMaterial
            map={epsTex}
            color={isEraser ? '#fecaca' : '#ffffff'}
            transparent={xrayMode}
            opacity={xrayMode ? 0.78 : 1}
            roughness={0.55}
          />
        </mesh>
        {/* 3 embedded starter iron pegs under each 1.2m panel */}
        {[-0.4, 0, 0.4].map((px, idx) => (
          <mesh key={idx} position={[px, 0.28, 0]}>
            <cylinderGeometry args={[0.018, 0.018, 0.56, 8]} />
            <meshStandardMaterial color="#b45309" metalness={0.85} roughness={0.25} />
          </mesh>
        ))}
        {xrayMode && (
          <mesh position={[0, wallHeight / 2, 0]}>
            <boxGeometry args={[1.2, wallHeight, 0.155]} />
            <meshStandardMaterial color="#0284c7" wireframe />
          </mesh>
        )}
      </group>
    );
  }

  if (piece.type === 'block_9_bay' || piece.type === 'block_6_bay') {
    const thick = piece.type === 'block_9_bay' ? 0.225 : 0.15;
    return (
      <group position={[cx, baseY, cz]} rotation={[0, rotY, 0]} onClick={handleClick}>
        <mesh position={[0, wallHeight / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.89, wallHeight, thick]} />
          <meshStandardMaterial
            map={blockTex}
            color={isEraser ? '#fecaca' : '#d6cfc3'}
            transparent={xrayMode}
            opacity={xrayMode ? 0.75 : 1}
            roughness={0.9}
          />
        </mesh>
      </group>
    );
  }

  if (piece.type === 'block_9_single' || piece.type === 'block_6_single') {
    const thick = piece.type === 'block_9_single' ? 0.225 : 0.15;
    return (
      <group onClick={handleClick}>
        <HollowBlockSingleMesh
          position={[cx, baseY + (Number(piece.layer) || 0) * 0.23, cz]}
          rotY={rotY}
          thickness={thick}
        />
      </group>
    );
  }

  if (piece.type === 'door' || piece.type === 'window') {
    const isDoor = piece.type === 'door';
    return (
      <mesh
        position={[cx, baseY + (isDoor ? 1.05 : 1.55), cz]}
        rotation={[0, rotY, 0]}
        onClick={handleClick}
      >
        <boxGeometry args={[isDoor ? 0.95 : 1.2, isDoor ? 2.1 : 1.2, 0.18]} />
        <meshStandardMaterial
          color={isDoor ? '#7c2d12' : '#0284c7'}
          transparent={!isDoor}
          opacity={isDoor ? 1 : 0.55}
        />
      </mesh>
    );
  }

  return null;
}

function StarterPegsRow({ seg }) {
  const pegs = [];
  const count = Math.max(2, Math.floor(seg.length / 0.45));
  for (let i = 0; i <= count; i += 1) {
    const t = seg.start + (i / count) * seg.length;
    const x = seg.dir === 'h' ? t : seg.coord;
    const z = seg.dir === 'h' ? seg.coord : t;
    pegs.push([x, z]);
  }
  return (
    <group>
      {pegs.map(([x, z], idx) => (
        <mesh key={idx} position={[x, 0.52, z]} castShadow>
          <cylinderGeometry args={[0.022, 0.022, 0.55, 8]} />
          <meshStandardMaterial color="#b45309" metalness={0.8} roughness={0.25} />
        </mesh>
      ))}
    </group>
  );
}

function RoofMesh({ bounds, topY, roofStyle, xrayMode }) {
  const overhang = 0.65;
  const rw = bounds.width + overhang * 2;
  const rd = bounds.depth + overhang * 2;
  const ridgeH = Math.min(2.4, Math.max(1.2, Math.min(rw, rd) * 0.22));
  const rafters = Math.max(4, Math.round(rw / 1.2));

  if (roofStyle === 'monopitch') {
    const slopeAngle = Math.atan2(ridgeH * 0.7, rd);
    const slopeLen = Math.hypot(rd, ridgeH * 0.7);
    return (
      <group position={[bounds.cx, topY, bounds.cz]}>
        {Array.from({ length: rafters }).map((_, idx) => {
          const rx = -rw / 2 + 0.25 + (idx / Math.max(1, rafters - 1)) * (rw - 0.5);
          return (
            <mesh key={idx} position={[rx, ridgeH * 0.35, 0]} rotation={[slopeAngle, 0, 0]} castShadow>
              <boxGeometry args={[0.08, 0.14, slopeLen]} />
              <meshStandardMaterial color="#92400e" roughness={0.85} />
            </mesh>
          );
        })}
        <mesh position={[0, ridgeH * 0.42, 0]} rotation={[slopeAngle, 0, 0]} castShadow>
          <boxGeometry args={[rw, 0.06, slopeLen]} />
          <meshStandardMaterial
            color="#b91c1c"
            transparent={xrayMode}
            opacity={xrayMode ? 0.3 : 0.95}
            metalness={0.35}
            roughness={0.45}
          />
        </mesh>
      </group>
    );
  }

  const halfSpan = rd / 2;
  const slopeAngle = Math.atan2(ridgeH, halfSpan);
  const slopeLen = Math.hypot(halfSpan, ridgeH);

  return (
    <group position={[bounds.cx, topY, bounds.cz]}>
      <mesh position={[0, ridgeH, 0]}>
        <boxGeometry args={[rw - 0.2, 0.12, 0.08]} />
        <meshStandardMaterial color="#78350f" />
      </mesh>
      {Array.from({ length: rafters }).map((_, idx) => {
        const rx = -rw / 2 + 0.25 + (idx / Math.max(1, rafters - 1)) * (rw - 0.5);
        return (
          <group key={idx} position={[rx, 0, 0]}>
            <mesh position={[0, 0.04, 0]}>
              <boxGeometry args={[0.07, 0.09, rd - 0.4]} />
              <meshStandardMaterial color="#92400e" />
            </mesh>
            <mesh position={[0, ridgeH / 2, -halfSpan / 2]} rotation={[-slopeAngle, 0, 0]}>
              <boxGeometry args={[0.07, 0.12, slopeLen]} />
              <meshStandardMaterial color="#92400e" />
            </mesh>
            <mesh position={[0, ridgeH / 2, halfSpan / 2]} rotation={[slopeAngle, 0, 0]}>
              <boxGeometry args={[0.07, 0.12, slopeLen]} />
              <meshStandardMaterial color="#92400e" />
            </mesh>
          </group>
        );
      })}
      <mesh position={[0, ridgeH / 2 + 0.07, -halfSpan / 2]} rotation={[-slopeAngle, 0, 0]} castShadow>
        <boxGeometry args={[rw, 0.05, slopeLen]} />
        <meshStandardMaterial
          color={roofStyle === 'hip' ? '#0f766e' : '#9a3412'}
          transparent={xrayMode}
          opacity={xrayMode ? 0.28 : 0.96}
          metalness={0.35}
          roughness={0.4}
        />
      </mesh>
      <mesh position={[0, ridgeH / 2 + 0.07, halfSpan / 2]} rotation={[slopeAngle, 0, 0]} castShadow>
        <boxGeometry args={[rw, 0.05, slopeLen]} />
        <meshStandardMaterial
          color={roofStyle === 'hip' ? '#0f766e' : '#9a3412'}
          transparent={xrayMode}
          opacity={xrayMode ? 0.28 : 0.96}
          metalness={0.35}
          roughness={0.4}
        />
      </mesh>
    </group>
  );
}

function CompoundFittings({ plot, bounds, siteGeo }) {
  const tankX = siteGeo?.boreholePos?.x ?? Math.min(plot.width - 1.4, bounds.maxX + 1.8);
  const tankZ = siteGeo?.boreholePos?.z ?? Math.max(2, bounds.minZ + 1.5);
  const septicX = siteGeo?.septicPos?.x ?? Math.max(1.8, bounds.minX + 1.5);
  const septicZ = siteGeo?.septicPos?.z ?? Math.min(plot.depth - 2, bounds.maxZ + 2.5);

  return (
    <group>
      {/* SW Wind Direction Marker at plot edge */}
      <group position={[1.4, 0.08, plot.depth - 1.4]} rotation={[0, Math.PI / 4, 0]}>
        <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.32, 0.95, 12]} />
          <meshStandardMaterial color="#0284c7" />
        </mesh>
      </group>

      <group position={[tankX, 0, tankZ]}>
        {[
          [-0.55, -0.55],
          [0.55, -0.55],
          [-0.55, 0.55],
          [0.55, 0.55]
        ].map(([lx, lz], idx) => (
          <mesh key={idx} position={[lx, 1.5, lz]} castShadow>
            <boxGeometry args={[0.09, 3.0, 0.09]} />
            <meshStandardMaterial color="#334155" metalness={0.7} />
          </mesh>
        ))}
        <mesh position={[0, 3.05, 0]} castShadow>
          <boxGeometry args={[1.4, 0.12, 1.4]} />
          <meshStandardMaterial color="#475569" />
        </mesh>
        <mesh position={[0, 3.85, 0]} castShadow>
          <cylinderGeometry args={[0.62, 0.62, 1.5, 24]} />
          <meshStandardMaterial color="#0f172a" roughness={0.4} />
        </mesh>
        <mesh position={[0.25, 4.75, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 0.55, 10]} />
          <meshStandardMaterial color="#16a34a" />
        </mesh>
        <mesh position={[0.68, 4.1, 0]} rotation={[0, 0, -0.45]}>
          <cylinderGeometry args={[0.03, 0.03, 0.9, 10]} />
          <meshStandardMaterial color="#0284c7" />
        </mesh>
      </group>

      <group position={[septicX, 0.08, septicZ]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[2.6, 0.16, 1.6]} />
          <meshStandardMaterial color="#64748b" roughness={0.9} />
        </mesh>
        <mesh position={[-0.6, 0.1, 0]}>
          <boxGeometry args={[0.5, 0.06, 0.5]} />
          <meshStandardMaterial color="#334155" />
        </mesh>
        <mesh position={[0.6, 0.1, 0]}>
          <boxGeometry args={[0.5, 0.06, 0.5]} />
          <meshStandardMaterial color="#334155" />
        </mesh>
      </group>
    </group>
  );
}

export default function Builder3D({
  plot,
  rooms,
  selectedRoomId,
  onSelectRoom,
  wallSystem,
  wallHeightM,
  floors,
  roofStyle,
  buildStage,
  xrayMode,
  buildMode = 'room_snap',
  activeTool = 'eps_panel',
  pieceOrientation = 'h',
  placedPieces = [],
  onPlacePiece,
  onRemovePiece,
  siteGeo = null
}) {
  const controlsRef = useRef(null);
  const [hoverCoord, setHoverCoord] = useState(null);

  const blockTex = useMemo(() => createSandcreteTexture(), []);
  const epsTex = useMemo(() => createEpsPanelTexture(), []);
  useEffect(() => () => {
    blockTex.dispose();
    epsTex.dispose();
  }, [blockTex, epsTex]);

  const segments = useMemo(() => computeWallSegmentsClient(rooms), [rooms]);
  const bounds = useMemo(() => getBounds(rooms, plot), [rooms, plot]);

  const cameraTarget = useMemo(
    () => [plot.width / 2, 1.4, Math.min(plot.depth / 2, bounds.cz)],
    [plot.width, plot.depth, bounds.cz]
  );

  const isEps = wallSystem === 'eps_panel';
  const totalHeight = wallHeightM * floors + 0.28;

  const snapPoint = (pt) => {
    const step = activeTool.includes('single') ? 0.45 : 0.6;
    const x = Math.max(0.6, Math.min(plot.width - 1.2, Math.round(pt.x / step) * step));
    const z = Math.max(0.6, Math.min(plot.depth - 1.2, Math.round(pt.z / step) * step));
    return { x: Number(x.toFixed(2)), z: Number(z.toFixed(2)) };
  };

  const setCameraView = (preset) => {
    const ctrl = controlsRef.current;
    if (!ctrl) return;
    if (preset === 'top') {
      ctrl.object.position.set(bounds.cx, 24, bounds.cz + 0.01);
    } else if (preset === 'front') {
      ctrl.object.position.set(bounds.cx, 3.2, bounds.maxZ + 14);
    } else {
      ctrl.object.position.set(bounds.cx + 12, 11, bounds.maxZ + 12);
    }
    ctrl.target.set(bounds.cx, 1.4, bounds.cz);
    ctrl.update();
  };

  return (
    <div className="canvas-shell">
      <div className="canvas-hud-top">
        <span className="hud-pill">
          {buildMode === 'piece_by_piece'
            ? `Click Land/Platform to Snap Piece (${placedPieces.length} placed) · Drag to Rotate`
            : 'Drag to Rotate · Scroll to Zoom · Click Room to Snap/Move'}
        </span>
        <div className="hud-cam-group">
          <button type="button" className="hud-btn" onClick={() => setCameraView('iso')}>
            3D View
          </button>
          <button type="button" className="hud-btn" onClick={() => setCameraView('top')}>
            Top Plan
          </button>
          <button type="button" className="hud-btn" onClick={() => setCameraView('front')}>
            Eye Level
          </button>
        </div>
      </div>

      <Canvas shadows camera={{ position: [bounds.cx + 12, 11, bounds.maxZ + 12], fov: 45 }}>
        <color attach="background" args={['#eef3f8']} />
        <ambientLight intensity={0.78} />
        <directionalLight
          position={[18, 26, 16]}
          intensity={1.25}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />

        {/* Plot Land Surface */}
        <mesh
          position={[plot.width / 2, -0.04, plot.depth / 2]}
          receiveShadow
          onPointerMove={(e) => {
            if (buildMode === 'piece_by_piece') {
              e.stopPropagation();
              setHoverCoord(snapPoint(e.point));
            }
          }}
          onPointerOut={() => setHoverCoord(null)}
          onClick={(e) => {
            if (buildMode === 'piece_by_piece' && onPlacePiece && activeTool !== 'eraser') {
              e.stopPropagation();
              const pt = snapPoint(e.point);
              onPlacePiece({ x: pt.x, z: pt.z, dir: pieceOrientation, type: activeTool });
            } else {
              onSelectRoom(null);
            }
          }}
        >
          <boxGeometry args={[plot.width, 0.08, plot.depth]} />
          <meshStandardMaterial color="#d8e2c8" roughness={0.95} />
        </mesh>

        {/* Plot Setback Line */}
        <Line
          points={[
            [1.2, 0.02, 1.5],
            [plot.width - 1.2, 0.02, 1.5],
            [plot.width - 1.2, 0.02, plot.depth - 1.5],
            [1.2, 0.02, plot.depth - 1.5],
            [1.2, 0.02, 1.5]
          ]}
          color="#0284c7"
          lineWidth={1.5}
          dashed
        />

        <Grid
          position={[plot.width / 2, 0.005, plot.depth / 2]}
          args={[plot.width, plot.depth]}
          cellSize={0.6}
          cellThickness={0.5}
          cellColor="#b8c4ae"
          sectionSize={3}
          sectionThickness={1}
          sectionColor="#8b9c80"
        />

        {/* ROOM SNAP MODE RENDERING */}
        {buildMode === 'room_snap' && (
          <>
            {rooms.map((room) => {
              const isSelected = room.id === selectedRoomId;
              return (
                <group
                  key={room.id}
                  position={[room.x + room.width / 2, 0.03, room.z + room.depth / 2]}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectRoom(room.id);
                  }}
                >
                  <mesh receiveShadow>
                    <boxGeometry args={[room.width - 0.06, 0.05, room.depth - 0.06]} />
                    <meshStandardMaterial
                      color={isSelected ? '#f59e0b' : room.color || '#cbd5e1'}
                      roughness={0.8}
                    />
                  </mesh>
                  <RoomLabelPlaque room={room} />
                </group>
              );
            })}

            {buildStage >= 2 && (
              <group>
                {rooms.map((room) => (
                  <mesh
                    key={`pad-${room.id}`}
                    position={[room.x + room.width / 2, 0.14, room.z + room.depth / 2]}
                    receiveShadow
                    castShadow
                  >
                    <boxGeometry args={[room.width + 0.35, 0.24, room.depth + 0.35]} />
                    <meshStandardMaterial color={isEps ? '#94a3b8' : '#78716c'} roughness={0.9} />
                  </mesh>
                ))}
                {isEps &&
                  segments.map((seg, idx) => <StarterPegsRow key={`peg-${idx}`} seg={seg} />)}
              </group>
            )}

            {buildStage >= 3 &&
              Array.from({ length: floors }).map((_, floorIdx) => (
                <group key={`floor-${floorIdx}`}>
                  {segments.map((seg, idx) => (
                    <WallSegmentMesh
                      key={`wall-${floorIdx}-${idx}`}
                      seg={seg}
                      wallHeight={wallHeightM}
                      wallSystem={wallSystem}
                      floorIdx={floorIdx}
                      xrayMode={xrayMode}
                      showOpenings={buildStage >= 4}
                      blockTex={blockTex}
                      epsTex={epsTex}
                    />
                  ))}
                </group>
              ))}

            {buildStage >= 4 && floors === 2 && (
              <group>
                {rooms.map((room) => (
                  <mesh
                    key={`deck-${room.id}`}
                    position={[room.x + room.width / 2, wallHeightM + 0.28, room.z + room.depth / 2]}
                    castShadow
                    receiveShadow
                  >
                    <boxGeometry args={[room.width + 0.18, 0.18, room.depth + 0.18]} />
                    <meshStandardMaterial
                      color="#64748b"
                      transparent={xrayMode}
                      opacity={xrayMode ? 0.5 : 1}
                    />
                  </mesh>
                ))}
              </group>
            )}

            {buildStage >= 5 && rooms.length > 0 && (
              <RoofMesh bounds={bounds} topY={totalHeight} roofStyle={roofStyle} xrayMode={xrayMode} />
            )}

            {buildStage >= 6 && rooms.length > 0 && (
              <CompoundFittings plot={plot} bounds={bounds} siteGeo={siteGeo} />
            )}
          </>
        )}

        {/* PIECE-BY-PIECE PICK & SNAP MODE RENDERING */}
        {buildMode === 'piece_by_piece' && (
          <group>
            {/* Raised Concrete Foundation Platform */}
            <mesh
              position={[plot.width / 2, 0.12, plot.depth / 2]}
              receiveShadow
              castShadow
              onPointerMove={(e) => {
                e.stopPropagation();
                setHoverCoord(snapPoint(e.point));
              }}
              onClick={(e) => {
                if (onPlacePiece && activeTool !== 'eraser') {
                  e.stopPropagation();
                  const pt = snapPoint(e.point);
                  onPlacePiece({ x: pt.x, z: pt.z, dir: pieceOrientation, type: activeTool });
                }
              }}
            >
              <boxGeometry args={[Math.max(4, plot.width - 2.4), 0.22, Math.max(4, plot.depth - 3.0)]} />
              <meshStandardMaterial color="#94a3b8" roughness={0.92} />
            </mesh>

            {/* Ghost placement preview under cursor */}
            {hoverCoord && activeTool !== 'eraser' && (
              <mesh
                position={[
                  hoverCoord.x + (pieceOrientation === 'h' && activeTool === 'eps_panel' ? 0.6 : pieceOrientation === 'h' && activeTool.includes('bay') ? 0.45 : 0),
                  0.24 + (activeTool === 'starter_peg' ? 0.28 : activeTool.includes('single') ? 0.11 : wallHeightM / 2),
                  hoverCoord.z + (pieceOrientation === 'v' && activeTool === 'eps_panel' ? 0.6 : pieceOrientation === 'v' && activeTool.includes('bay') ? 0.45 : 0)
                ]}
                rotation={[0, pieceOrientation === 'v' ? Math.PI / 2 : 0, 0]}
              >
                <boxGeometry
                  args={[
                    activeTool === 'eps_panel'
                      ? 1.2
                      : activeTool.includes('bay')
                        ? 0.9
                        : activeTool.includes('single')
                          ? 0.45
                          : 0.1,
                    activeTool === 'starter_peg'
                      ? 0.55
                      : activeTool.includes('single')
                        ? 0.225
                        : wallHeightM,
                    0.22
                  ]}
                />
                <meshStandardMaterial color="#f59e0b" transparent opacity={0.48} />
              </mesh>
            )}

            {/* Placed live pieces */}
            {placedPieces.map((piece) => (
              <PlacedPieceMesh
                key={piece.id}
                piece={piece}
                wallHeight={wallHeightM}
                xrayMode={xrayMode}
                epsTex={epsTex}
                blockTex={blockTex}
                isEraser={activeTool === 'eraser'}
                onClickPiece={onRemovePiece}
              />
            ))}
          </group>
        )}

        <OrbitControls
          ref={controlsRef}
          target={cameraTarget}
          maxPolarAngle={Math.PI / 2 - 0.04}
          minDistance={5}
          maxDistance={50}
        />
      </Canvas>
    </div>
  );
}
