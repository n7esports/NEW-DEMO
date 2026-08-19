import { useEffect, useRef } from 'react'
import { useReducedMotion } from 'framer-motion'
import type { Particle } from './types'
import styles from './FireworksPhase.module.css'

export interface FireworksPhaseProps {
  onComplete: () => void
}

const PARTICLE_COLORS = ['#FF75A0', '#FF2E93', '#FCE38A', '#FFFFFF', '#B18CFF']
const BALLOON_COLORS = ['#FF75A0', '#FF2E93', '#FCE38A', '#B18CFF', '#4ECDC4', '#FF75A0', '#FCE38A']
const PHASE_DURATION_MS = 4500

export function FireworksPhase({ onComplete }: FireworksPhaseProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const rafRef = useRef(0)
  const prefersReducedMotion = useReducedMotion()

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx || prefersReducedMotion) return

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const launchBurst = (x: number, y: number) => {
      const count = 40
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count
        const speed = 2 + Math.random() * 3
        particlesRef.current.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 0,
          maxLife: 55 + Math.random() * 25,
          color: PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)],
          size: 2 + Math.random() * 2,
        })
      }
    }

    launchBurst(canvas.width / 2, canvas.height * 0.35)
    const burstTimer = window.setInterval(() => {
      launchBurst(canvas.width * (0.2 + Math.random() * 0.6), canvas.height * (0.2 + Math.random() * 0.35))
    }, 700)

    const frame = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      for (const p of particlesRef.current) {
        p.x += p.vx
        p.y += p.vy
        p.vy += 0.04 // gravity
        p.life += 1
        const alpha = Math.max(0, 1 - p.life / p.maxLife)
        ctx.globalAlpha = alpha
        ctx.fillStyle = p.color
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fill()
      }
      particlesRef.current = particlesRef.current.filter((p) => p.life < p.maxLife)
      ctx.globalAlpha = 1
      rafRef.current = requestAnimationFrame(frame)
    }
    rafRef.current = requestAnimationFrame(frame)

    return () => {
      window.clearInterval(burstTimer)
      window.cancelAnimationFrame(rafRef.current)
      window.removeEventListener('resize', resize)
      particlesRef.current = []
    }
  }, [prefersReducedMotion])

  useEffect(() => {
    const timeout = window.setTimeout(onComplete, PHASE_DURATION_MS)
    return () => window.clearTimeout(timeout)
  }, [onComplete])

  return (
    <div className={styles.wrap}>
      <canvas ref={canvasRef} className={styles.canvas} />
      <div className={styles.balloonRow} aria-hidden="true">
        {BALLOON_COLORS.map((color, i) => (
          <span
            key={i}
            className={styles.decorBalloon}
            style={{ left: `${6 + i * 13}%`, animationDelay: `${i * 0.35}s`, background: color }}
          />
        ))}
      </div>
      <button type="button" className={styles.skip} onClick={onComplete}>
        Skip →
      </button>
    </div>
  )
}
