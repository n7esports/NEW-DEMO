import { useCallback, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useAppContext } from '../../context/AppContext'
import { CountdownPhase } from './CountdownPhase'
import { FireworksPhase } from './FireworksPhase'
import { CakeAssembly } from './CakeAssembly'
import { WishModal } from './WishModal'
import { BalloonsPhase } from './BalloonsPhase'
import type { CakeElement, Page1State } from './types'
import styles from './Page1.module.css'

export interface Page1Props {
  onComplete: () => void
}

// The moment the birthday "arrives". Local time — the last 10 seconds
// before this (i.e. from Sep 14, 2026, 11:59:50 PM) trigger the big
// bounce-and-beep countdown; before that, a live days/hours/min/sec
// display is shown instead.
const BIRTHDAY_TARGET = new Date(2026, 8, 15, 0, 0, 0) // month is 0-indexed: 8 = September

const CAKE_ELEMENTS: CakeElement[] = [
  { id: 'plate', type: 'plate', animation: 'bounce', delay: 0 },
  { id: 'layer-1', type: 'layer', animation: 'bounce', delay: 150 },
  { id: 'cream', type: 'cream', animation: 'bounce', delay: 300 },
  { id: 'layer-2', type: 'layer', animation: 'bounce', delay: 450 },
  { id: 'chocolate', type: 'chocolate', animation: 'bounce', delay: 650 },
  { id: 'strawberry', type: 'strawberry', animation: 'bounce', delay: 750 },
  { id: 'candle-1', type: 'candle', animation: 'bounce', delay: 900 },
  { id: 'candle-2', type: 'candle', animation: 'bounce', delay: 980 },
  { id: 'candle-3', type: 'candle', animation: 'bounce', delay: 1060 },
  { id: 'candle-4', type: 'candle', animation: 'bounce', delay: 1140 },
  { id: 'candle-5', type: 'candle', animation: 'bounce', delay: 1220 },
]

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
          <CakeAssembly elements={CAKE_ELEMENTS} blown={blown} onAssembled={handleAssembled} />
          {assembled && phase === 'cakeAssembly' && (
            <button type="button" className={styles.cta} onClick={hasWished ? handleBlowOut : () => setPhase('wish')}>
              {hasWished ? 'Blow Out the Candles 🕯️' : '🎂 Make a Wish'}
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
