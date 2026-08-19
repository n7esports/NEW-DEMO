import type { CSSProperties, ReactNode } from 'react'
import styles from './GlassPanel.module.css'

export interface GlassPanelProps {
  blur?: number
  bgOpacity?: number
  borderGlow?: boolean
  children: ReactNode
  className?: string
}

export function GlassPanel({
  blur = 16,
  bgOpacity = 0.08,
  borderGlow = false,
  children,
  className = '',
}: GlassPanelProps) {
  return (
    <div
      className={`${styles.panel} ${borderGlow ? styles.glow : ''} ${className}`}
      style={
        {
          '--panel-blur': `${blur}px`,
          '--panel-bg-opacity': bgOpacity,
        } as CSSProperties
      }
    >
      {children}
    </div>
  )
}
