import { OrbitControls, Stars, useTexture } from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';

/* ──────── PLANET ──────── */
function Planet({
    position,
    size,
    rotationSpeed = 0.005,
    textureUrl,
    orbitRadius = 0,
    orbitSpeed = 0.001,
}) {
    const meshRef = useRef(null);
    const texture = useTexture(textureUrl);
    const time = useRef(Math.random() * 100);

    useFrame(() => {
        if (meshRef.current) {
            // Self rotation
            meshRef.current.rotation.y += rotationSpeed;

            // Orbital motion
            if (orbitRadius > 0) {
                time.current += orbitSpeed;
                meshRef.current.position.x = Math.cos(time.current) * orbitRadius;
                meshRef.current.position.z = Math.sin(time.current) * orbitRadius;
            }
        }
    });

    return (
        <mesh ref={meshRef} position={position}>
            <sphereGeometry args={[size, 64, 64]} />
            <meshStandardMaterial map={texture} />
        </mesh>
    );
}

/* ──────── ORBIT RING ──────── */
function OrbitRing({ radius }) {
    return (
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[radius - 0.1, radius + 0.1, 128]} />
            <meshBasicMaterial color="#ffffff" opacity={0.1} transparent={true} side={THREE.DoubleSide} />
        </mesh>
    );
}

/* ──────── SCENE ──────── */
function SpaceSceneContent() {
    return (
        <>
            <ambientLight intensity={0.15} />
            <pointLight position={[0, 0, 0]} intensity={3} color="#ffd700" distance={200} decay={1} />
            <Stars radius={300} depth={50} count={7000} factor={4} saturation={0} fade speed={1} />

            {/* Orbit Rings */}
            <OrbitRing radius={10} />
            <OrbitRing radius={15} />
            <OrbitRing radius={20} />
            <OrbitRing radius={25} />
            <OrbitRing radius={35} />
            <OrbitRing radius={45} />
            <OrbitRing radius={58} />
            <OrbitRing radius={70} />

            {/* Sun */}
            <Planet
                position={[0, 0, 0]}
                size={5}
                textureUrl="/textures/sun.jpg"
                rotationSpeed={0.002}
            />


            {/* Mercury */}
            <Planet
                position={[10, 0, 0]}
                size={0.8}
                textureUrl="/textures/mercury.jpg"
                orbitRadius={10}
                orbitSpeed={0.008}
            />

            {/* Venus */}
            <Planet
                position={[15, 0, 0]}
                size={1.2}
                textureUrl="/textures/venus.jpg"
                orbitRadius={15}
                orbitSpeed={0.006}
            />

            {/* Earth */}
            <Planet
                position={[20, 0, 0]}
                size={1.5}
                textureUrl="/textures/earth.jpg"
                orbitRadius={20}
                orbitSpeed={0.004}
            />

            {/* Mars */}
            <Planet
                position={[25, 0, 0]}
                size={1}
                textureUrl="/textures/mars.jpg"
                orbitRadius={25}
                orbitSpeed={0.003}
            />

            {/* Jupiter */}
            <Planet
                position={[35, 0, 0]}
                size={3.5}
                textureUrl="/textures/jupiter.jpg"
                orbitRadius={35}
                orbitSpeed={0.002}
            />

            {/* Saturn */}
            <Planet
                position={[45, 0, 0]}
                size={3}
                textureUrl="/textures/saturn.jpg"
                orbitRadius={45}
                orbitSpeed={0.001}
            />

            {/* Uranus */}
            <Planet
                position={[58, 0, 0]}
                size={2}
                textureUrl="/textures/uranus.jpg"
                orbitRadius={58}
                orbitSpeed={0.0007}
            />

            {/* Neptune */}
            <Planet
                position={[70, 0, 0]}
                size={1.9}
                textureUrl="/textures/neptune.jpg"
                orbitRadius={70}
                orbitSpeed={0.0005}
            />

            <OrbitControls
                enableZoom={true}
                enablePan={true}
                enableRotate={true}
                maxDistance={250}
                minDistance={20}
                autoRotate={true}
                autoRotateSpeed={0.5}
            />
        </>
    );
}

/* ──────── EXPORTED COMPONENT ──────── */
export default function SolarSystem() {
    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                zIndex: 0,
            }}
        >
            <Canvas
                camera={{ position: [0, 40, 100], fov: 60 }}
                style={{ width: '100%', height: '100%' }}
                gl={{ antialias: true, alpha: true }}
            >
                <SpaceSceneContent />
            </Canvas>
        </div>
    );
}
