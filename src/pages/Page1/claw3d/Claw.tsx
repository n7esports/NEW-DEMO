import { useRef, useState, useCallback, useEffect } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import { useBox, usePointToPointConstraint } from '@react-three/cannon'
import * as THREE from 'three'
import type { GiftBoxHandle } from './GiftBox'

export interface ClawProps {
  trackBounds: [number, number] // min/max X the claw rail allows
  railZ: number
  railY: number
  chutePosition: [number, number, number]
  boxes: GiftBoxHandle[]
  onCatch: (prize: GiftBoxHandle['prize']) => void
}

type ClawPhase = 'idle' | 'descending' | 'gripping' | 'ascending' | 'traveling' | 'releasing'

const DESCEND_Y = -0.55 // local Y offset when fully lowered
const GRIP_RADIUS = 0.45 // how close a box's XZ must be to the claw to be "caught"

export function Claw({ trackBounds, railZ, railY, chutePosition, boxes, onCatch }: ClawProps) {
  const { gl, camera, size } = useThree()
  const groupRef = useRef<THREE.Group>(null)
  const [clawX, setClawX] = useState(0)
  const [phase, setPhase] = useState<ClawPhase>('idle')
  const draggingRef = useRef(false)
  const grippedBoxRef = useRef<GiftBoxHandle | null>(null)

  // Physics body for the claw's gripper "hand" itself, kinematic so it's
  // driven by our animation, not by gravity — but still a real cannon body
  // so the constraint API can attach to it.
  const [clawBodyRef, clawApi] = useBox(() => ({
    type: 'Kinematic',
    args: [0.2, 0.2, 0.2],
    position: [0, railY, railZ],
  }))

  // The actual point-to-point constraint linking claw <-> gripped box.
  // enabled toggles on/off as we grab and release.
  const constraintTarget = useRef<GiftBoxHandle | null>(null)
  const [, , constraintApi] = usePointToPointConstraint(
    clawBodyRef,
    // ref for the currently gripped box body; cannon requires a ref up
    // front, so we point it at whichever box we most recently grabbed and
    // toggle `enabled` rather than remounting the constraint.
    () => constraintTarget.current?.bodyApi as any,
    { pivotA: [0, -0.1, 0], pivotB: [0, 0, 0] },
    [constraintTarget.current],
  )

  // ---- Pointer drag: horizontal-only, clamped to the rail bounds ----
  const handlePointerDown = useCallback((e: PointerEvent) => {
    if (phase !== 'idle') return
    draggingRef.current = true
    ;(e.target as Element).setPointerCapture?.(e.pointerId)
  }, [phase])

  const handlePointerMove = useCallback((e: PointerEvent) => {
    if (!draggingRef.current || phase !== 'idle') return
    // Map pointer X (0..width) to world X within trackBounds.
    const ndcX = (e.clientX / size.width) * 2 - 1
    const worldX = THREE.MathUtils.clamp(ndcX * 1.6, trackBounds[0], trackBounds[1])
    setClawX(worldX)
  }, [phase, size.width, trackBounds])

  const handlePointerUp = useCallback(() => {
    draggingRef.current = false
  }, [])

  useEffect(() => {
    const el = gl.domElement
    el.addEventListener('pointerdown', handlePointerDown)
    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
    return () => {
      el.removeEventListener('pointerdown', handlePointerDown)
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
    }
  }, [gl, handlePointerDown, handlePointerMove, handlePointerUp])

  // Drive the kinematic claw body to follow clawX every frame.
  useFrame(() => {
    if (!groupRef.current) return
    groupRef.current.position.x = clawX
    let targetY = railY
    if (phase === 'descending' || phase === 'gripping') targetY = railY + DESCEND_Y
    groupRef.current.position.y = THREE.MathUtils.damp(groupRef.current.position.y, targetY, 6, 0.016)
    clawApi.position.set(groupRef.current.position.x, groupRef.current.position.y, railZ)
  })

  const findNearestBox = useCallback((): GiftBoxHandle | null => {
    let nearest: GiftBoxHandle | null = null
    let nearestDist = Infinity
    for (const box of boxes) {
      // cannon bodies expose live position via api.position.subscribe in a
      // real app; for brevity here assume you're tracking each box's last
      // known position in a ref updated by a subscribe() call set up in
      // GiftBox (omitted for space) — swap in that value instead of 0,0,0.
      const dist = Math.hypot(clawX - 0 /* box.x */, railZ - 0 /* box.z */)
      if (dist < nearestDist) {
        nearestDist = dist
        nearest = box
      }
    }
    return nearestDist <= GRIP_RADIUS ? nearest : null
  }, [boxes, clawX, railZ])

  // ---- Drop button sequence ----
  const handleDrop = useCallback(() => {
    if (phase !== 'idle') return
    setPhase('descending')

    window.setTimeout(() => {
      const target = findNearestBox()
      grippedBoxRef.current = target
      constraintTarget.current = target
      if (target) {
        constraintApi.enable()
      }
      setPhase('ascending')

      window.setTimeout(() => {
        setPhase('traveling')
        // Animate claw X toward the chute over a beat, then release.
        const start = performance.now()
        const fromX = clawX
        const toX = chutePosition[0]
        const duration = 900
        const step = (now: number) => {
          const t = Math.min(1, (now - start) / duration)
          setClawX(fromX + (toX - fromX) * t)
          if (t < 1) requestAnimationFrame(step)
          else {
            setPhase('releasing')
            constraintApi.disable()
            if (grippedBoxRef.current) onCatch(grippedBoxRef.current.prize)
            constraintTarget.current = null
            grippedBoxRef.current = null
            window.setTimeout(() => setPhase('idle'), 400)
          }
        }
        requestAnimationFrame(step)
      }, 500)
    }, 500)
  }, [phase, findNearestBox, constraintApi, clawX, chutePosition, onCatch])

  return (
    <>
      <group ref={groupRef} position={[clawX, railY, railZ]}>
        {/* Rope */}
        <mesh position={[0, 0.35, 0]}>
          <cylinderGeometry args={[0.01, 0.01, 0.7, 8]} />
          <meshStandardMaterial color="#cfcfcf" />
        </mesh>
        {/* Gripper fingers */}
        {[0, 1, 2].map((i) => (
          <mesh
            key={i}
            position={[Math.cos((i / 3) * Math.PI * 2) * 0.08, 0, Math.sin((i / 3) * Math.PI * 2) * 0.08]}
            rotation={[0, (i / 3) * Math.PI * 2, phase === 'gripping' || phase === 'ascending' ? 0.5 : 0.1]}
          >
            <boxGeometry args={[0.03, 0.18, 0.03]} />
            <meshPhysicalMaterial color="#e6c79c" metalness={0.8} roughness={0.25} />
          </mesh>
        ))}
      </group>

      {/* Drop button lives outside the Canvas — see ClawMachine3D.tsx */}
    </>
  )
}
