import { motion } from 'framer-motion'
import { VideoPlayer } from './VideoPlayer'
import type { GalleryItem } from './types'
import styles from './MasonryGallery.module.css'

export interface MasonryGalleryProps {
  items: GalleryItem[]
}

export function MasonryGallery({ items }: MasonryGalleryProps) {
  return (
    <div className={styles.grid}>
      {items.map((item) => (
        <motion.div
          key={item.id}
          className={styles.card}
          whileHover={{ rotateX: 4, rotateY: 4, scale: 1.02 }}
          transition={{ type: 'spring', damping: 20 }}
        >
          {item.type === 'photo' ? (
            <img className={styles.photo} src={item.src} alt={item.caption ?? 'Gallery photo'} />
          ) : (
            <VideoPlayer src={item.src} />
          )}
          {item.polaroid && item.caption && (
            <div className={styles.polaroidCaption}>
              <span>{item.caption}</span>
            </div>
          )}
        </motion.div>
      ))}
    </div>
  )
}
