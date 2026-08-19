import { useEffect, useState } from 'react'
import { useReducedMotion } from 'framer-motion'
import { GlassPanel } from '../../components/GlassPanel/GlassPanel'
import { downloadLetterPdf } from './letterUtils'
import styles from './TypewriterLetter.module.css'

export interface TypewriterLetterProps {
  text: string
  speed?: number // ms per character
  onNext: () => void
}

export function TypewriterLetter({ text, speed = 28, onNext }: TypewriterLetterProps) {
  const [displayText, setDisplayText] = useState('')
  const [isComplete, setIsComplete] = useState(false)
  const prefersReducedMotion = useReducedMotion()

  useEffect(() => {
    if (prefersReducedMotion) {
      setDisplayText(text)
      setIsComplete(true)
      return
    }
    let index = 0
    const interval = window.setInterval(() => {
      index++
      setDisplayText(text.slice(0, index))
      if (index >= text.length) {
        window.clearInterval(interval)
        setIsComplete(true)
      }
    }, speed)
    return () => window.clearInterval(interval)
  }, [text, speed, prefersReducedMotion])

  const skipToEnd = () => {
    if (isComplete) return
    setDisplayText(text)
    setIsComplete(true)
  }

  return (
    <GlassPanel borderGlow className={styles.card}>
      <div className={styles.paper} onClick={skipToEnd}>
        <p className={styles.handwrittenText}>
          {displayText}
          {!isComplete && <span className={styles.cursor}>|</span>}
        </p>
        {!isComplete && <p className={styles.skipHint}>(tap to skip ahead)</p>}
      </div>

      {isComplete && (
        <div className={styles.actions}>
          <button type="button" className={styles.secondaryBtn} onClick={() => downloadLetterPdf(text)}>
            ⬇ Download PDF
          </button>
          <button type="button" className={styles.primaryBtn} onClick={onNext}>
            Next →
          </button>
        </div>
      )}
    </GlassPanel>
  )
}
