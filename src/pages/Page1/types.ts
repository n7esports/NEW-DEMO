export type Page1State = 'countdown' | 'fireworks' | 'cakeAssembly' | 'wish' | 'blowOut' | 'balloons'

export interface CakeElement {
  id: string
  type: 'plate' | 'layer' | 'cream' | 'chocolate' | 'strawberry' | 'candle'
  emoji?: string
  animation: 'bounce' | 'fade' | 'scale'
  delay: number // ms
}

export interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  color: string
  size: number
}

export interface SmokeParticle {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  opacity: number
}

export interface Balloon {
  id: string
  x: number
  y: number
  color: string
  speed: number
  wishText?: string
  popped: boolean
}
