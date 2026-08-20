import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { GlassPanel } from '../../components/GlassPanel/GlassPanel'
import { useBeep } from '../../hooks/useBeep'
import styles from './ClawMachinePhase.module.css'

export interface ClawMachinePhaseProps {
  onComplete: () => void
}

interface Prize {
  id: string
  emoji: string
  x: number // 0-100, horizontal position in the prize row
  title: string
  message: string
  caught: boolean
}

const INITIAL_PRIZES: Prize[] = [
  {
    id: 'bear',
    emoji: '🧸',
    x: 22,
    title: 'A hug, in bear form',
    message: 'For every time I can\'t be there to hug you myself.',
    caught: false,
  },
  {
    id: 'gift',
    emoji: '🎁',
    x: 50,
    title: 'A little something',
    message: 'Just a small token — the big stuff is the year ahead of you.',
    caught: false,
  },
  {
    id: 'star',
    emoji: '✨',
    x: 78,
    title: 'Endless love, always',
    message: 'The kind of gift that doesn\'t fit in a box.',
    caught: false,
  },
]

const SWEEP_SPEED = 0.6 // % of track width per animation frame tick
const TICK_MS = 16

export function ClawMachinePhase({ onComplete }: ClawMachinePhaseProps) {
  const [prizes, setPrizes] = useState<Prize[]>(INITIAL_PRIZES)
  const [clawX, setClawX] = useState(50)
  const [phase, setPhase] = useState<'sweeping' | 'dropping' | 'rising' | 'revealing'>('sweeping')
  const [activePrizeId, setActivePrizeId] = useState<string | null>(null)
  const directionRef = useRef<1 | -1>(1)
  const { beep } = useBeep()

  const caughtCount = prizes.filter((p) => p.caught).length
  const allCaught = caughtCount === prizes.length

  // Continuous left-right sweep while idle and not mid-grab.
  useEffect(() => {
    if (phase !== 'sweeping' || allCaught) return
    const interval = window.setInterval(() => {
      setClawX((prev) => {
        let next = prev + SWEEP_SPEED * directionRef.current
        if (next >= 92) {
          next = 92
          directionRef.current = -1
        } else if (next <= 8) {
          next = 8
          directionRef.current = 1
        }
        return next
      })
    }, TICK_MS)
    return () => window.clearInterval(interval)
  }, [phase, allCaught])

  const handleDrop = useCallback(() => {
    if (phase !== 'sweeping' || allCaught) return

    // Snap to the nearest remaining prize — guarantees a satisfying catch
    // every time rather than a frustrating real-arcade miss chance.
    const remaining = prizes.filter((p) => !p.caught)
    const nearest = remaining.reduce((closest, p) =>
      Math.abs(p.x - clawX) < Math.abs(closest.x - clawX) ? p : closest,
    remaining[0])

    setActivePrizeId(nearest.id)
    setPhase('dropping')
    beep(440, 0.06)

    window.setTimeout(() => {
      setPhase('rising')
      beep(660, 0.1)
      setPrizes((prev) => prev.map((p) => (p.id === nearest.id ? { ...p, caught: true } : p)))

      window.setTimeout(() => {
        setPhase('revealing')
        beep(880, 0.15, 'triangle', 0.18)
      }, 700)
    }, 650)
  }, [phase, allCaught, prizes, clawX, beep])

  const handleRevealClose = () => {
    setActivePrizeId(null)
    if (caughtCount + 1 >= prizes.length) return // stays on revealing UI, Continue shows instead
    setPhase('sweeping')
  }

  const activePrize = prizes.find((p) => p.id === activePrizeId) ?? null

  return (
    <div className={styles.wrap}>
      <h1 className={styles.heading}>Gifts for you 🎁</h1>

      <div className={styles.machine}>
        <div className={styles.rail} />

        <div
          className={styles.claw}
          style={{ left: `${clawX}%` }}
          data-phase={phase}
        >
          <div className={styles.rope} />
          <div className={styles.clawHead}>
            <span className={styles.clawArm} />
            <span className={styles.clawArm} />
            <span className={styles.clawArm} />
          </div>
        </div>

        <div className={styles.prizeRow}>
          {prizes.map((prize) => (
            <span
              key={prize.id}
              className={`${styles.prize} ${prize.caught ? styles.prizeGone : ''}`}
              style={{ left: `${prize.x}%` }}
            >
              {prize.emoji}
            </span>
          ))}
        </div>

        <div className={styles.prizeCounter}>
          {caughtCount} / {prizes.length} caught
        </div>
      </div>

      {phase === 'sweeping' && !allCaught && (
        <button type="button" className={styles.dropButton} onClick={handleDrop}>
          Drop the Claw ⬇️
        </button>
      )}

      <AnimatePresence>
        {phase === 'revealing' && activePrize && (
          <motion.div
            className={styles.revealOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ scale: 0.85, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              transition={{ type: 'spring', damping: 14, stiffness: 200 }}
            >
              <GlassPanel borderGlow className={styles.revealPanel}>
                <span className={styles.revealEmoji}>{activePrize.emoji}</span>
                <h2 className={styles.revealTitle}>{activePrize.title}</h2>
                <p className={styles.revealMessage}>{activePrize.message}</p>

                {caughtCount >= prizes.length ? (
                  <button type="button" className={styles.continueButton} onClick={onComplete}>
                    Continue →
                  </button>
                ) : (
                  <button type="button" className={styles.nextButton} onClick={handleRevealClose}>
                    Next Prize →
                  </button>
                )}
              </GlassPanel>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
