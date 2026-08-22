import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import type { CSSProperties } from 'react'
import { useAppContext } from '../../context/AppContext'
import { TRACKS } from './tracks'
import styles from './Page3.module.css'

export interface Page3Props {
  onComplete: () => void
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00'
  return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`
}

export function Page3({ onComplete }: Page3Props) {
  const { dispatch } = useAppContext()
  const [trackIndex, setTrackIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [volume, setVolume] = useState(0.8)
  const [isShuffled, setIsShuffled] = useState(false)
  const [isRepeating, setIsRepeating] = useState(false)
  const [audioFailed, setAudioFailed] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)
  const track = TRACKS[trackIndex]
  const hasRealAudio = Boolean(track.audioUrl) && !audioFailed

  const goToTrack = (index: number, shouldPlay = isPlaying) => {
    setTrackIndex((index + TRACKS.length) % TRACKS.length)
    setCurrentTime(0)
    setAudioFailed(false)
    setIsPlaying(shouldPlay)
  }

  const handleTrackEnd = () => {
    if (isRepeating) {
      setCurrentTime(0)
      if (audioRef.current) audioRef.current.currentTime = 0
      return
    }
    if (!isShuffled && trackIndex === TRACKS.length - 1) {
      setIsPlaying(false)
      setCurrentTime(0)
      return
    }
    const nextIndex = isShuffled ? Math.floor(Math.random() * TRACKS.length) : trackIndex + 1
    goToTrack(nextIndex)
  }

  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !hasRealAudio) return
    audio.volume = volume
    if (isPlaying) audio.play().catch(() => setAudioFailed(true))
    else audio.pause()
  }, [isPlaying, hasRealAudio, trackIndex, volume])

  useEffect(() => {
    if (!isPlaying || hasRealAudio) return
    let frame = 0
    let last = performance.now()
    const tick = (now: number) => {
      const delta = (now - last) / 1000
      last = now
      setCurrentTime((time) => {
        const next = time + delta
        if (next >= track.duration) {
          handleTrackEnd()
          return 0
        }
        return next
      })
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
    // Track changes intentionally restart this preview clock.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, hasRealAudio, track.duration])

  const handleSeek = (event: ChangeEvent<HTMLInputElement>) => {
    const time = Number(event.target.value)
    setCurrentTime(time)
    if (audioRef.current && hasRealAudio) audioRef.current.currentTime = time
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.kicker}>Arfa FM · made for your mood</p>
          <h1>Good songs for a good day.</h1>
        </div>
        <span className={styles.liveBadge}><i /> Listening room</span>
      </header>

      <section className={styles.playerLayout}>
        <div className={styles.playerCard}>
          <div className={styles.artworkShell} style={{ '--track-color': track.color } as CSSProperties}>
            <div className={styles.artworkGlow} />
            <div className={`${styles.vinyl} ${isPlaying ? styles.spinning : ''}`}>
              <img src={track.coverUrl} alt={`${track.title} cover`} />
            </div>
          </div>
          <div className={styles.trackInfo}>
            <p className={styles.nowPlaying}>Now playing</p>
            <h2>{track.title}</h2>
            <p>{track.artist}</p>
          </div>

          <input className={styles.seek} type="range" min={0} max={track.duration} step={0.1} value={Math.min(currentTime, track.duration)} onChange={handleSeek} aria-label="Song progress" />
          <div className={styles.timeRow}><span>{formatTime(currentTime)}</span><span>{formatTime(track.duration)}</span></div>

          <div className={styles.controls}>
            <button type="button" className={`${styles.controlButton} ${isShuffled ? styles.active : ''}`} onClick={() => setIsShuffled((value) => !value)} aria-label="Toggle shuffle">↝</button>
            <button type="button" className={styles.controlButton} onClick={() => goToTrack(trackIndex - 1)} aria-label="Previous track">|◀</button>
            <button type="button" className={styles.playButton} onClick={() => setIsPlaying((value) => !value)} aria-label={isPlaying ? 'Pause' : 'Play'}>{isPlaying ? 'Ⅱ' : '▶'}</button>
            <button type="button" className={styles.controlButton} onClick={() => goToTrack(trackIndex + 1)} aria-label="Next track">▶|</button>
            <button type="button" className={`${styles.controlButton} ${isRepeating ? styles.active : ''}`} onClick={() => setIsRepeating((value) => !value)} aria-label="Toggle repeat">↻</button>
          </div>

          <label className={styles.volume}><span aria-hidden="true">◖</span><input type="range" min={0} max={1} step={0.01} value={volume} onChange={(event) => setVolume(Number(event.target.value))} aria-label="Volume" /><span aria-hidden="true">◗</span></label>
          {!track.audioUrl && <p className={styles.notice}>Preview mode · add an audio file to this track to enable playback.</p>}
          {audioFailed && <p className={styles.notice}>Audio file unavailable · continuing in preview mode.</p>}
          {hasRealAudio && <audio ref={audioRef} src={track.audioUrl} onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)} onEnded={handleTrackEnd} onError={() => setAudioFailed(true)} />}
        </div>

        <section className={styles.queue}>
          <div className={styles.queueHeading}><div><p className={styles.kicker}>Keep the feeling going</p><h2>Some songs suggested for you</h2></div><span>{TRACKS.length} tracks</span></div>
          <div className={styles.trackList}>
            {TRACKS.map((item, index) => <button type="button" className={`${styles.trackItem} ${index === trackIndex ? styles.trackItemActive : ''}`} onClick={() => goToTrack(index, true)} key={item.id}><span className={styles.trackNumber}>{String(index + 1).padStart(2, '0')}</span><img src={item.coverUrl} alt="" /><span className={styles.trackText}><strong>{item.title}</strong><small>{item.artist}</small></span><span className={styles.trackPlay}>{index === trackIndex && isPlaying ? 'Ⅱ' : '▶'}</span></button>)}
          </div>
        </section>
      </section>

      <nav className={styles.bottomBar} aria-label="Page navigation"><button type="button" className={styles.backButton} onClick={() => dispatch({ type: 'PREV_PAGE' })}>← Back to Wish Board</button><button type="button" className={styles.nextButton} onClick={onComplete}>Next Page <span aria-hidden="true">→</span></button></nav>
    </main>
  )
}

export default Page3
