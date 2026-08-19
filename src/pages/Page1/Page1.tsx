import { useCallback, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useAppContext } from '../../context/AppContext'
import { BIRTHDAY_TARGET } from '../../config'
import { CountdownPhase } from './CountdownPhase'
import { FireworksPhase } from './FireworksPhase'
import  CakeAssembly  from './CakeAssembly'
import { WishModal } from './WishModal'
import { BalloonsPhase } from './BalloonsPhase'
import type { Page1State } from './types'
import styles from './Page1.module.css'

export interface Page1Props {
  onComplete: () => void
}

export function Page1({ onComplete }: Page1Props) {
  const { userData, dispatch } = useAppContext()
  const [phase, setPhase] = useState<Page1State>('countdown')
  const [assembled, setAssembled] = useState(false)
  const [hasWished, setHasWished] = useState(false)
  const [blown, setBlown] = useState(false)

  const handleAssembled = useCallback(() => setAssembled(true), [])

  const handleWishSubmit = (text: string) => {
    setHasWished(true)
    dispatch({ type: 'UPDATE_USER_DATA', payload: { wishText: text } })
    setPhase('cakeAssembly')
  }

  const handleBlowOut = () => {
    setBlown(true)
    setPhase('blowOut')
    window.setTimeout(() => setPhase('balloons'), 1600)
  }

  const showCakeScene = phase === 'cakeAssembly' || phase === 'wish' || phase === 'blowOut'

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
          <CakeAssembly />
          {assembled && phase === 'cakeAssembly' && (
            <button type="button" className={styles.cta} onClick={hasWished ? handleBlowOut : () => setPhase('wish')}>
              {hasWished ? 'Blow Out the Candle 🕯️' : '🎂 Make a Wish'}
            </button>
          )}
        </div>
      )}

      <AnimatePresence>
        {phase === 'wish' && (
          <WishModal
            initialValue={userData.wishText}
            onSubmit={handleWishSubmit}
            onClose={() => setPhase('cakeAssembly')}
          />
        )}
      </AnimatePresence>

      {phase === 'balloons' && <BalloonsPhase wishText={userData.wishText} onComplete={onComplete} />}
    </div>
  )
}
