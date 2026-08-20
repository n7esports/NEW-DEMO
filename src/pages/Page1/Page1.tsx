import { useCallback, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useAppContext } from '../../context/AppContext'
import { BIRTHDAY_TARGET } from '../../config'
import { CountdownPhase } from './CountdownPhase'
import { FireworksPhase } from './FireworksPhase'
import CakeAssembly from './CakeAssembly'
import { ClawMachinePhase } from './ClawMachinePhase'
import type { Page1State } from './types'
import styles from './Page1.module.css'

export interface Page1Props {
  onComplete: () => void
}

export function Page1({ onComplete }: Page1Props) {
  const { userData } = useAppContext()
  const [phase, setPhase] = useState<Page1State>('countdown')
  const [assembled, setAssembled] = useState(false)

  // Fired by CakeAssembly once its entrance sequence (layers + candle +
  // flame) has finished, so the CTA never appears before there's a candle
  // to blow out.
  const handleAssembled = useCallback(() => setAssembled(true), [])

    const handleBlowOut = () => {
    setPhase('blowOut')
    window.setTimeout(() => setPhase('clawMachine'), 1600)
  }

  const showCakeScene = phase === 'cakeAssembly' || phase === 'blowOut'

  return (
    <div className={styles.page}>
      <AnimatePresence mode="wait">
        {phase === 'countdown' && (
          <motion.div key="countdown" exit={{ opacity: 0 }}>
            <CountdownPhase targetDate={BIRTHDAY_TARGET} onComplete={() => setPhase('fireworks')} />
          </motion.div>
        )}
        {phase === 'fireworks' && (
          <motion.div key="fireworks" exit={{ opacity: 0 }}>
            <FireworksPhase onComplete={() => setPhase('cakeAssembly')} />
          </motion.div>
        )}
      </AnimatePresence>

      {showCakeScene && (
        <div className={styles.cakeScene}>
          <CakeAssembly onAssembled={handleAssembled} blown={phase === 'blowOut'} />
          {assembled && phase === 'cakeAssembly' && (
            <button type="button" className={styles.cta} onClick={handleBlowOut}>
              Blow the Candle 🕯️
            </button>
          )}
        </div>
      )}

      {phase === 'balloons' && <BalloonsPhase wishText={userData.wishText} onComplete={onComplete} />}
    </div>
  )
}
