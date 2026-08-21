import { useRef, useState } from 'react'
import type { MouseEvent, PointerEvent } from 'react'
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

  const handlePointerEnter = (event: PointerEvent<HTMLButtonElement>) => {
    if (event.pointerType === 'mouse') dodge()
  }

  const handlePointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    if (event.pointerType !== 'mouse') dodge()
  }

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    // detail === 0 is a keyboard activation (Enter/Space). Pointer/touch
    // interactions are handled by the pointer handlers above so they do not
    // dodge twice on mobile browsers.
    if (event.detail === 0) dodge()
  }

  return (
    <button
      ref={btnRef}
      type="button"
      className={styles.noButton}
      style={pos ? { position: 'fixed', left: pos.x, top: pos.y } : undefined}
      onPointerEnter={handlePointerEnter}
      onPointerDown={handlePointerDown}
      onClick={handleClick}
    >
      NO...
    </button>
  )
}
