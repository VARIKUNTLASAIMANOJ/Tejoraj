import { Stars, useTexture } from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import { useRef } from 'react';

/* ──────── TEXTURED EARTH ──────── */
function Earth() {
    const earthRef = useRef();
    const atmosphereRef = useRef();
    const texture = useTexture(
        '/textures/earth.jpg'
    );

    useFrame(({ clock }) => {
        const t = clock.getElapsedTime();
        if (earthRef.current) {
            earthRef.current.rotation.y = t * 0.06;
        }
        if (atmosphereRef.current) {
            atmosphereRef.current.scale.setScalar(1.0 + Math.sin(t * 0.5) * 0.005);
        }
    });

    return (
        <group>
            {/* Earth with equirectangular texture */}
            <mesh ref={earthRef}>
                <sphereGeometry args={[2.5, 64, 64]} />
                <meshStandardMaterial map={texture} roughness={1} metalness={0} />
            </mesh>



            {/* Sun-like directional light */}
            <directionalLight position={[5, 3, 5]} intensity={1.5} color="#fff5e0" />
            <ambientLight intensity={0.4} />
        </group>
    );
}

/* ──────── EXPORTED COMPONENT ──────── */
export default function SpinningEarth() {
    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            zIndex: 0,
            background: '#030303',
        }}>
            <Canvas
                camera={{ position: [0, 0, 8], fov: 50 }}
                style={{ width: '100%', height: '100%' }}
                gl={{ antialias: true, alpha: true }}
            >
                <Stars radius={200} depth={60} count={4000} factor={3} saturation={0} fade speed={0.3} />
                <Earth />
            </Canvas>
        </div>
    );
}
