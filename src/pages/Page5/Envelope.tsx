import { useState } from 'react'
import { motion } from 'framer-motion'
import styles from './Envelope.module.css'

export interface EnvelopeProps {
  onOpen: () => void
}

// Matches the CSS flap-open transition duration below.
const OPEN_ANIMATION_MS = 900

export function Envelope({ onOpen }: EnvelopeProps) {
  const [opening, setOpening] = useState(false)

  const handleClick = () => {
    if (opening) return
    setOpening(true)
    window.setTimeout(onOpen, OPEN_ANIMATION_MS)
  }

  return (
    <motion.button
      type="button"
      className={styles.envelope}
      whileHover={!opening ? { scale: 1.02 } : undefined}
      onClick={handleClick}
      aria-label="Open the envelope"
    >
      <div className={`${styles.flap} ${opening ? styles.flapOpen : ''}`}>
        <motion.div
          className={styles.wax}
          whileHover={!opening ? { scale: 1.08, rotate: [0, -4, 4, 0] } : undefined}
          animate={opening ? { scale: 0, rotate: 180 } : {}}
        >
          ❤️
        </motion.div>
      </div>
      <div className={styles.body}>
        {!opening && <span className={styles.hint}>Tap the seal to open</span>}
      </div>
    </motion.button>
  )
}
