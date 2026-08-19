import { useRef, useState } from 'react'
import styles from './NoButton.module.css'

export interface NoButtonProps {
  onDodge?: () => void
}

export function NoButton({ onDodge }: NoButtonProps) {
  const btnRef = useRef<HTMLButtonElement>(null)
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null)

  const dodge = () => {
    const btn = btnRef.current
    const width = btn?.offsetWidth ?? 120
    const height = btn?.offsetHeight ?? 48
    const maxX = window.innerWidth - width - 24
    const maxY = window.innerHeight - height - 24
    setPos({ x: 24 + Math.random() * Math.max(0, maxX), y: 24 + Math.random() * Math.max(0, maxY) })
    onDodge?.()
  }

  return (
    <button
      ref={btnRef}
      type="button"
      className={styles.noButton}
      style={pos ? { position: 'fixed', left: pos.x, top: pos.y } : undefined}
      onMouseEnter={dodge}
      onClick={dodge}
      onTouchStart={dodge}
    >
      NO...
    </button>
  )
}
