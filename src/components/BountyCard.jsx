import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import { TextureLoader } from 'three';

export const BountyCard = ({ position, textureUrl, name, onHit }) => {
  const mesh = useRef();
  const [active, setActive] = useState(true);
  const [texture, setTexture] = useState(null);

  // 1. Manually load the texture so we can catch errors
  useEffect(() => {
    const loader = new TextureLoader();
    // Default fallback texture (a simple grid or pattern)
    const fallbackUrl = "https://wsrv.nl/?url=https://arweave.net/u2x4H5rZ5gO4X0j7X4g5&w=500&h=500&output=webp";
    
    // Try to load the real NFT image
    loader.load(
      textureUrl,
      (loadedTexture) => {
        setTexture(loadedTexture); // Success!
      },
      undefined, // Progress callback (unused)
      (err) => {
        console.warn(`Texture failed for ${name}, loading fallback.`, err);
        // If it fails, load the fallback immediately
        loader.load(fallbackUrl, (fallback) => setTexture(fallback));
      }
    );
  }, [textureUrl, name]);

  // 2. Animation Logic
  useFrame((state) => {
    if (mesh.current && active) {
      mesh.current.position.y += Math.sin(state.clock.elapsedTime * 2) * 0.002;
      mesh.current.rotation.y += 0.005; 
    }
  });

  const handleClick = (e) => {
    e.stopPropagation();
    if (active) {
      setActive(false);
      onHit();
      mesh.current.visible = false;
    }
  };

  return (
    <group ref={mesh} position={position} onClick={handleClick}>
      {/* The Card Mesh */}
      <mesh>
        <planeGeometry args={[2, 3]} />
        <meshStandardMaterial 
          map={texture} 
          color={texture ? "white" : "#333"} // Grey if texture hasn't loaded yet
          transparent
        />
      </mesh>
      
      {/* Tech Border (Glowing Green) */}
      <mesh position={[0, 0, -0.01]}>
        <planeGeometry args={[2.1, 3.1]} />
        <meshStandardMaterial color="#00ff41" emissive="#00ff41" emissiveIntensity={0.5} />
      </mesh>

      {/* The Name Tag */}
      <Text 
        position={[0, 1.8, 0]} 
        fontSize={0.25} 
        color="#00ff41" 
        anchorX="center" 
        anchorY="middle"
        outlineWidth={0.02}
        outlineColor="#000000"
      >
        {name.slice(0, 15)}
      </Text>
    </group>
  );
};