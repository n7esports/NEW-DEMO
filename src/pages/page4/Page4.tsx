import { useMemo, useState } from 'react'
import { useAppContext } from '../../context/AppContext'
import { DigitalLocker } from './DigitalLocker'
import { MasonryGallery } from './MasonryGallery'
import type { GalleryItem } from './types'
import styles from './Page4.module.css'

export interface Page4Props {
  onComplete: () => void
}

// Change this to the recipient's real DOB (e.g. DDMM or MMDD) before sending the gift.
const VAULT_PASSCODE = '1509'

export function Page4({ onComplete }: Page4Props) {
  const { userData } = useAppContext()
  const [unlocked, setUnlocked] = useState(false)

  const galleryItems = useMemo<GalleryItem[]>(() => {
    const photoItems: GalleryItem[] = (userData.photoStrip ?? []).map((src, i) => ({
      id: `photo-${i}`,
      type: 'photo',
      src,
      caption: `Shot ${i + 1}`,
      polaroid: true,
    }))
    const videoItem: GalleryItem = {
      id: 'video-1',
      type: 'video',
      src: '/videos/sample.mp4', // drop a file here to enable playback
    }
    return [...photoItems, videoItem]
  }, [userData.photoStrip])

  return (
    <div className={styles.page}>
      <h1 className={styles.heading}>The DOB Vault 🔐</h1>

      {!unlocked ? (
        <DigitalLocker passcode={VAULT_PASSCODE} onUnlock={() => setUnlocked(true)} />
      ) : (
        <div className={styles.galleryWrap}>
          {(userData.photoStrip?.length ?? 0) === 0 && (
            <p className={styles.emptyNotice}>
              No photo booth shots yet — visit Page 2 to add some, or add your own to the gallery below.
            </p>
          )}
          <MasonryGallery items={galleryItems} />
          <button type="button" className={styles.continueBtn} onClick={onComplete}>
            Continue to my letter →
          </button>
        </div>
      )}
    </div>
  )
}
