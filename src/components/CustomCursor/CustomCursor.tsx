import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'framer-motion'
import styles from './CustomCursor.module.css'

export interface CustomCursorProps {
  sparkleCount?: number
  trailLength?: number
}

interface Sparkle {
  id: number
  x: number
  y: number
}

let sparkleId = 0

export function CustomCursor({ trailLength = 12 }: CustomCursorProps) {
  const prefersReducedMotion = useReducedMotion()
  const dotRef = useRef<HTMLDivElement>(null)
  const [sparkles, setSparkles] = useState<Sparkle[]>([])
  const lastSpawn = useRef(0)
  const cleanupTimersRef = useRef<number[]>([])

  useEffect(() => {
    if (prefersReducedMotion) return
    // Skip entirely on touch-only devices (no real mouse to follow)
    if (window.matchMedia('(hover: none)').matches) return

    const handleMove = (e: MouseEvent) => {
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`
      }
      const now = performance.now()
      if (now - lastSpawn.current > 40) {
        lastSpawn.current = now
        const id = sparkleId++
        setSparkles((prev) => [...prev.slice(-trailLength), { id, x: e.clientX, y: e.clientY }])
        const timer = window.setTimeout(() => {
          setSparkles((prev) => prev.filter((s) => s.id !== id))
          cleanupTimersRef.current = cleanupTimersRef.current.filter((t) => t !== timer)
        }, 700)
        cleanupTimersRef.current.push(timer)
      }
    }

    window.addEventListener('mousemove', handleMove)
    return () => {
      window.removeEventListener('mousemove', handleMove)
      cleanupTimersRef.current.forEach((timer) => window.clearTimeout(timer))
      cleanupTimersRef.current = []
    }
  }, [prefersReducedMotion, trailLength])

  if (prefersReducedMotion) return null

  return (
    <div className={`${styles.customCursorRoot} customCursorRoot`} aria-hidden="true">
      <div ref={dotRef} className={styles.dot} />
      {sparkles.map((s) => (
        <span key={s.id} className={styles.sparkle} style={{ left: s.x, top: s.y }} />
      ))}
    </div>
  )
}
