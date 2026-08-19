import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useBeep } from '../../hooks/useBeep'
import styles from './CountdownPhase.module.css'

export interface CountdownPhaseProps {
  /** The exact moment the birthday "arrives" — e.g. Sep 15, 2026 00:00:00 local time. */
  targetDate: Date
  onComplete: () => void
}

const FINAL_STRETCH_MS = 10_000 // last 10 seconds get the big bounce-and-beep treatment

function msRemaining(target: Date): number {
  return Math.max(0, target.getTime() - Date.now())
}

function splitDuration(ms: number) {
  const totalSeconds = Math.floor(ms / 1000)
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  }
}

const pad = (n: number) => String(n).padStart(2, '0')

export function CountdownPhase({ targetDate, onComplete }: CountdownPhaseProps) {
  const [remainingMs, setRemainingMs] = useState(() => msRemaining(targetDate))
  const { beep } = useBeep()
  const prefersReducedMotion = useReducedMotion()
  const lastBeepedSecond = useRef<number | null>(null)
  const [isSkipped, setIsSkipped] = useState(false)

  // Ticks continuously against the real clock, so it survives tab throttling,
  // refreshes, and works correctly no matter when the page is opened.
  useEffect(() => {
    const tick = () => {
      const ms = msRemaining(targetDate)
      setRemainingMs(ms)

      if (ms <= 0) {
        if (lastBeepedSecond.current !== 0) {
          lastBeepedSecond.current = 0
          beep(1046, 0.4, 'triangle', 0.18)
        }
        return
      }

      if (ms <= FINAL_STRETCH_MS) {
        const secondsLeft = Math.ceil(ms / 1000)
        if (secondsLeft !== lastBeepedSecond.current) {
          lastBeepedSecond.current = secondsLeft
          beep(660, 0.08)
        }
      }
    }
    tick()
    const interval = window.setInterval(tick, 100)
    return () => window.clearInterval(interval)
  }, [targetDate, beep])

  const reachedZero = remainingMs <= 0
  useEffect(() => {
    if (reachedZero && !isSkipped) {
      const timeout = window.setTimeout(onComplete, 1100)
      return () => window.clearTimeout(timeout)
    }
    // Only re-fires when reachedZero flips from false -> true, not on every tick.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reachedZero, isSkipped])

  // Handle skip button - immediately completes the countdown and goes to next page
  const handleSkip = () => {
    setIsSkipped(true)
    setRemainingMs(0)
    // Immediately call onComplete to go to next page
    onComplete()
  }

  // --- Final 10 seconds: the big spring-bounce number, ticking every second ---
  if (remainingMs <= FINAL_STRETCH_MS) {
    const secondsLeft = Math.ceil(remainingMs / 1000)
    return (
      <div className={styles.wrap} data-parity={secondsLeft % 2 === 0 ? 'even' : 'odd'}>
        <AnimatePresence mode="wait">
          <motion.div
            key={secondsLeft}
            className={styles.number}
            initial={prefersReducedMotion ? undefined : { scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={prefersReducedMotion ? undefined : { scale: 1.2, opacity: 0 }}
            transition={{ type: 'spring', damping: 10, stiffness: 220 }}
          >
            {secondsLeft === 0 ? '🎉' : secondsLeft}
          </motion.div>
        </AnimatePresence>
        <p className={styles.label}>{secondsLeft > 0 ? 'Get ready…' : 'Happy Birthday!'}</p>
        {/* DEV SKIP BUTTON */}
        <button 
          className={styles.skipButton} 
          onClick={handleSkip}
        >
          Dev: Skip Timing
        </button>
      </div>
    )
  }

  // --- More than 10 seconds out: a live days/hours/minutes/seconds display ---
  const { days, hours, minutes, seconds } = splitDuration(remainingMs)
  const units = [
    { value: days, label: days === 1 ? 'Day' : 'Days' },
    { value: hours, label: 'Hours' },
    { value: minutes, label: 'Minutes' },
    { value: seconds, label: 'Seconds' },
  ]

  return (
    <div className={styles.longWrap}>
      <p className={styles.eyebrow}>Counting down to</p>
      <h1 className={styles.targetLabel}>
        {targetDate.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
      </h1>
      <div className={styles.unitRow}>
        {units.map((u, i) => (
          <div key={u.label} className={styles.unitGroup}>
            <div className={styles.unit}>
              <span className={styles.unitValue}>{pad(u.value)}</span>
              <span className={styles.unitLabel}>{u.label}</span>
            </div>
            {i < units.length - 1 && <span className={styles.divider}>:</span>}
          </div>
        ))}
      </div>
      {/* DEV SKIP BUTTON */}
      <button 
        className={styles.skipButton} 
        onClick={handleSkip}
      >
        Dev: Skip Timing
      </button>
    </div>
  )
}
