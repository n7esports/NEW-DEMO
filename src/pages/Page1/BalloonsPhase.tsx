import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useBeep } from '../../hooks/useBeep'
import type { Balloon } from './types'
import styles from './BalloonsPhase.module.css'

export interface BalloonsPhaseProps {
  wishText: string
  onComplete: () => void
}

const PLAYFUL_MESSAGES = [
  'Cheers to you! 🥂',
  'Another trip around the sun ☀️',
  "You're a whole vibe 🎉",
  'Confetti-approved 🎊',
  'Cake first, always 🍰',
  "Here's to more adventures 🚀",
]
const BALLOON_COLORS = ['#FF75A0', '#FF2E93', '#B18CFF', '#4ECDC4']
const WISH_BALLOON_ID = 'wish-balloon'

function makeBalloons(wishText: string): Balloon[] {
  const balloons: Balloon[] = PLAYFUL_MESSAGES.map((msg, i) => ({
    id: `msg-${i}`,
    x: 6 + i * (78 / PLAYFUL_MESSAGES.length) + Math.random() * 4,
    y: 0,
    color: BALLOON_COLORS[i % BALLOON_COLORS.length],
    speed: 7 + Math.random() * 3,
    wishText: msg,
    popped: false,
  }))
  balloons.splice(3, 0, {
    id: WISH_BALLOON_ID,
    x: 46,
    y: 0,
    color: '#FCE38A',
    speed: 8.5,
    wishText: wishText || 'Wishing you a year as amazing as you are! 🎂',
    popped: false,
  })
  return balloons
}

export function BalloonsPhase({ wishText, onComplete }: BalloonsPhaseProps) {
  const [balloons, setBalloons] = useState<Balloon[]>(() => makeBalloons(wishText))
  const [toast, setToast] = useState<string | null>(null)
  const [showPolaroid, setShowPolaroid] = useState(false)
  const { beep } = useBeep()
  const prefersReducedMotion = useReducedMotion()
  const timersRef = useRef<number[]>([])

  useEffect(() => {
    return () => {
      timersRef.current.forEach((timer) => window.clearTimeout(timer))
      timersRef.current = []
    }
  }, [])

  const handlePop = (balloon: Balloon) => {
    if (balloon.popped) return
    setBalloons((prev) => prev.map((b) => (b.id === balloon.id ? { ...b, popped: true } : b)))
    beep(520, 0.12, 'square', 0.1)
    if (balloon.id === WISH_BALLOON_ID) {
      const timer = window.setTimeout(() => {
        setShowPolaroid(true)
        timersRef.current = timersRef.current.filter((t) => t !== timer)
      }, 350)
      timersRef.current.push(timer)
    } else {
      setToast(balloon.wishText ?? '')
      const timer = window.setTimeout(() => {
        setToast(null)
        timersRef.current = timersRef.current.filter((t) => t !== timer)
      }, 1800)
      timersRef.current.push(timer)
    }
  }

  return (
    <div className={styles.wrap}>
      <p className={styles.instructions}>Pop a balloon 🎈 — one of them is holding your wish</p>

      {balloons.map((b) =>
        b.popped ? null : (
          <button
            key={b.id}
            type="button"
            className={styles.balloon}
            aria-label="Pop balloon"
            onClick={() => handlePop(b)}
            style={{
              left: `${b.x}%`,
              background: `radial-gradient(circle at 30% 25%, #ffffffaa, ${b.color})`,
              animationDuration: prefersReducedMotion ? '0s' : `${b.speed}s`,
            }}
          />
        ),
      )}

      <AnimatePresence>
        {toast && (
          <motion.div
            className={styles.toast}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPolaroid && (
          <motion.div
            className={styles.backdrop}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className={styles.polaroid}
              initial={{ opacity: 0, rotate: -8, scale: 0.85, y: 30 }}
              animate={{ opacity: 1, rotate: -3, scale: 1, y: 0 }}
              transition={{ type: 'spring', damping: 14, stiffness: 180 }}
            >
              <div className={styles.polaroidPhoto}>🎂</div>
              <p className={styles.polaroidText}>{wishText || 'Wishing you a year as amazing as you are! 🎂'}</p>
              <button type="button" className={styles.continueBtn} onClick={onComplete}>
                Continue →
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
