import React, { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useGameStore } from '../store/useGameStore';
import { BountyCard } from './BountyCard';

// 1. A Simple Sci-Fi Blaster Model (Procedural)
const Weapon = () => {
  const { camera } = useThree();
  const ref = useRef();

  useFrame(() => {
    if (ref.current) {
      // Make the gun follow the camera position
      ref.current.position.copy(camera.position);
      ref.current.rotation.copy(camera.rotation);
      
      // Offset it to the bottom right (like Doom/FPS)
      ref.current.translateZ(-1.5); // Move forward
      ref.current.translateX(0.8);  // Move right
      ref.current.translateY(-0.8); // Move down
      
      // Add a slight "breathing" sway
      ref.current.position.y += Math.sin(Date.now() / 500) * 0.02;
    }
  });

  return (
    <group ref={ref}>
      {/* Main Barrel */}
      <mesh position={[0, 0, 0.5]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.1, 0.15, 1, 8]} />
        <meshStandardMaterial color="#333" roughness={0.3} metalness={0.8} />
      </mesh>
      {/* Glowing Energy Core */}
      <mesh position={[0, 0.1, 0.2]}>
        <boxGeometry args={[0.15, 0.5, 0.8]} />
        <meshStandardMaterial color="black" />
      </mesh>
      <mesh position={[0, 0.1, 0.2]}>
        <boxGeometry args={[0.16, 0.1, 0.6]} />
        <meshStandardMaterial color="#00ff41" emissive="#00ff41" emissiveIntensity={2} />
      </mesh>
    </group>
  );
};

export const GameScene = () => {
  const { bounties, addScore } = useGameStore();
  
  // RAIL SHOOTER CAMERA: Moves the camera forward automatically
  useFrame((state, delta) => {
    state.camera.position.z -= 8 * delta; // Increased speed for more thrill
  });

  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      
      {/* Fog to hide the end of the world (Performance + Atmosphere) */}
      <fog attach="fog" args={['black', 5, 40]} />

      {/* The Player's Weapon */}
      <Weapon />

      {/* Loop through the fetched NFTs and place them in the 3D world */}
      {bounties.map((nft, i) => (
        <BountyCard 
          key={nft.id}
          // Scatter them wildly
          position={[
             (Math.random()-0.5) * 15, // Wider spread X
             (Math.random()-0.5) * 8,  // Wider spread Y
             -20 - (i * 12)            // Start further back
          ]}
          textureUrl={nft.image}
          name={nft.name}
          onHit={() => addScore(100)}
        />
      ))}
      
      {/* Neon Grid Floor */}
      <gridHelper args={[200, 50, 0xff0055, 0x111111]} position={[0, -5, -100]} />
    </>
  );
};