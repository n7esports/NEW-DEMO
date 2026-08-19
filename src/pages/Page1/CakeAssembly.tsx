import { useEffect, useRef } from 'react'
import { motion, useReducedMotion, type Variants } from 'framer-motion'
import styles from './CakeAssembly.module.css'

export interface CakeAssemblyProps {
  blown: boolean
  onAssembled: () => void
}

// Each step's start time (ms) — the pour+settle animation for one step
// begins right as the previous one finishes landing.
const STEP_DELAY_MS = [0, 650, 1300, 1950, 2500, 3250, 3750] // plate, layer1, layer2, cream, chocolate, candle, flame
const TOTAL_MS = 4200

// A liquid "pour and settle": falls in tall/thin, splats wide on landing,
// then wobbles back to its resting shape — instead of a plain bounce.
function pourVariants(delayMs: number): Variants {
  const delay = delayMs / 1000
  return {
    hidden: { y: -260, scaleY: 2.6, scaleX: 0.35, opacity: 0 },
    shown: {
      y: 0,
      opacity: 1,
      scaleY: [2.6, 0.5, 1.18, 0.94, 1],
      scaleX: [0.35, 1.3, 0.88, 1.04, 1],
      transition: { delay, duration: 0.9, times: [0, 0.35, 0.6, 0.8, 1], ease: 'easeOut' },
    },
  }
}

// Simpler drop-in for the (solid, non-liquid) candle.
function dropVariants(delayMs: number): Variants {
  const delay = delayMs / 1000
  return {
    hidden: { y: -180, opacity: 0 },
    shown: { y: 0, opacity: 1, transition: { delay, type: 'spring', damping: 11, stiffness: 220 } },
  }
}

export function CakeAssembly({ blown, onAssembled }: CakeAssemblyProps) {
  const prefersReducedMotion = useReducedMotion()
  const firedRef = useRef(false)
  const onAssembledRef = useRef(onAssembled)
  onAssembledRef.current = onAssembled

  useEffect(() => {
    if (firedRef.current) return
    firedRef.current = true

    if (prefersReducedMotion) {
      onAssembledRef.current()
      return
    }
    const timeout = window.setTimeout(() => onAssembledRef.current(), TOTAL_MS)
    return () => window.clearTimeout(timeout)
  }, [prefersReducedMotion])

  const animate = prefersReducedMotion ? 'shownInstant' : 'shown'
  const instant: Variants = { shownInstant: { y: 0, scaleX: 1, scaleY: 1, opacity: 1, transition: { duration: 0 } } }

  const flameClass = [styles.flame, blown ? styles.flameOut : ''].filter(Boolean).join(' ')

  return (
    <div className={styles.cakeContainer}>
      {/* Candle + flame */}
      <motion.div
        className={styles.candle}
        variants={{ ...dropVariants(STEP_DELAY_MS[5]), ...instant }}
        initial="hidden"
        animate={animate}
      >
        <motion.div
          className={flameClass}
          initial={{ opacity: 0, scale: 0.3 }}
          animate={
            prefersReducedMotion
              ? { opacity: 1, scale: 1 }
              : { opacity: [0, 1, 0.85, 1], scale: [0.3, 1.4, 0.9, 1] }
          }
          transition={{ delay: STEP_DELAY_MS[6] / 1000, duration: 0.5, ease: 'easeOut' }}
        />
        {blown && <span className={styles.smoke} aria-hidden="true" />}
      </motion.div>

      {/* Chocolate drizzle on top, with a couple of drips */}
      <motion.div
        className={styles.chocolate}
        variants={{ ...pourVariants(STEP_DELAY_MS[4]), ...instant }}
        initial="hidden"
        animate={animate}
      >
        <span className={styles.drip} style={{ left: '22%' }} />
        <span className={styles.drip} style={{ left: '58%' }} />
        <span className={styles.drip} style={{ left: '80%' }} />
      </motion.div>

      {/* Cream / frosting line */}
      <motion.div
        className={styles.cream}
        variants={{ ...pourVariants(STEP_DELAY_MS[3]), ...instant }}
        initial="hidden"
        animate={animate}
      />

      {/* Cake body: two dough layers poured in one after another */}
      <div className={styles.body}>
        <motion.div
          className={`${styles.layer} ${styles.layerTop}`}
          variants={{ ...pourVariants(STEP_DELAY_MS[2]), ...instant }}
          initial="hidden"
          animate={animate}
        />
        <motion.div
          className={styles.layer}
          variants={{ ...pourVariants(STEP_DELAY_MS[1]), ...instant }}
          initial="hidden"
          animate={animate}
        />
      </div>

      {/* Plate — first thing to land, forms the puddle everything else sits on */}
      <motion.div
        className={styles.plate}
        variants={{ ...pourVariants(STEP_DELAY_MS[0]), ...instant }}
        initial="hidden"
        animate={animate}
      />
    </div>
  )
}
