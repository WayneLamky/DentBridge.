import { Suspense, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Float, ContactShadows } from '@react-three/drei';

/**
 * 程序化建模的牙齿：
 * - 牙冠 (crown): 扁化的球体 + 四个咬合尖 (cusps)
 * - 牙颈 (neck): 过渡圆柱
 * - 双根 (roots): 两根外撇的锥形
 * 白色象牙材质 + clearcoat 模拟牙釉质光泽
 */
function Tooth(props) {
  const group = useRef();

  useFrame((state, delta) => {
    if (!group.current) return;
    // 缓慢自转
    group.current.rotation.y += delta * 0.35;
  });

  const enamel = (
    <meshPhysicalMaterial
      color="#f8f4e9"
      roughness={0.18}
      metalness={0.04}
      clearcoat={1}
      clearcoatRoughness={0.08}
      sheen={0.4}
      sheenColor="#ffffff"
    />
  );

  // 四个咬合尖的坐标
  const cusps = [
    [0.45, 0.92, 0.45],
    [-0.45, 0.92, 0.45],
    [0.45, 0.92, -0.45],
    [-0.45, 0.92, -0.45],
  ];

  return (
    <group ref={group} {...props}>
      {/* 牙冠：扁化的球 */}
      <mesh position={[0, 0.5, 0]} scale={[1.1, 0.85, 1.1]} castShadow receiveShadow>
        <sphereGeometry args={[0.95, 64, 64]} />
        {enamel}
      </mesh>

      {/* 咬合面四个尖 */}
      {cusps.map((p, i) => (
        <mesh key={i} position={p} castShadow>
          <sphereGeometry args={[0.22, 32, 32]} />
          {enamel}
        </mesh>
      ))}

      {/* 牙颈过渡 */}
      <mesh position={[0, -0.15, 0]} castShadow>
        <cylinderGeometry args={[0.85, 0.75, 0.3, 48]} />
        {enamel}
      </mesh>

      {/* 左牙根 */}
      <mesh position={[-0.42, -0.95, 0]} rotation={[Math.PI, 0, -0.18]} castShadow>
        <cylinderGeometry args={[0.08, 0.36, 1.35, 32]} />
        {enamel}
      </mesh>

      {/* 右牙根 */}
      <mesh position={[0.42, -0.95, 0]} rotation={[Math.PI, 0, 0.18]} castShadow>
        <cylinderGeometry args={[0.08, 0.36, 1.35, 32]} />
        {enamel}
      </mesh>
    </group>
  );
}

export default function ToothScene() {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [0, 0.3, 5], fov: 40 }}
      gl={{ antialias: true, alpha: true }}
      style={{ background: 'transparent' }}
    >
      {/* 光照：主 + 冷补 + 暖轮廓 */}
      <ambientLight intensity={0.35} />
      <directionalLight
        position={[4, 6, 5]}
        intensity={2.2}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <pointLight position={[-5, -2, 3]} color="#60a5fa" intensity={1.4} />
      <pointLight position={[5, -3, -3]} color="#fbbf24" intensity={0.8} />

      <Suspense fallback={null}>
        <Float speed={1.6} rotationIntensity={0.35} floatIntensity={0.9}>
          <Tooth position={[0, 0.1, 0]} scale={1.05} />
        </Float>

        <ContactShadows
          position={[0, -2.2, 0]}
          opacity={0.45}
          scale={8}
          blur={2.4}
          far={3}
          color="#000000"
        />
      </Suspense>

      {/* 允许用户拖拽观察，但禁用缩放/平移以防破坏布局 */}
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        minPolarAngle={Math.PI / 3}
        maxPolarAngle={Math.PI / 1.7}
        rotateSpeed={0.6}
      />
    </Canvas>
  );
}
