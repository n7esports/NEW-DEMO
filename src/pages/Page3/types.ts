export interface LyricLine {
  time: number // seconds
  text: string
}

export interface Track {
  id: string
  title: string
  artist: string
  /** Gradient seed color for the album-art placeholder (no real artwork shipped). */
  color: string
  duration: number // seconds
  lyrics: LyricLine[]
  /** Optional path under /public, e.g. '/audio/track-1.mp3'. Left undefined by default. */
  audioSrc?: string
}
