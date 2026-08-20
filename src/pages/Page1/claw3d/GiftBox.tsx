import { useRef } from 'react'
import { useBox } from '@react-three/cannon'
import * as THREE from 'three'
import type { Prize } from './prizes'

export interface GiftBoxHandle {
  id: string
  bodyApi: ReturnType<typeof useBox>[1]
  prize: Prize
  size: [number, number, number]
}

interface GiftBoxProps {
  id: string
  position: [number, number, number]
  size?: [number, number, number]
  wrapColor: string
  ribbonColor: string
  finish: 'matte' | 'velvet' | 'silk'
  prize: Prize
  registerBox: (handle: GiftBoxHandle) => void
}

const FINISH_PARAMS: Record<GiftBoxProps['finish'], { roughness: number; clearcoat: number; sheen: number }> = {
  matte: { roughness: 0.85, clearcoat: 0, sheen: 0 },
  velvet: { roughness: 0.95, clearcoat: 0.05, sheen: 1 },
  silk: { roughness: 0.25, clearcoat: 0.6, sheen: 0.4 },
}

export function GiftBox({ id, position, size = [0.5, 0.35, 0.5], wrapColor, ribbonColor, finish, prize, registerBox }: GiftBoxProps) {
  const [ref, api] = useBox(() => ({
    mass: 0.4,
    position,
    args: size,
    material: { friction: 0.6, restitution: 0.05 },
  }))

  const registered = useRef(false)
  if (!registered.current) {
    registered.current = true
    registerBox({ id, bodyApi: api, prize, size })
  }

  const { roughness, clearcoat, sheen } = FINISH_PARAMS[finish]

  return (
    <group ref={ref as any}>
      {/* Box body */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={size} />
        <meshPhysicalMaterial
          color={wrapColor}
          roughness={roughness}
          clearcoat={clearcoat}
          clearcoatRoughness={0.3}
          sheen={sheen}
          sheenColor={new THREE.Color(wrapColor).lerp(new THREE.Color('white'), 0.4)}
        />
      </mesh>

      {/* Ribbon - vertical strip */}
      <mesh castShadow position={[0, size[1] / 2 + 0.001, 0]}>
        <boxGeometry args={[size[0] * 0.14, 0.005, size[2] + 0.01]} />
        <meshPhysicalMaterial color={ribbonColor} roughness={0.2} clearcoat={0.8} metalness={0.1} />
      </mesh>

      {/* Ribbon - horizontal strip */}
      <mesh castShadow position={[0, size[1] / 2 + 0.001, 0]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[size[2] * 0.14, 0.005, size[0] + 0.01]} />
        <meshPhysicalMaterial color={ribbonColor} roughness={0.2} clearcoat={0.8} metalness={0.1} />
      </mesh>

      {/* Bow */}
      <mesh position={[0, size[1] / 2 + 0.06, 0]} castShadow>
        <torusKnotGeometry args={[0.05, 0.02, 40, 6]} />
        <meshPhysicalMaterial color={ribbonColor} roughness={0.15} clearcoat={0.9} />
      </mesh>
    </group>
  )
}
