import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { GlassPanel } from '../../components/GlassPanel/GlassPanel'
import styles from './WishModal.module.css'

export interface WishModalProps {
  initialValue?: string
  onSubmit: (wishText: string) => void
  onClose: () => void
}

export function WishModal({ initialValue = '', onSubmit, onClose }: WishModalProps) {
  const [value, setValue] = useState(initialValue)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    textareaRef.current?.focus()
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'Tab') {
        // Simple focus trap between the two focusable elements in the dialog
        const focusables = dialogRef.current?.querySelectorAll<HTMLElement>('textarea, button')
        if (!focusables || focusables.length === 0) return
        const first = focusables[0]
        const last = focusables[focusables.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  const handleSubmit = () => {
    onSubmit(value.trim())
  }

  return (
    <motion.div
      className={styles.backdrop}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Make a wish"
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: 'spring', damping: 18, stiffness: 220 }}
        onClick={(e) => e.stopPropagation()}
      >
        <GlassPanel borderGlow className={styles.card}>
          <h2 className={styles.title}>Make a wish ✨</h2>
          <p className={styles.subtitle}>Close your eyes, and type what you're wishing for.</p>
          <textarea
            ref={textareaRef}
            className={styles.textarea}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="I wish for…"
            maxLength={280}
            rows={4}
          />
          <button type="button" className={styles.submit} onClick={handleSubmit}>
            Make My Wish
          </button>
        </GlassPanel>
      </motion.div>
    </motion.div>
  )
}
