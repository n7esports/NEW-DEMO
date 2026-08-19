import { useCallback, useRef } from 'react'

/**
 * Tiny Web Audio helper for short UI beeps (countdown ticks, button taps)
 * without needing to ship any audio files. Lazily creates the AudioContext
 * on first use, since browsers block audio until a user gesture anyway.
 */
export function useBeep() {
  const ctxRef = useRef<AudioContext | null>(null)

  const getCtx = useCallback(() => {
    if (!ctxRef.current) {
      const AudioContextCtor =
        window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      ctxRef.current = new AudioContextCtor()
    }
    if (ctxRef.current.state === 'suspended') {
      void ctxRef.current.resume()
    }
    return ctxRef.current
  }, [])

  const beep = useCallback(
    (frequency = 880, duration = 0.09, type: OscillatorType = 'sine', volume = 0.12) => {
      try {
        const ctx = getCtx()
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = type
        osc.frequency.value = frequency
        gain.gain.setValueAtTime(volume, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start()
        osc.stop(ctx.currentTime + duration)
      } catch {
        // Audio is a nice-to-have; silently ignore if the browser blocks it.
      }
    },
    [getCtx],
  )

  return { beep }
}
