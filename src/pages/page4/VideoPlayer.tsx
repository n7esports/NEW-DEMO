import { useRef, useState } from 'react'
import styles from './VideoPlayer.module.css'

export interface VideoPlayerProps {
  src: string
  poster?: string
}

export function VideoPlayer({ src, poster }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [failed, setFailed] = useState(false)

  const toggle = () => {
    const video = videoRef.current
    if (!video) return
    if (isPlaying) {
      video.pause()
      setIsPlaying(false)
    } else {
      video.play().then(() => setIsPlaying(true)).catch(() => setFailed(true))
    }
  }

  if (failed) {
    return (
      <div className={styles.fallback}>
        <span>🎬</span>
        <p>Add a video file to enable playback</p>
      </div>
    )
  }

  return (
    <div className={styles.container} onClick={toggle}>
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className={styles.video}
        onError={() => setFailed(true)}
        onEnded={() => setIsPlaying(false)}
      />
      <div className={styles.controls}>
        <button type="button" className={styles.playBtn} aria-label={isPlaying ? 'Pause video' : 'Play video'}>
          {isPlaying ? '⏸' : '▶'}
        </button>
      </div>
    </div>
  )
}
