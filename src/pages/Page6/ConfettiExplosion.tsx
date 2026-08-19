import { useEffect, useRef } from 'react'
import { useReducedMotion } from 'framer-motion'
import type { ConfettiParticle } from './types'
import styles from './ConfettiExplosion.module.css'

export interface ConfettiExplosionProps {
  count?: number
  duration?: number
}

const COLORS = ['#FF75A0', '#FF2E93', '#FCE38A', '#FF6B6B', '#4ECDC4', '#B18CFF']

export function ConfettiExplosion({ count = 400, duration = 2600 }: ConfettiExplosionProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const prefersReducedMotion = useReducedMotion()

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx || prefersReducedMotion) return

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const particles: ConfettiParticle[] = Array.from({ length: count }, () => ({
      x: Math.random() * canvas.width,
      y: -20 - Math.random() * canvas.height * 0.4,
      vx: (Math.random() - 0.5) * 6,
      vy: Math.random() * 4 + 2,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 10,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      size: Math.random() * 8 + 4,
    }))

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    window.addEventListener('resize', resize)

    const start = performance.now()
    let raf = 0
    const frame = (now: number) => {
      const elapsed = now - start
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      for (const p of particles) {
        p.x += p.vx
        p.y += p.vy
        p.vy += 0.15
        p.rotation += p.rotationSpeed
        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate((p.rotation * Math.PI) / 180)
        ctx.globalAlpha = Math.max(0, 1 - elapsed / duration)
        ctx.fillStyle = p.color
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6)
        ctx.restore()
      }
      if (elapsed < duration) {
        raf = requestAnimationFrame(frame)
      }
    }
    raf = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [count, duration, prefersReducedMotion])

  if (prefersReducedMotion) return null

  return <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />
}
