import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { TRACKS } from './tracks'
import styles from './Page3.module.css'

export interface Page3Props {
  onComplete: () => void
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

export function Page3({ onComplete }: Page3Props) {
  const [trackIndex, setTrackIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [volume, setVolume] = useState(0.8)
  const [isShuffled, setIsShuffled] = useState(false)
  const [isRepeating, setIsRepeating] = useState(false)
  const [audioFailed, setAudioFailed] = useState(false)

  const audioRef = useRef<HTMLAudioElement>(null)
  const activeLineRef = useRef<HTMLParagraphElement>(null)

  const track = TRACKS[trackIndex]
  const hasRealAudio = Boolean(track.audioSrc) && !audioFailed

  const goToTrack = (index: number) => {
    const next = (index + TRACKS.length) % TRACKS.length
    setTrackIndex(next)
    setCurrentTime(0)
    setAudioFailed(false)
  }

  const handleTrackEnd = () => {
    if (isRepeating) {
      setCurrentTime(0)
      if (hasRealAudio && audioRef.current) audioRef.current.currentTime = 0
      return
    }
    const nextIndex = isShuffled ? Math.floor(Math.random() * TRACKS.length) : trackIndex + 1
    if (nextIndex >= TRACKS.length && !isShuffled) {
      setIsPlaying(false)
      setCurrentTime(0)
    } else {
      goToTrack(nextIndex)
    }
  }

  // Real <audio> element drives playback when a src is provided and loads successfully.
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !hasRealAudio) return
    if (isPlaying) {
      audio.play().catch(() => setAudioFailed(true))
    } else {
      audio.pause()
    }
  }, [isPlaying, hasRealAudio, trackIndex])

  useEffect(() => {
    const audio = audioRef.current
    if (audio) audio.volume = volume
  }, [volume])

  // Simulated clock so the whole player is previewable even with no audio files.
  useEffect(() => {
    if (!isPlaying || hasRealAudio) return
    let raf = 0
    let last = performance.now()
    const tick = (now: number) => {
      const delta = (now - last) / 1000
      last = now
      setCurrentTime((t) => {
        const next = t + delta
        if (next >= track.duration) {
          handleTrackEnd()
          return 0
        }
        return next
      })
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, hasRealAudio, track.duration])

  const activeLineIndex = useMemo(() => {
    return track.lyrics.findIndex((line, i) => {
      const next = track.lyrics[i + 1]
      return currentTime >= line.time && (!next || currentTime < next.time)
    })
  }, [track.lyrics, currentTime])

  useEffect(() => {
    activeLineRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }, [activeLineIndex])

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value)
    setCurrentTime(time)
    if (hasRealAudio && audioRef.current) audioRef.current.currentTime = time
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.heading}>A Little Something to Play 🎵</h1>

      <div className={styles.playerGrid}>
        <div className={styles.playerCard}>
          <motion.div
            className={styles.vinyl}
            style={{ background: `radial-gradient(circle at 30% 30%, ${track.color}55, #111 70%)` }}
            animate={{ rotate: isPlaying ? 360 : 0 }}
            transition={{ duration: 3, ease: 'linear', repeat: isPlaying ? Infinity : 0 }}
          >
            <div className={styles.vinylLabel} style={{ background: track.color }} />
          </motion.div>

          <h2 className={styles.trackTitle}>{track.title}</h2>
          <p className={styles.trackArtist}>{track.artist}</p>

          {!track.audioSrc && (
            <p className={styles.notice}>Previewing with a simulated clock — add a file to /public/audio to hear it for real.</p>
          )}
          {audioFailed && <p className={styles.notice}>Couldn't load that audio file — still previewing the sync.</p>}

          <input
            type="range"
            className={styles.seek}
            min={0}
            max={track.duration}
            step={0.1}
            value={Math.min(currentTime, track.duration)}
            onChange={handleSeek}
          />
          <div className={styles.timeRow}>
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(track.duration)}</span>
          </div>

          <div className={styles.controls}>
            <button
              type="button"
              className={`${styles.iconBtn} ${isShuffled ? styles.active : ''}`}
              aria-label="Shuffle"
              onClick={() => setIsShuffled((s) => !s)}
            >
              🔀
            </button>
            <button type="button" className={styles.iconBtn} aria-label="Previous track" onClick={() => goToTrack(trackIndex - 1)}>
              ⏮
            </button>
            <button
              type="button"
              className={styles.playBtn}
              aria-label={isPlaying ? 'Pause' : 'Play'}
              onClick={() => setIsPlaying((p) => !p)}
            >
              {isPlaying ? '⏸' : '▶'}
            </button>
            <button type="button" className={styles.iconBtn} aria-label="Next track" onClick={() => goToTrack(trackIndex + 1)}>
              ⏭
            </button>
            <button
              type="button"
              className={`${styles.iconBtn} ${isRepeating ? styles.active : ''}`}
              aria-label="Repeat"
              onClick={() => setIsRepeating((r) => !r)}
            >
              🔁
            </button>
          </div>

          <div className={styles.volumeRow}>
            <span aria-hidden="true">🔈</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              aria-label="Volume"
            />
          </div>

          {track.audioSrc && (
            <audio
              ref={audioRef}
              src={track.audioSrc}
              onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
              onEnded={handleTrackEnd}
              onError={() => setAudioFailed(true)}
            />
          )}
        </div>

        <div className={styles.lyricsCard}>
          {track.lyrics.map((line, i) => (
            <p
              key={i}
              ref={i === activeLineIndex ? activeLineRef : undefined}
              className={i === activeLineIndex ? styles.lyricActive : styles.lyricInactive}
            >
              {line.text}
            </p>
          ))}
        </div>
      </div>

      <button type="button" className={styles.continueBtn} onClick={onComplete}>
        Continue →
      </button>
    </div>
  )
}
