import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useBeep } from '../../hooks/useBeep'
import { GlassPanel } from '../../components/GlassPanel/GlassPanel'
import styles from './DigitalLocker.module.css'

export interface DigitalLockerProps {
  passcode: string
  onUnlock: () => void
}

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'clear', '0', '⌫']

const WRONG_CODE_MESSAGES = [
  'Not quite — try again! 😜',
  "That's not it… one more try!",
  'Access denied 🚫 give it another go',
  'Close, but no cake 🎂 try again',
]

export function DigitalLocker({ passcode, onUnlock }: DigitalLockerProps) {
  const [input, setInput] = useState('')
  const [error, setError] = useState('')
  const [shake, setShake] = useState(false)
  const { beep } = useBeep()
  const resetTimeoutRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (resetTimeoutRef.current !== null) window.clearTimeout(resetTimeoutRef.current)
    }
  }, [])

  const handleKeyPress = (key: string) => {
    if (shake) return

    if (key === 'clear') {
      setInput('')
      setError('')
      return
    }
    if (key === '⌫') {
      setInput((prev) => prev.slice(0, -1))
      return
    }

    const newInput = (input + key).slice(0, passcode.length)
    setInput(newInput)
    beep(440, 0.06)

    if (newInput.length === passcode.length) {
      if (newInput === passcode) {
        beep(880, 0.3, 'triangle', 0.18)
        onUnlock()
      } else {
        setShake(true)
        setError(WRONG_CODE_MESSAGES[Math.floor(Math.random() * WRONG_CODE_MESSAGES.length)])
        beep(180, 0.25, 'sawtooth', 0.12)
        if (resetTimeoutRef.current !== null) window.clearTimeout(resetTimeoutRef.current)
        resetTimeoutRef.current = window.setTimeout(() => {
          setShake(false)
          setInput('')
          resetTimeoutRef.current = null
        }, 500)
      }
    }
  }

  return (
    <motion.div animate={shake ? { x: [-10, 10, -10, 10, 0] } : {}} transition={{ duration: 0.5 }}>
      <GlassPanel borderGlow className={styles.locker}>
        <p className={styles.title}>🔒 Enter the passcode</p>
        <div className={styles.dots} aria-hidden="true">
          {Array.from({ length: passcode.length }).map((_, i) => (
            <span key={i} className={`${styles.dot} ${i < input.length ? styles.dotFilled : ''}`} />
          ))}
        </div>
        {error && <p className={styles.error}>{error}</p>}
        <div className={styles.keypad}>
          {KEYS.map((key) => (
            <button
              key={key}
              type="button"
              className={styles.key}
              onClick={() => handleKeyPress(key)}
              aria-label={key === 'clear' ? 'Clear' : key === '⌫' ? 'Backspace' : `Digit ${key}`}
            >
              {key === 'clear' ? 'C' : key}
            </button>
          ))}
        </div>
      </GlassPanel>
    </motion.div>
  )
}
