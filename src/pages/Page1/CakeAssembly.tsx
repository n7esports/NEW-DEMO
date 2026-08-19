import { useEffect, useRef } from 'react'
import { useReducedMotion } from 'framer-motion'
import styles from './CakeAssembly.module.css'

export interface CakeAssemblyProps {
  blown: boolean
  onAssembled: () => void
}

// Roughly matches the candle drop-in (0.6s) plus the flame's fade-in
// (starts at 0.6s, takes 0.4s) — "assembled" fires right as the flame settles.
const ASSEMBLE_MS = 1000

export function CakeAssembly({ blown, onAssembled }: CakeAssemblyProps) {
  const prefersReducedMotion = useReducedMotion()
  const firedRef = useRef(false)
  // Keeps the effect below free of an exhaustive-deps escape hatch: we always
  // call whatever onAssembled currently is, without re-running the timer if
  // the caller passes a new function identity on re-render.
  const onAssembledRef = useRef(onAssembled)
  onAssembledRef.current = onAssembled

  useEffect(() => {
    if (firedRef.current) return
    firedRef.current = true

    if (prefersReducedMotion) {
      onAssembledRef.current()
      return
    }
    const timeout = window.setTimeout(() => onAssembledRef.current(), ASSEMBLE_MS)
    return () => window.clearTimeout(timeout)
  }, [prefersReducedMotion])

  const flameClass = [
    styles.flame,
    prefersReducedMotion ? styles.flameStatic : '',
    blown ? styles.flameOut : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={styles.cakeContainer}>
      <div className={`${styles.candle} ${prefersReducedMotion ? styles.candleStatic : ''}`}>
        <div className={flameClass} />
        {blown && <span className={styles.smoke} aria-hidden="true" />}
      </div>
      <div className={styles.frosting} />
      <div className={styles.cakeBody}>
        <div className={styles.layerStripe} />
      </div>
      <div className={styles.plate} />
    </div>
  )
}
