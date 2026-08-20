export type PrizeRarity = 'high' | 'mid' | 'low'

export interface Prize {
  id: string
  label: string
  modelPath: string // .glb under /public/models
  rarity: PrizeRarity
  weight: number // higher = more likely to be inside a given box
}

// Priority 1 = highest weight, so lilies/calla lilies show up most often.
export const PRIZES: Prize[] = [
  { id: 'stargazer-lily', label: 'Stargazer Lily', modelPath: '/models/lily.glb', rarity: 'high', weight: 5 },
  { id: 'calla-lily', label: 'Calla Lily', modelPath: '/models/calla-lily.glb', rarity: 'high', weight: 5 },
  { id: 'red-rose', label: 'Deep Red Rose', modelPath: '/models/rose-solo.glb', rarity: 'mid', weight: 3 },
  { id: 'blush-rose', label: 'Blush Rose', modelPath: '/models/rose-solo-blush.glb', rarity: 'mid', weight: 3 },
  { id: 'rose-bouquet', label: 'Rose Bouquet', modelPath: '/models/rose-bouquet.glb', rarity: 'mid', weight: 2 },
  { id: 'teddy-bear', label: 'Plush Teddy Bear', modelPath: '/models/teddy-bear.glb', rarity: 'low', weight: 2 },
]

export function pickWeightedPrize(): Prize {
  const total = PRIZES.reduce((sum, p) => sum + p.weight, 0)
  let roll = Math.random() * total
  for (const p of PRIZES) {
    roll -= p.weight
    if (roll <= 0) return p
  }
  return PRIZES[0]
}
