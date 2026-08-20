import { Suspense, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { ContactShadows, Environment } from '@react-three/drei'
import { Scene } from './Scene'
import { RevealModal } from './RevealModal'
import type { Prize } from './prizes'
import styles from './ClawMachine3D.module.css'

function CabinetFrame() {
  const roseGold = '#e0b3a0'
  return (
    <group>
      {/* Four corner posts */}
      {[[-1, 0, -1], [1, 0, -1], [-1, 0, 1], [1, 0, 1]].map((p, i) => (
        <mesh key={i} position={[p[0] as number, 0.4, p[2] as number]} castShadow>
          <cylinderGeometry args={[0.04, 0.04, 2.6, 16]} />
          <meshPhysicalMaterial color={roseGold} metalness={0.95} roughness={0.15} />
        </mesh>
      ))}
      {/* Glass panels (front only shown for brevity — mirror for sides) */}
      <mesh position={[0, 0.4, -1]}>
        <planeGeometry args={[2, 2.6]} />
        <meshPhysicalMaterial
          color="#ffffff"
          transparent
          opacity={0.08}
          roughness={0.05}
          transmission={0.95}
          thickness={0.2}
        />
      </mesh>
      {/* Top canopy */}
      <mesh position={[0, 1.75, 0]} castShadow>
        <boxGeometry args={[2.1, 0.12, 2.1]} />
        <meshPhysicalMaterial color={roseGold} metalness={0.9} roughness={0.2} />
      </mesh>
    </group>
  )
}

export interface ClawMachine3DProps {
  onComplete: () => void
}

export function ClawMachine3D({ onComplete }: ClawMachine3DProps) {
  const [revealPrize, setRevealPrize] = useState<Prize | null>(null)
  const [caughtCount, setCaughtCount] = useState(0)

  return (
    <div className={styles.wrap}>
      <h1 className={styles.heading}>Catch Your Gift 🎀</h1>

      <div className={styles.canvasFrame}>
        <Canvas shadows camera={{ position: [0, 1.6, 3.4], fov: 42 }}>
          <Suspense fallback={null}>
            {/* Soft cinematic studio lighting */}
            <ambientLight intensity={0.35} />
            <directionalLight
              position={[2, 4, 2]}
              intensity={1.1}
              castShadow
              shadow-mapSize={[2048, 2048]}
              color="#fff1e6"
            />
            <spotLight position={[-2, 3, 1]} angle={0.4} penumbra={0.8} intensity={0.6} color="#ffd9c2" />
            <Environment preset="studio" />

            <CabinetFrame />
            <Scene
              onCatch={(prize) => {
                setRevealPrize(prize)
                setCaughtCount((c) => c + 1)
              }}
            />
          </Suspense>
        </Canvas>
      </div>

      <p className={styles.hint}>Drag the claw left and right, then press Drop.</p>

      {caughtCount >= 1 && !revealPrize && (
        <button type="button" className={styles.continueButton} onClick={onComplete}>
          Continue →
        </button>
      )}

      {revealPrize && <RevealModal prize={revealPrize} onClose={() => setRevealPrize(null)} />}
    </div>
  )
}
