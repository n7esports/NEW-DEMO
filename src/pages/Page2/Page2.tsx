import { useCallback, useEffect, useRef, useState } from 'react'
import { GlassPanel } from '../../components/GlassPanel/GlassPanel'
import { useBeep } from '../../hooks/useBeep'
import { useAppContext } from '../../context/AppContext'
import { applyVintageFilter } from './vintageFilter'
import type { BoothPhase, StickerState } from './types'
import styles from './Page2.module.css'

export interface Page2Props {
  onComplete: () => void
}

const SHOT_COUNT = 3
const STRIP_PHOTO_W = 480
const STRIP_PHOTO_H = 640
const DEFAULT_STICKERS: StickerState[] = [
  { id: 'sparkle', emoji: '✨', x: 12, y: 8 },
  { id: 'ribbon', emoji: '🎀', x: 82, y: 6 },
  { id: 'star', emoji: '⭐', x: 78, y: 90 },
]

function sleep(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

export function Page2({ onComplete }: Page2Props) {
  const { dispatch } = useAppContext()
  const { beep } = useBeep()

  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const stripRef = useRef<HTMLDivElement>(null)
  const dragId = useRef<string | null>(null)

  const [phase, setPhase] = useState<BoothPhase>('intro')
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [countdown, setCountdown] = useState<number | null>(null)
  const [flash, setFlash] = useState(false)
  const [photos, setPhotos] = useState<string[]>([])
  const [stickers, setStickers] = useState<StickerState[]>(DEFAULT_STICKERS)

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', aspectRatio: 3 / 4 },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play().catch(() => {})
      }
      setPhase('live')
    } catch (e) {
      setCameraError(e instanceof Error ? e.message : 'Camera access was denied.')
    }
  }, [])

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop())
    }
  }, [])

  const capturePhoto = useCallback((): string | null => {
    const video = videoRef.current
    if (!video || video.videoWidth === 0) return null
    const canvas = document.createElement('canvas')
    canvas.width = STRIP_PHOTO_W
    canvas.height = STRIP_PHOTO_H
    const ctx = canvas.getContext('2d')
    if (!ctx) return null

    const vw = video.videoWidth
    const vh = video.videoHeight
    const videoAspect = vw / vh
    const targetAspect = STRIP_PHOTO_W / STRIP_PHOTO_H
    let sx = 0
    let sy = 0
    let sw = vw
    let sh = vh
    if (videoAspect > targetAspect) {
      sw = vh * targetAspect
      sx = (vw - sw) / 2
    } else {
      sh = vw / targetAspect
      sy = (vh - sh) / 2
    }

    // Mirror horizontally for a natural selfie view
    ctx.translate(STRIP_PHOTO_W, 0)
    ctx.scale(-1, 1)
    ctx.drawImage(video, sx, sy, sw, sh, 0, 0, STRIP_PHOTO_W, STRIP_PHOTO_H)
    ctx.setTransform(1, 0, 0, 1, 0, 0)

    applyVintageFilter(ctx, STRIP_PHOTO_W, STRIP_PHOTO_H)
    return canvas.toDataURL('image/jpeg', 0.92)
  }, [])

  const runCaptureSequence = useCallback(async () => {
    setPhase('capturing')
    const shots: string[] = []
    for (let shot = 0; shot < SHOT_COUNT; shot++) {
      for (let c = 3; c >= 1; c--) {
        setCountdown(c)
        beep(520, 0.08)
        await sleep(700)
      }
      setCountdown(null)
      setFlash(true)
      beep(880, 0.1, 'triangle', 0.15)
      const dataUrl = capturePhoto()
      if (dataUrl) shots.push(dataUrl)
      await sleep(250)
      setFlash(false)
      await sleep(500)
    }
    setPhotos(shots)
    dispatch({ type: 'UPDATE_USER_DATA', payload: { photoStrip: shots } })
    setPhase('review')
  }, [beep, capturePhoto, dispatch])

  const handleStickerDrag = (id: string, clientX: number, clientY: number) => {
    const strip = stripRef.current
    if (!strip) return
    const rect = strip.getBoundingClientRect()
    const x = Math.min(96, Math.max(4, ((clientX - rect.left) / rect.width) * 100))
    const y = Math.min(96, Math.max(4, ((clientY - rect.top) / rect.height) * 100))
    setStickers((prev) => prev.map((s) => (s.id === id ? { ...s, x, y } : s)))
  }

  const buildStripDataUrl = useCallback((): Promise<string> => {
    return new Promise((resolve, reject) => {
      const padding = 24
      const canvas = document.createElement('canvas')
      canvas.width = STRIP_PHOTO_W + padding * 2
      canvas.height = photos.length * STRIP_PHOTO_H + padding * (photos.length + 1) + 70
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Canvas unavailable'))
        return
      }
      ctx.fillStyle = '#f5ecdf'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      let loaded = 0
      photos.forEach((src, i) => {
        const img = new Image()
        img.onload = () => {
          const y = padding + i * (STRIP_PHOTO_H + padding)
          ctx.drawImage(img, padding, y, STRIP_PHOTO_W, STRIP_PHOTO_H)
          loaded++
          if (loaded === photos.length) {
            ctx.fillStyle = '#3a2a1e'
            ctx.font = '30px "Caveat", cursive'
            ctx.textAlign = 'center'
            const timestamp = new Date().toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })
            ctx.fillText(`✦ Happy Birthday · ${timestamp} ✦`, canvas.width / 2, canvas.height - 24)
            resolve(canvas.toDataURL('image/png'))
          }
        }
        img.onerror = () => reject(new Error('Failed to load captured photo'))
        img.src = src
      })
    })
  }, [photos])

  const handleDownload = async () => {
    try {
      const dataUrl = await buildStripDataUrl()
      const link = document.createElement('a')
      link.download = 'photobooth-strip.png'
      link.href = dataUrl
      link.click()
    } catch {
      // Downloading is a bonus, not critical — fail silently if canvas export is blocked.
    }
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.heading}>Vintage Photo Booth 📸</h1>

      {phase === 'intro' && (
        <GlassPanel borderGlow className={styles.introCard}>
          <p>Strike a pose — three photos, vintage-filtered, straight into a keepsake strip.</p>
          <button type="button" className={styles.primaryBtn} onClick={startCamera}>
            Turn On Camera
          </button>
          <button type="button" className={styles.skipBtn} onClick={onComplete}>
            Skip this page →
          </button>
          {cameraError && <p className={styles.error}>{cameraError} You can still continue — just skip ahead.</p>}
        </GlassPanel>
      )}

      {(phase === 'live' || phase === 'capturing') && (
        <div className={styles.viewfinderWrap}>
          <div className={styles.viewfinder}>
            <video ref={videoRef} className={styles.video} muted playsInline />
            <div className={styles.vintageOverlay} />
            {countdown !== null && <div className={styles.countdownNumber}>{countdown}</div>}
            {flash && <div className={styles.flash} />}
          </div>
          {phase === 'live' && (
            <button type="button" className={styles.primaryBtn} onClick={runCaptureSequence}>
              📸 Start (3 photos)
            </button>
          )}
        </div>
      )}

      {phase === 'review' && (
        <div className={styles.reviewWrap}>
          <div ref={stripRef} className={styles.strip}>
            {photos.map((src, i) => (
              <div key={i} className={styles.stripPhoto}>
                <img src={src} alt={`Photo booth shot ${i + 1}`} />
                <span className={styles.timestamp}>
                  {new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
            ))}
            {stickers.map((s) => (
              <span
                key={s.id}
                className={styles.sticker}
                style={{ left: `${s.x}%`, top: `${s.y}%` }}
                onPointerDown={(e) => {
                  ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
                  dragId.current = s.id
                }}
                onPointerMove={(e) => {
                  if (dragId.current === s.id) handleStickerDrag(s.id, e.clientX, e.clientY)
                }}
                onPointerUp={() => {
                  dragId.current = null
                }}
              >
                {s.emoji}
              </span>
            ))}
          </div>
          <p className={styles.hint}>Drag the stickers ✨🎀⭐ anywhere on the strip.</p>
          <div className={styles.reviewActions}>
            <button type="button" className={styles.secondaryBtn} onClick={handleDownload}>
              ⬇ Download Strip
            </button>
            <button type="button" className={styles.primaryBtn} onClick={onComplete}>
              Continue →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
