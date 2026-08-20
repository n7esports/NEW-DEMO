import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { useGLTF, Environment, OrbitControls } from '@react-three/drei'
import type { Prize } from './prizes'
import styles from './RevealModal.module.css'

function Model({ path }: { path: string }) {
  const { scene } = useGLTF(path)
  return <primitive object={scene} scale={1.2} />
}

function FallbackShape() {
  // Shown if the GLB hasn't been dropped into /public/models yet.
  return (
    <mesh>
      <icosahedronGeometry args={[0.6, 0]} />
      <meshPhysicalMaterial color="#ff75a0" roughness={0.3} clearcoat={0.6} />
    </mesh>
  )
}

export function RevealModal({ prize, onClose }: { prize: Prize; onClose: () => void }) {
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
        <div className={styles.viewer}>
          <Canvas camera={{ position: [0, 0.4, 2], fov: 40 }}>
            <ambientLight intensity={0.6} />
            <directionalLight position={[2, 3, 2]} intensity={1} />
            <Environment preset="studio" />
            <Suspense fallback={<FallbackShape />}>
              <Model path={prize.modelPath} />
            </Suspense>
            <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={1.5} />
          </Canvas>
        </div>
        <h2 className={styles.title}>{prize.label}</h2>
        <button type="button" className={styles.closeButton} onClick={onClose}>
          Lovely →
        </button>
      </div>
    </div>
  )
}
