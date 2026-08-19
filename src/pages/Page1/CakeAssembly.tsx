import { useEffect, useRef } from 'react'
import { motion, useReducedMotion, type Variants } from 'framer-motion'
import styles from './CakeAssembly.module.css'

export interface CakeAssemblyProps {
  blown: boolean
  onAssembled: () => void
}

// Sequence timeline in ms: Plate -> Layer 1 -> Layer 2 -> Cream -> Chocolate -> Candle -> Flame
const STEP_DELAY_MS = [0, 600, 1200, 1800, 2400, 3000, 3500] 
const TOTAL_MS = 4000

// Fluid drop animation with dynamic squish & elastic rebound
function liquidPourVariants(delayMs: number): Variants {
  const delay = delayMs / 1000
  return {
    hidden: { 
      y: -320, 
      scaleY: 2.5, 
      scaleX: 0.3, 
      opacity: 0 
    },
    shown: {
      y: 0,
      opacity: 1,
      scaleY: [2.5, 0.45, 1.2, 0.92, 1],
      scaleX: [0.3, 1.35, 0.85, 1.05, 1],
      transition: { 
        delay, 
        duration: 0.85, 
        times: [0, 0.35, 0.6, 0.8, 1], 
        ease: 'easeOut' 
      },
    },
  }
}

// Rigid drop animation for candle
function candleDropVariants(delayMs: number): Variants {
  const delay = delayMs / 1000
  return {
    hidden: { y: -200, opacity: 0 },
    shown: { 
      y: 0, 
      opacity: 1, 
      transition: { delay, type: 'spring', damping: 12, stiffness: 200 } 
    },
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
  const instant: Variants = { 
    shownInstant: { y: 0, scaleX: 1, scaleY: 1, opacity: 1, transition: { duration: 0 } } 
  }

  const flameClass = [styles.flame, blown ? styles.flameOut : ''].filter(Boolean).join(' ')

  return (
    <div className={styles.cakeContainer}>
      {/* 1. Base Liquid Plate */}
      <motion.div
        className={styles.plate}
        variants={{ ...liquidPourVariants(STEP_DELAY_MS[0]), ...instant }}
        initial="hidden"
        animate={animate}
      />

      {/* 2. Cake Base Layer (Bottom Dough) */}
      <motion.div
        className={`${styles.layer} ${styles.layerBottom}`}
        variants={{ ...liquidPourVariants(STEP_DELAY_MS[1]), ...instant }}
        initial="hidden"
        animate={animate}
      />

      {/* 3. Cake Top Layer (Upper Dough) */}
      <motion.div
        className={`${styles.layer} ${styles.layerTop}`}
        variants={{ ...liquidPourVariants(STEP_DELAY_MS[2]), ...instant }}
        initial="hidden"
        animate={animate}
      />

      {/* 4. Cream / Inner Frosting Stripe */}
      <motion.div
        className={styles.cream}
        variants={{ ...liquidPourVariants(STEP_DELAY_MS[3]), ...instant }}
        initial="hidden"
        animate={animate}
      />

      {/* 5. Top Chocolate Layer with Dripping Accents */}
      <motion.div
        className={styles.chocolate}
        variants={{ ...liquidPourVariants(STEP_DELAY_MS[4]), ...instant }}
        initial="hidden"
        animate={animate}
      >
        <span className={styles.drip} style={{ left: '20%' }} />
        <span className={styles.drip} style={{ left: '50%' }} />
        <span className={styles.drip} style={{ left: '80%' }} />
      </motion.div>

      {/* 6. Candle & 7. Flame / Smoke Sequence */}
      <motion.div
        className={styles.candle}
        variants={{ ...candleDropVariants(STEP_DELAY_MS[5]), ...instant }}
        initial="hidden"
        animate={animate}
      >
        <motion.div
          className={flameClass}
          initial={{ opacity: 0, scale: 0 }}
          animate={
            prefersReducedMotion
              ? { opacity: blown ? 0 : 1, scale: blown ? 0 : 1 }
              : blown
              ? { opacity: 0, scale: 0 }
              : { opacity: [0, 1, 0.85, 1], scale: [0, 1.3, 0.9, 1] }
          }
          transition={{ 
            delay: STEP_DELAY_MS[6] / 1000, 
            duration: 0.45, 
            ease: 'easeOut' 
          }}
        />
        {blown && <span className={styles.smoke} aria-hidden="true" />}
      </motion.div>
    </div>
  )
}

export default CakeAssembly
