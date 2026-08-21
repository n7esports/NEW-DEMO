'use client'

import { useEffect, useState } from 'react'
import styles from './WishMoment.module.css'

export interface WishMomentProps {
  name?: string
  onComplete: () => void
}

const WISH_WORDS = [
  'Health',
  'Happiness',
  'Love',
  'Success',
  'Laughter',
  'Dreams',
  'Joy',
  'Adventure',
]

const MESSAGE_TYPE_SPEED_MS = 55

export default function WishMoment({
  name = 'Arfa',
  onComplete,
}: WishMomentProps) {
  const fullMessage = `Happy Birthday, ${name} 🎂`

  const [typedLength, setTypedLength] = useState(0)
  const [showFlash, setShowFlash] = useState(true)
  const [showContinue, setShowContinue] = useState(false)

  // Gold flash briefly covers the screen, then fades — masks the cut from
  // the blown-out candle into this scene.
  useEffect(() => {
    const timeout = window.setTimeout(() => setShowFlash(false), 550)
    return () => window.clearTimeout(timeout)
  }, [])

  // Typewriter reveal of the message, starting just after the flash clears.
  useEffect(() => {
    const startDelay = window.setTimeout(() => {
      const interval = window.setInterval(() => {
        setTypedLength((current) => {
          if (current >= fullMessage.length) {
            window.clearInterval(interval)
            return current
          }
          return current + 1
        })
      }, MESSAGE_TYPE_SPEED_MS)
    }, 500)

    return () => window.clearTimeout(startDelay)
  }, [fullMessage.length])

  // Reveal the "Continue" button once the message has fully typed out.
  useEffect(() => {
    if (typedLength >= fullMessage.length) {
      const timeout = window.setTimeout(() => setShowContinue(true), 400)
      return () => window.clearTimeout(timeout)
    }
  }, [typedLength, fullMessage.length])

  return (
    <div className={styles.wrap}>
      {/* ===== GOLD FLASH ===== */}
      <div
        className={styles.flash}
        style={{ opacity: showFlash ? 1 : 0 }}
        aria-hidden="true"
      />

      {/* ===== WISH BUBBLES ===== */}
      <div className={styles.bubbleField} aria-hidden="true">
        {WISH_WORDS.map((word, i) => (
          <span
            key={word}
            className={styles.bubble}
            style={{
              left: `${8 + i * (84 / WISH_WORDS.length)}%`,
              animationDelay: `${i * 0.6}s`,
              animationDuration: `${7 + (i % 3)}s`,
            }}
          >
            {word}
          </span>
        ))}
      </div>

      {/* ===== MESSAGE ===== */}
      <div className={styles.messageCard}>
        <p className={styles.message}>
          {fullMessage.slice(0, typedLength)}
          <span className={styles.caret} aria-hidden="true" />
        </p>

        <button
          type="button"
          className={styles.continueBtn}
          style={{
            opacity: showContinue ? 1 : 0,
            pointerEvents: showContinue ? 'auto' : 'none',
          }}
          onClick={onComplete}
        >
          Continue →
        </button>
      </div>
    </div>
  )
}
