export interface StickerState {
  id: string
  emoji: string
  x: number // percentage of strip width
  y: number // percentage of strip height
}

export type BoothPhase = 'intro' | 'live' | 'capturing' | 'review'
