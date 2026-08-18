import { motion, useReducedMotion } from 'framer-motion'
import type { CakeElement } from './types'
import styles from './CakeAssembly.module.css'

export interface CakeAssemblyProps {
  elements: CakeElement[]
  blown: boolean
  onAssembled: () => void
}

const BODY_TYPES = new Set<CakeElement['type']>(['plate', 'layer', 'cream'])

function ElementContent({ el, blown }: { el: CakeElement; blown: boolean }) {
  switch (el.type) {
    case 'plate':
      return <div className={styles.plate} />
    case 'layer':
      return <div className={styles.layer} />
    case 'cream':
      return <div className={styles.cream} />
    case 'chocolate':
      return <span className={styles.topping}>{el.emoji ?? '🍫'}</span>
    case 'strawberry':
      return <span className={styles.topping}>{el.emoji ?? '🍓'}</span>
    case 'candle':
      return (
        <div className={styles.candle}>
          <div className={`${styles.flame} ${blown ? styles.flameOut : ''}`} />
          {blown && <span className={styles.smoke} />}
        </div>
      )
    default:
      return null
  }
}

export function CakeAssembly({ elements, blown, onAssembled }: CakeAssemblyProps) {
  const prefersReducedMotion = useReducedMotion()
  const bodyElements = elements.filter((e) => BODY_TYPES.has(e.type))
  const topElements = elements.filter((e) => !BODY_TYPES.has(e.type))
  const lastId = elements[elements.length - 1]?.id

  const bounce = (delay: number) => ({
    initial: prefersReducedMotion ? undefined : { y: -500, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    transition: { type: 'spring' as const, damping: 12, stiffness: 200, delay: delay / 1000 },
  })

  return (
    <div className={styles.cakeWrap}>
      {blown && <span className={styles.windStreak} aria-hidden="true" />}
      <div className={styles.topRow}>
        {topElements.map((el) => (
          <motion.div
            key={el.id}
            className={styles.topSlot}
            {...bounce(el.delay)}
            onAnimationComplete={el.id === lastId ? onAssembled : undefined}
          >
            <ElementContent el={el} blown={blown} />
          </motion.div>
        ))}
      </div>
      <div className={styles.body}>
        {bodyElements.map((el) => (
          <motion.div
            key={el.id}
            {...bounce(el.delay)}
            onAnimationComplete={el.id === lastId ? onAssembled : undefined}
          >
            <ElementContent el={el} blown={blown} />
          </motion.div>
        ))}
      </div>
    </div>
  )
}
