'use client'

import { useMemo, useRef } from 'react'
import styles from './RoomScene.module.css'
import * as THREE from 'three'
import { Canvas, useFrame } from '@react-three/fiber'
import { Environment, OrbitControls } from '@react-three/drei'

/*
 * React/TypeScript can lose React Three Fiber's JSX intrinsic-element
 * declarations depending on the installed React + R3F type versions.
 * These declarations keep this scene compatible with the project's
 * current TypeScript setup without changing the runtime behavior.
 */
declare global {
  namespace JSX {
    interface IntrinsicElements {
      group: any
      mesh: any
      pointLight: any
      color: any
      ambientLight: any
      hemisphereLight: any
      boxGeometry: any
      cylinderGeometry: any
      sphereGeometry: any
      meshBasicMaterial: any
      meshStandardMaterial: any
      meshPhysicalMaterial: any
    }
  }
}

interface RoomSceneProps {
  transitionProgress?: number
  interactive?: boolean
}

interface RoomInteriorProps {
  transitionProgress: number
}

function RoomInterior({ transitionProgress }: RoomInteriorProps) {
  const groupRef = useRef<THREE.Group>(null)

  const candleLight = useRef<THREE.PointLight>(null)
  const warmLight = useRef<THREE.PointLight>(null)

  /*
   * Room dimensions.
   */
  const room = useMemo(
    () => ({
      width: 12,
      depth: 10,
      height: 7,
    }),
    [],
  )

  /*
   * Materials are created once.
   */
  const materials = useMemo(() => {
    return {
      floor: new THREE.MeshStandardMaterial({
        color: '#17121b',
        roughness: 0.72,
        metalness: 0.05,
      }),

      wall: new THREE.MeshStandardMaterial({
        color: '#21182a',
        roughness: 0.85,
        metalness: 0,
      }),

      ceiling: new THREE.MeshStandardMaterial({
        color: '#0d0b13',
        roughness: 1,
      }),

      wood: new THREE.MeshStandardMaterial({
        color: '#3a211c',
        roughness: 0.55,
        metalness: 0.05,
      }),

      gold: new THREE.MeshStandardMaterial({
        color: '#c9943c',
        roughness: 0.28,
        metalness: 0.72,
      }),

      fabric: new THREE.MeshStandardMaterial({
        color: '#6b314c',
        roughness: 0.9,
        metalness: 0,
      }),

      glass: new THREE.MeshPhysicalMaterial({
        color: '#9bc7ff',
        transparent: true,
        opacity: 0.22,
        roughness: 0.08,
        metalness: 0,
        transmission: 0.25,
      }),

      cake: new THREE.MeshStandardMaterial({
        color: '#fff0df',
        roughness: 0.78,
      }),

      icing: new THREE.MeshStandardMaterial({
        color: '#f7c8d9',
        roughness: 0.7,
      }),

      candle: new THREE.MeshStandardMaterial({
        color: '#fff4d6',
        roughness: 0.4,
      }),
    }
  }, [])

  /*
   * Camera-transition visual behavior.
   *
   * As transitionProgress approaches 1:
   *
   * 0   = normal room
   * 0.5 = camera leaving room
   * 1   = room almost completely gone
   */
  useFrame((state: { clock: THREE.Clock }, delta: number) => {
    if (!groupRef.current) return

    const progress = THREE.MathUtils.clamp(
      transitionProgress,
      0,
      1,
    )

    /*
     * Room slowly moves downward and backward,
     * creating the feeling that the camera is leaving it.
     */
    groupRef.current.position.y = -progress * 3.5
    groupRef.current.position.z = progress * 2.5

    /*
     * Slight cinematic rotation.
     */
    groupRef.current.rotation.x =
      THREE.MathUtils.lerp(
        0,
        -0.035,
        progress,
      )

    /*
     * Lights fade as the camera exits.
     */
    if (warmLight.current) {
      warmLight.current.intensity =
        THREE.MathUtils.lerp(
          4.2,
          0,
          progress,
        )
    }

    if (candleLight.current) {
      candleLight.current.intensity =
        THREE.MathUtils.lerp(
          2.8,
          0,
          progress,
        )
    }

    /*
     * Very subtle floating movement.
     */
    const elapsed = state.clock.getElapsedTime()

    groupRef.current.position.x =
      Math.sin(elapsed * 0.18) * 0.025

    /*
     * Prevent unused delta warnings while keeping
     * the animation frame stable.
     */
    void delta
  })

  return (
    <group ref={groupRef}>

      {/* =====================================================
          FLOOR
      ===================================================== */}

      <mesh
        position={[
          0,
          -room.height / 2,
          0,
        ]}
        receiveShadow
        material={materials.floor}
      >
        <boxGeometry
          args={[
            room.width,
            0.35,
            room.depth,
          ]}
        />
      </mesh>


      {/* =====================================================
          BACK WALL
      ===================================================== */}

      <mesh
        position={[
          0,
          room.height / 2 - 0.15,
          -room.depth / 2,
        ]}
        receiveShadow
        material={materials.wall}
      >
        <boxGeometry
          args={[
            room.width,
            room.height,
            0.3,
          ]}
        />
      </mesh>


      {/* =====================================================
          LEFT WALL
      ===================================================== */}

      <mesh
        position={[
          -room.width / 2,
          room.height / 2 - 0.15,
          0,
        ]}
        receiveShadow
        material={materials.wall}
      >
        <boxGeometry
          args={[
            0.3,
            room.height,
            room.depth,
          ]}
        />
      </mesh>


      {/* =====================================================
          RIGHT WALL
      ===================================================== */}

      <mesh
        position={[
          room.width / 2,
          room.height / 2 - 0.15,
          0,
        ]}
        receiveShadow
        material={materials.wall}
      >
        <boxGeometry
          args={[
            0.3,
            room.height,
            room.depth,
          ]}
        />
      </mesh>


      {/* =====================================================
          CEILING
      ===================================================== */}

      <mesh
        position={[
          0,
          room.height,
          0,
        ]}
        material={materials.ceiling}
      >
        <boxGeometry
          args={[
            room.width,
            0.3,
            room.depth,
          ]}
        />
      </mesh>


      {/* =====================================================
          WINDOW
      ===================================================== */}

      <group
        position={[
          0,
          3.4,
          -4.78,
        ]}
      >

        {/* Window frame */}

        <mesh material={materials.wood}>
          <boxGeometry
            args={[
              5.2,
              3.4,
              0.25,
            ]}
          />
        </mesh>


        {/* Night sky glass */}

        <mesh
          position={[
            0,
            0,
            0.14,
          ]}
          material={materials.glass}
        >
          <boxGeometry
            args={[
              4.7,
              2.9,
              0.05,
            ]}
          />
        </mesh>


        {/* Vertical divider */}

        <mesh
          position={[
            0,
            0,
            0.25,
          ]}
          material={materials.wood}
        >
          <boxGeometry
            args={[
              0.12,
              3.1,
              0.18,
            ]}
          />
        </mesh>


        {/* Horizontal divider */}

        <mesh
          position={[
            0,
            0,
            0.25,
          ]}
          material={materials.wood}
        >
          <boxGeometry
            args={[
              5,
              0.12,
              0.18,
            ]}
          />
        </mesh>

      </group>


      {/* =====================================================
          TABLE
      ===================================================== */}

      <group position={[0, -0.9, 0.5]}>

        {/* Table top */}

        <mesh
          position={[0, 1.65, 0]}
          castShadow
          receiveShadow
          material={materials.wood}
        >
          <boxGeometry
            args={[
              6.5,
              0.35,
              2.7,
            ]}
          />
        </mesh>


        {/* Table legs */}

        {[
          [-2.7, 0, -0.9],
          [2.7, 0, -0.9],
          [-2.7, 0, 0.9],
          [2.7, 0, 0.9],
        ].map(([x, y, z], index) => (
          <mesh
            key={index}
            position={[
              x,
              0,
              z,
            ]}
            castShadow
            material={materials.wood}
          >
            <cylinderGeometry
              args={[
                0.18,
                0.23,
                3,
                12,
              ]}
            />
          </mesh>
        ))}


        {/* =================================================
            CAKE
        ================================================= */}

        <group position={[0, 2.05, 0]}>

          {/* Bottom cake */}

          <mesh
            castShadow
            material={materials.cake}
          >
            <cylinderGeometry
              args={[
                1.45,
                1.55,
                0.8,
                64,
              ]}
            />
          </mesh>


          {/* Cake icing */}

          <mesh
            position={[0, 0.45, 0]}
            castShadow
            material={materials.icing}
          >
            <cylinderGeometry
              args={[
                1.35,
                1.42,
                0.18,
                64,
              ]}
            />
          </mesh>


          {/* Cake top */}

          <mesh
            position={[0, 0.52, 0]}
            castShadow
            material={materials.cake}
          >
            <cylinderGeometry
              args={[
                1.3,
                1.3,
                0.18,
                64,
              ]}
            />
          </mesh>


          {/* Candles */}

          {[-0.55, -0.18, 0.18, 0.55].map(
            (x, index) => (
              <group
                key={index}
                position={[
                  x,
                  0.85,
                  index % 2 === 0
                    ? -0.15
                    : 0.15,
                ]}
              >

                <mesh
                  castShadow
                  material={materials.candle}
                >
                  <cylinderGeometry
                    args={[
                      0.055,
                      0.055,
                      0.65,
                      16,
                    ]}
                  />
                </mesh>


                {/* Flame */}

                <mesh
                  position={[
                    0,
                    0.43,
                    0,
                  ]}
                >
                  <sphereGeometry
                    args={[
                      0.075,
                      12,
                      12,
                    ]}
                  />

                  <meshBasicMaterial
                    color="#ffd166"
                  />
                </mesh>

              </group>
            ),
          )}

        </group>

      </group>


      {/* =====================================================
          WARM ROOM LIGHT
      ===================================================== */}

      <pointLight
        ref={warmLight}
        position={[
          0,
          3.8,
          1,
        ]}
        color="#ffd28a"
        intensity={4.2}
        distance={12}
        decay={2}
        castShadow
      />


      {/* =====================================================
          CANDLE LIGHT
      ===================================================== */}

      <pointLight
        ref={candleLight}
        position={[
          0,
          1.8,
          0.5,
        ]}
        color="#ffb347"
        intensity={2.8}
        distance={7}
        decay={2}
      />


      {/* =====================================================
          DECORATIVE GOLDEN LIGHTS
      ===================================================== */}

      {[
        [-4.8, 2.8, -4.5],
        [-3.2, 3.3, -4.5],
        [-1.6, 3.0, -4.5],
        [1.6, 3.0, -4.5],
        [3.2, 3.3, -4.5],
        [4.8, 2.8, -4.5],
      ].map(([x, y, z], index) => (
        <pointLight
          key={index}
          position={[x, y, z]}
          color={
            index % 2 === 0
              ? '#ffd166'
              : '#f5a6c8'
          }
          intensity={0.45}
          distance={3}
          decay={2}
        />
      ))}


      {/* =====================================================
          CURTAIN LEFT
      ===================================================== */}

      <mesh
        position={[
          -3.2,
          3.3,
          -4.5,
        ]}
        castShadow
        material={materials.fabric}
      >
        <boxGeometry
          args={[
            1.2,
            3.7,
            0.3,
          ]}
        />
      </mesh>


      {/* =====================================================
          CURTAIN RIGHT
      ===================================================== */}

      <mesh
        position={[
          3.2,
          3.3,
          -4.5,
        ]}
        castShadow
        material={materials.fabric}
      >
        <boxGeometry
          args={[
            1.2,
            3.7,
            0.3,
          ]}
        />
      </mesh>

    </group>
  )
}


/* ============================================================
   CAMERA
============================================================ */

function CinematicCamera({
  transitionProgress,
}: {
  transitionProgress: number
}) {
  useFrame(({ camera }: { camera: THREE.Camera }) => {
    const progress = THREE.MathUtils.clamp(
      transitionProgress,
      0,
      1,
    )

    /*
     * Starting position inside the room.
     */
    const startPosition = new THREE.Vector3(
      0,
      1.1,
      8.8,
    )

    /*
     * Final position outside/above the room.
     * The previous z endpoint (1.5) was still inside the room, so on both
     * desktop and narrow phone aspect ratios the camera looked like it
     * stopped before actually leaving through the window.
     */
    const endPosition = new THREE.Vector3(
      0,
      8.2,
      -9.5,
    )

    /*
     * Cinematic easing.
     */
    const eased =
      progress * progress * (3 - 2 * progress)

    camera.position.lerpVectors(
      startPosition,
      endPosition,
      eased,
    )

    /*
     * Camera looks toward the window first,
     * then increasingly toward the sky.
     */
    const target = new THREE.Vector3(
      0,
      THREE.MathUtils.lerp(
        2.2,
        9.5,
        eased,
      ),
      THREE.MathUtils.lerp(
        -3.5,
        -10.5,
        eased,
      ),
    )

    camera.lookAt(target)

    camera.rotation.z =
      Math.sin(progress * Math.PI) *
      0.015

    /*
     * Cinematic field of view.
     */
    const perspectiveCamera =
      camera as THREE.PerspectiveCamera

    const isPortrait =
      perspectiveCamera.aspect < 0.82

    perspectiveCamera.fov =
      THREE.MathUtils.lerp(
        isPortrait ? 58 : 52,
        isPortrait ? 72 : 68,
        eased,
      )

    perspectiveCamera.updateProjectionMatrix()
  })

  return null
}


/* ============================================================
   MAIN ROOM SCENE
============================================================ */

/* ============================================================
   MAIN ROOM SCENE
============================================================ */

export default function RoomScene({
  transitionProgress = 0,
  interactive = false,
}: RoomSceneProps) {
  return (
    <div className={styles.roomScene}>
      <div className={styles.canvas}>
        <Canvas
          shadows
          dpr={[1, typeof window !== 'undefined' && window.innerWidth < 768 ? 1.25 : 1.5]}
          camera={{
            position: [0, 1.1, 8.8],
            fov: 52,
            near: 0.1,
            far: 100,
          }}
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: 'high-performance',
          }}
        >
          {/* =================================================
              BACKGROUND
          ================================================= */}

          <color
            attach="background"
            args={['#100b18']}
          />

          {/* =================================================
              GLOBAL LIGHTING
          ================================================= */}

          <ambientLight
            color="#4c3658"
            intensity={0.65}
          />

          <hemisphereLight
            args={[
              '#46335f',
              '#120d18',
              0.7,
            ]}
          />

          {/* =================================================
              ROOM
          ================================================= */}

          <RoomInterior
            transitionProgress={
              transitionProgress
            }
          />

          {/* =================================================
              CINEMATIC CAMERA
          ================================================= */}

          <CinematicCamera
            transitionProgress={
              transitionProgress
            }
          />

          {/* =================================================
              OPTIONAL CONTROLS
          ================================================= */}

          {interactive && (
            <OrbitControls
              enablePan={false}
              enableZoom={false}
              minPolarAngle={Math.PI * 0.3}
              maxPolarAngle={Math.PI * 0.65}
            />
          )}

          {/* =================================================
              ENVIRONMENT
          ================================================= */}

          <Environment
            preset="night"
            environmentIntensity={0.25}
          />
        </Canvas>
      </div>
    </div>
  )
}