import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'framer-motion'
import type { CSSProperties } from 'react'
import type { Particle } from './types'
import styles from './CelebrationPhase.module.css'

export interface CelebrationPhaseProps {
  onComplete: () => void
}

const CELEBRATION_DURATION_MS = 15000
const CELEBRATION_DELAY_MS = 1500
const WISHES = [
  'Happy Birthday, Arfa! May Allah bless you with endless happiness, good health, and all the success your heart desires. You are truly a gift to everyone who knows you.',
  'On your special day, I pray that every step you take leads you closer to your dreams. May this year bring you peace, love, and countless beautiful moments. Stay blessed, Arfa!',
  'Happy Birthday to someone so special! May your life be filled with as much kindness and warmth as you generously give to others. You deserve all the joy in the world.',
  "Arfa, may Allah's choicest blessings rain down on you today and always. Keep shining, keep smiling, and never stop being the amazing person you are.",
  "Wishing you a birthday that's as beautiful as your heart. May your days be bright, your worries be light, and your prayers always be answered.",
  'Happy Birthday, Arfa! May this new year of your life bring you closer to everything you\'ve prayed for, whether it is success, love, peace, or endless joy.',
  'On your birthday, I thank God for creating someone as wonderful as you. May He guard you, guide you, and grant you all the happiness your heart can hold.',
  "Arfa, may your today be filled with love, your tomorrow with hope, and your every day with Allah's mercy and grace. Happy Birthday, dear one!",
  'Happy Birthday! May the candles on your cake remind you of the light you bring into this world. Stay blessed, stay golden, and always stay true to yourself.',
  'Sending you warm wishes and heartfelt prayers on your birthday, Arfa. May every moment of your life be as special as you are to all of us.',
  'May Allah grant you a long, healthy, and prosperous life filled with love and laughter. You are in my prayers today and always. Happy Birthday, Arfa!',
  'Happy Birthday to a soul so pure and kind! May your heart always find peace, your mind always find clarity, and your life always find purpose.',
  'Arfa, as you blow out your candles, know that you are loved, valued, and deeply appreciated. May every wish you make find its way to the heavens.',
  'Wishing you a day full of surprises, a year full of blessings, and a life full of meaning. Happy Birthday, Arfa, you are truly one of a kind.',
  "Happy Birthday, my dear Arfa! May Allah's love surround you, His mercy embrace you, and His blessings follow you wherever you go. Today and forever, you are cherished.",
]

const COLORS = ['#ff75a0', '#fce38a', '#4ecdc4', '#b18cff', '#ff9f68']

export function CelebrationPhase({ onComplete }: CelebrationPhaseProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const prefersReducedMotion = useReducedMotion()
  const [started, setStarted] = useState(false)

  useEffect(() => {
    const startTimeout = window.setTimeout(() => setStarted(true), CELEBRATION_DELAY_MS)
    const completeTimeout = window.setTimeout(
      onComplete,
      CELEBRATION_DELAY_MS + CELEBRATION_DURATION_MS,
    )
    return () => {
      window.clearTimeout(startTimeout)
      window.clearTimeout(completeTimeout)
    }
  }, [onComplete])

  useEffect(() => {
    if (!started) return

    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    if (!canvas || !context || prefersReducedMotion) return

    const particles: Particle[] = []
    let animationFrame = 0
    let burstTimer = 0

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    const burst = (x: number, y: number) => {
      for (let index = 0; index < 64; index += 1) {
        const angle = (Math.PI * 2 * index) / 64
        const speed = 2 + Math.random() * 3.5
        particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 1.2,
          life: 0,
          maxLife: 70 + Math.random() * 45,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          size: 1.5 + Math.random() * 2.5,
        })
      }
    }

    const frame = () => {
      context.clearRect(0, 0, canvas.width, canvas.height)
      for (const particle of particles) {
        particle.x += particle.vx
        particle.y += particle.vy
        particle.vy += 0.025
        particle.life += 1
        context.globalAlpha = Math.max(0, 1 - particle.life / particle.maxLife)
        context.fillStyle = particle.color
        context.beginPath()
        context.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
        context.fill()
      }
      context.globalAlpha = 1
      for (let index = particles.length - 1; index >= 0; index -= 1) {
        if (particles[index].life >= particles[index].maxLife) particles.splice(index, 1)
      }
      animationFrame = requestAnimationFrame(frame)
    }

    resize()
    burst(canvas.width * 0.5, canvas.height * 0.3)
    burstTimer = window.setInterval(() => {
      burst(canvas.width * (0.12 + Math.random() * 0.76), canvas.height * (0.16 + Math.random() * 0.36))
    }, 700)
    window.addEventListener('resize', resize)
    animationFrame = requestAnimationFrame(frame)

    return () => {
      window.clearInterval(burstTimer)
      window.cancelAnimationFrame(animationFrame)
      window.removeEventListener('resize', resize)
    }
  }, [prefersReducedMotion, started])

  return (
    <div className={`${styles.wrap} ${started ? styles.active : ''}`} aria-live="polite">
      <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />
      <div className={styles.sparkles} aria-hidden="true">✦　✧　✦　⋆　✧　✦</div>
      <div className={styles.wishes} aria-label="Birthday wishes">
        {WISHES.map((wish, index) => (
          <p
            className={styles.wish}
            key={wish}
            style={{
              left: `${4 + ((index * 23) % 88)}%`,
              animationDelay: `${index * 0.65}s`,
              animationDuration: `${9 + (index % 4)}s`,
              '--wish-color': COLORS[index % COLORS.length],
            } as CSSProperties}
          >
            {wish}
          </p>
        ))}
      </div>
    </div>
  )
}

export default CelebrationPhase
