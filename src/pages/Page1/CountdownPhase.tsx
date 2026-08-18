import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useBeep } from '../../hooks/useBeep'
import styles from './CountdownPhase.module.css'

export interface CountdownPhaseProps {
  duration: number // seconds, e.g. 10
  onComplete: () => void
}

export function CountdownPhase({ duration, onComplete }: CountdownPhaseProps) {
  const [count, setCount] = useState(duration)
  const { beep } = useBeep()
  const prefersReducedMotion = useReducedMotion()

  // Tick every second. A short high chime plays on the final "0".
  useEffect(() => {
    beep(660, 0.08)
    const interval = window.setInterval(() => {
      setCount((prev) => {
        const next = prev - 1
        if (next < 0) {
          window.clearInterval(interval)
          return prev
        }
        if (next === 0) {
          beep(1046, 0.4, 'triangle', 0.18)
        } else {
          beep(660, 0.08)
        }
        return next
      })
    }, 1000)
    return () => window.clearInterval(interval)
    // duration is intentionally captured once — this phase always counts down exactly once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (count === 0) {
      const timeout = window.setTimeout(onComplete, 1100)
      return () => window.clearTimeout(timeout)
    }
  }, [count, onComplete])

  return (
    <div className={styles.wrap} data-parity={count % 2 === 0 ? 'even' : 'odd'}>
      <AnimatePresence mode="wait">
        <motion.div
          key={count}
          className={styles.number}
          initial={prefersReducedMotion ? undefined : { scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={prefersReducedMotion ? undefined : { scale: 1.2, opacity: 0 }}
          transition={{ type: 'spring', damping: 10, stiffness: 220 }}
        >
          {count === 0 ? '🎉' : count}
        </motion.div>
      </AnimatePresence>
      <p className={styles.label}>{count > 0 ? 'Get ready…' : 'Happy Birthday!'}</p>
    </div>
  )
}
