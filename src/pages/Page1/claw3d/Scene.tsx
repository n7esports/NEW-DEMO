import { Physics, usePlane } from '@react-three/cannon'
import { Environment, ContactShadows } from '@react-three/drei'
import { useState, useCallback } from 'react'
import { GiftBox, type GiftBoxHandle } from './GiftBox'
import { Claw } from './Claw'
import { pickWeightedPrize, type Prize } from './prizes'

function Floor() {
  const [ref] = usePlane(() => ({ rotation: [-Math.PI / 2, 0, 0], position: [0, -0.8, 0] }))
  return (
    <mesh ref={ref as any} receiveShadow>
      <planeGeometry args={[3, 3]} />
      <meshStandardMaterial color="#151020" />
    </mesh>
  )
}

const WRAP_PRESETS = [
  { wrapColor: '#f4e3d7', ribbonColor: '#d4af37', finish: 'matte' as const },
  { wrapColor: '#5c1a2e', ribbonColor: '#e8c39e', finish: 'velvet' as const },
  { wrapColor: '#fdf6ec', ribbonColor: '#c48a5a', finish: 'silk' as const },
  { wrapColor: '#2c2438', ribbonColor: '#d4af37', finish: 'velvet' as const },
]

export function Scene({ onCatch }: { onCatch: (prize: Prize) => void }) {
  const [boxes, setBoxes] = useState<GiftBoxHandle[]>([])

  const registerBox = useCallback((handle: GiftBoxHandle) => {
    setBoxes((prev) => [...prev, handle])
  }, [])

  const layout: Array<{ id: string; position: [number, number, number] }> = [
    { id: 'b1', position: [-0.6, 0, -0.3] },
    { id: 'b2', position: [-0.2, 0.4, -0.1] },
    { id: 'b3', position: [0.2, 0, 0.2] },
    { id: 'b4', position: [0.6, 0.4, -0.2] },
    { id: 'b5', position: [0, 0.8, 0] },
    { id: 'b6', position: [-0.4, 0.4, 0.3] },
  ]

  return (
    <Physics gravity={[0, -9.8, 0]} defaultContactMaterial={{ friction: 0.5, restitution: 0.05 }}>
      <Floor />
      {layout.map((l, i) => (
        <GiftBox
          key={l.id}
          id={l.id}
          position={l.position}
          wrapColor={WRAP_PRESETS[i % WRAP_PRESETS.length].wrapColor}
          ribbonColor={WRAP_PRESETS[i % WRAP_PRESETS.length].ribbonColor}
          finish={WRAP_PRESETS[i % WRAP_PRESETS.length].finish}
          prize={pickWeightedPrize()}
          registerBox={registerBox}
        />
      ))}

      <Claw
        trackBounds={[-0.9, 0.9]}
        railZ={0}
        railY={1.1}
        chutePosition={[1.1, 1.1, -0.6]}
        boxes={boxes}
        onCatch={onCatch}
      />

      <ContactShadows position={[0, -0.79, 0]} opacity={0.5} scale={3} blur={2} far={1} />
      <Environment preset="studio" />
    </Physics>
  )
}
