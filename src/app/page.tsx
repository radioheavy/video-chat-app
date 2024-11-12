'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import * as THREE from 'three';

export default function Home() {
  const [roomCode, setRoomCode] = useState('');
  const router = useRouter();
  const threeSceneRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);

  const generateRoomCode = () => 
    Array.from({ length: 6 }, () => 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'[Math.floor(Math.random() * 36)]).join('');

  const handleCreateRoom = () => router.push(`/room/${generateRoomCode()}`);
  const handleJoinRoom = () => roomCode.length === 6 && router.push(`/room/${roomCode}`);

  useEffect(() => {
    if (!threeSceneRef.current) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    threeSceneRef.current.appendChild(renderer.domElement);

    const sphereGeometry = new THREE.SphereGeometry(2, 32, 32);
    const sphereMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x2c3e50, 
      metalness: 0.5, 
      roughness: 0.3 
    });
    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    scene.add(sphere);

    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCount = 5000;
    const posArray = new Float32Array(particlesCount * 3);
    const velocityArray = new Float32Array(particlesCount * 3);
    const colorArray = new Float32Array(particlesCount * 3);

    // Pastel renk paleti (mavi-mor tonları)
    const colorPalette = [
      new THREE.Color(0x6A5ACD),  // Slate Blue
      new THREE.Color(0x7B68EE),  // Medium Slate Blue
      new THREE.Color(0x9370DB),  // Medium Purple
      new THREE.Color(0x8A2BE2),  // Blue Violet
      new THREE.Color(0x4169E1),  // Royal Blue
      new THREE.Color(0x5D8AA8)   // Air Force Blue
    ];

    for (let i = 0; i < particlesCount * 3; i++) {
      const radius = 5 + Math.random() * 2;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;

      posArray[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      posArray[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      posArray[i * 3 + 2] = radius * Math.cos(phi);

      velocityArray[i * 3] = (Math.random() - 0.5) * 0.05;
      velocityArray[i * 3 + 1] = (Math.random() - 0.5) * 0.05;
      velocityArray[i * 3 + 2] = (Math.random() - 0.5) * 0.05;

      // Rastgele seçilmiş uyumlu renk
      const randomColor = colorPalette[Math.floor(Math.random() * colorPalette.length)];
      colorArray[i * 3] = randomColor.r;
      colorArray[i * 3 + 1] = randomColor.g;
      colorArray[i * 3 + 2] = randomColor.b;
    }

    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    particlesGeometry.setAttribute('velocity', new THREE.BufferAttribute(velocityArray, 3));
    particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colorArray, 3));
    
    const particlesMaterial = new THREE.PointsMaterial({ 
      size: 0.05,
      vertexColors: true,
      transparent: true,
      blending: THREE.AdditiveBlending,
      opacity: 0.7
    });

    const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particlesMesh);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    camera.position.z = 10;

    const animate = () => {
      animationRef.current = requestAnimationFrame(animate);

      const positions = particlesGeometry.getAttribute('position');
      const velocities = particlesGeometry.getAttribute('velocity');

      for (let i = 0; i < particlesCount; i++) {
        positions.setX(i, positions.getX(i) + velocities.getX(i));
        positions.setY(i, positions.getY(i) + velocities.getY(i));
        positions.setZ(i, positions.getZ(i) + velocities.getZ(i));

        if (Math.abs(positions.getX(i)) > 25) velocities.setX(i, -velocities.getX(i));
        if (Math.abs(positions.getY(i)) > 25) velocities.setY(i, -velocities.getY(i));
        if (Math.abs(positions.getZ(i)) > 25) velocities.setZ(i, -velocities.getZ(i));
      }

      positions.needsUpdate = true;
      velocities.needsUpdate = true;

      sphere.rotation.y += 0.003;
      particlesMesh.rotation.x += 0.001;
      particlesMesh.rotation.y += 0.002;
      
      renderer.render(scene, camera);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      threeSceneRef.current?.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div className="relative min-h-screen bg-black overflow-hidden flex items-center justify-center">
      <div ref={threeSceneRef} className="absolute inset-0 z-0 opacity-30" />
      
      <div className="relative z-10 w-full max-w-md p-6">
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 space-y-4">
          <h1 className="text-white text-2xl font-bold text-center">WebRTC Nexus</h1>
          
          <button 
            onClick={handleCreateRoom}
            className="w-full py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition"
          >
            Yeni Oda Oluştur
          </button>

          <div className="flex space-x-2">
            <input 
              type="text" 
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              placeholder="Oda Kodu"
              maxLength={6}
              className="flex-grow p-3 bg-white/10 text-white rounded-xl"
            />
            <button 
              onClick={handleJoinRoom}
              disabled={roomCode.length !== 6}
              className="bg-green-600 text-white p-3 rounded-xl disabled:opacity-50"
            >
              Katıl
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
