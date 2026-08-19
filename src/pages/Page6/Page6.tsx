import { useEffect, useState } from 'react'
import { NoButton } from './NoButton'
import { ConfettiExplosion } from './ConfettiExplosion'
import styles from './Page6.module.css'

export interface Page6Props {
  onComplete: () => void
}

const CLOSING_DURATION_MS = 3200

export function Page6({ onComplete }: Page6Props) {
  const [phase, setPhase] = useState<'feedback' | 'closing'>('feedback')
  const [dodgeCount, setDodgeCount] = useState(0)

  useEffect(() => {
    if (phase !== 'closing') return
    const timeout = window.setTimeout(onComplete, CLOSING_DURATION_MS)
    return () => window.clearTimeout(timeout)
  }, [phase, onComplete])

  return (
    <div className={styles.page}>
      {phase === 'feedback' && (
        <div className={styles.feedbackWrap}>
          <h1 className={styles.heading}>Did you enjoy your birthday gift? 🎁</h1>
          {dodgeCount > 3 && <p className={styles.taunt}>...you know you can't catch it, right? 😏</p>}
          <div className={styles.buttonRow}>
            <button type="button" className={styles.yesButton} onClick={() => setPhase('closing')}>
              YES! 🎉
            </button>
            <NoButton onDodge={() => setDodgeCount((c) => c + 1)} />
          </div>
        </div>
      )}

      {phase === 'closing' && (
        <div className={styles.closingWrap}>
          <ConfettiExplosion />
          <div className={styles.closingCard}>
            <p className={styles.closingText}>Happy Birthday, once again. 💕</p>
            <p className={styles.closingSub}>Made with love, just for you.</p>
          </div>
        </div>
      )}
    </div>
  )
}
