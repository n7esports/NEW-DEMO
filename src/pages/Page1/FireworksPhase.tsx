import { useEffect, useRef } from 'react'
import { useReducedMotion } from 'framer-motion'
import type { Particle } from './types'
import styles from './FireworksPhase.module.css'

export interface FireworksPhaseProps {
  onComplete: () => void
}

const PARTICLE_COLORS = ['#FF75A0', '#FF2E93', '#FCE38A', '#FFFFFF', '#B18CFF']
const BALLOON_COLORS = ['#FF75A0', '#FF2E93', '#FCE38A', '#B18CFF', '#4ECDC4', '#FF75A0', '#FCE38A']
// Cinematic length: enough time for several overlapping bursts to breathe,
// rather than one or two blink-and-you-miss-it explosions.
const PHASE_DURATION_MS = 8000
const BURST_INTERVAL_MS = 550
// Stop launching new bursts a little before the phase ends, so the last
// burst has time to fully fade instead of getting cut off by the transition.
const LAST_BURST_MARGIN_MS = 1800

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
      const count = 70
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count
        const speed = 2.5 + Math.random() * 3.5
        particlesRef.current.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 0,
          // Longer, more varied particle lifetime so each burst lingers and
          // trails off gracefully instead of vanishing almost instantly.
          maxLife: 90 + Math.random() * 50,
          color: PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)],
          size: 2.5 + Math.random() * 2.5,
        })
      }
    }

    launchBurst(canvas.width / 2, canvas.height * 0.35)
    const burstTimer = window.setInterval(() => {
      launchBurst(canvas.width * (0.15 + Math.random() * 0.7), canvas.height * (0.18 + Math.random() * 0.35))
    }, BURST_INTERVAL_MS)
    const stopBurstsTimer = window.setTimeout(() => {
      window.clearInterval(burstTimer)
    }, PHASE_DURATION_MS - LAST_BURST_MARGIN_MS)

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
      window.clearTimeout(stopBurstsTimer)
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
  return (
    <div className={styles.wrap}>
      <canvas ref={canvasRef} className={styles.canvas} />

      <h1 className={styles.celebrationTitle} aria-hidden="true">
        {'Happy Birthday'.split('').map((char, i) => (
          <span
            key={i}
            className={styles.celebrationLetter}
            style={{ animationDelay: `${0.4 + i * 0.05}s` }}
          >
            {char === ' ' ? '\u00A0' : char}
          </span>
        ))}
      </h1>

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
