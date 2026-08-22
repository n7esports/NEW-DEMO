export interface LyricLine {
  time: number // seconds
  text: string
}

export interface Track {
  id: string
  title: string
  artist: string
  coverUrl: string
  audioUrl?: string
  color: string
  duration: number // seconds
  lyrics: LyricLine[]
}
