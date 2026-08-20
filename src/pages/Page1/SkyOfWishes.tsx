import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useBeep } from '../../hooks/useBeep'
import styles from './SkyOfWishes.module.css'

export interface SkyOfWishesProps {
  wishText: string
  onComplete: () => void
}

type Phase =
  | 'roomTransition'
  | 'fadeIn'
  | 'riseParticles'
  | 'formHappyBirthday'
  | 'holdHappyBirthday'
  | 'dissolve'
  | 'formArfa'
  | 'holdArfa'
  | 'burst'
  | 'celebration'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  opacity: number
  color: string
  twinkleSpeed: number
  twinkleOffset: number
  drift?: number
}

interface TextParticle extends Particle {
  targetX: number
  targetY: number
  startX: number
  startY: number
  progress: number
  isActive: boolean
  seed: number
}

interface FireworkParticle {
  x: number
  y: number
  px: number
  py: number
  vx: number
  vy: number
  life: number
  maxLife: number
  color: string
  size: number
  drag: number
  gravity: number
}

interface FireworkRocket {
  x: number
  y: number
  targetY: number
  vx: number
  vy: number
  color: string
  trail: Array<{ x: number; y: number }>
}

interface GoldenRainParticle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  life: number
  maxLife: number
  phase: number
}

interface Petal {
  x: number
  y: number
  vx: number
  vy: number
  rotation: number
  rotationSpeed: number
  size: number
  color: string
  opacity: number
  swayPhase: number
  swaySpeed: number
  depth: number
}

const COLORS = {
  deepNight: '#050817',
  midnightBlue: '#0B1230',
  purple: '#38245C',
  softPink: '#F5A6C8',
  rose: '#E878A5',
  warmGold: '#FFD166',
  brightGold: '#FFE8A3',
  white: '#FFF8F0',
  darkGold: '#8A5A00',
}

const TAU = Math.PI * 2

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value))

const easeOutCubic = (t: number) => 1 - Math.pow(1 - clamp(t, 0, 1), 3)
const easeInOutCubic = (t: number) => {
  const n = clamp(t, 0, 1)
  return n < 0.5 ? 4 * n * n * n : 1 - Math.pow(-2 * n + 2, 3) / 2
}

class SkyOfWishesEngine {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private backgroundParticles: Particle[] = []
  private textParticles: TextParticle[] = []
  private fireworkParticles: FireworkParticle[] = []
  private fireworkRockets: FireworkRocket[] = []
  private goldenRain: GoldenRainParticle[] = []
  private petals: Petal[] = []
  private stars: Particle[] = []
  private animationFrame: number | null = null
  private resizeObserver: ResizeObserver | null = null
  private timers = new Set<ReturnType<typeof window.setTimeout>>()
  private running = false
  private destroyed = false
  private width = 0
  private height = 0
  private dpr = 1
  private lastTime = 0
  private phaseStartTime = 0
  private phase: Phase = 'roomTransition'
  private moonX = 0
  private moonY = 0
  private moonRadius = 40
  private isMobile = false
  private performanceTier: 'high' | 'medium' | 'low' = 'medium'
  private textTargetCount = 0
  private skyReveal = 0
  private roomRecede = 0
  private roomDarkness = 0
  private arfaGlow = 0
  private celebrationStarted = false
  private onPhaseChange?: (phase: Phase) => void

  constructor(canvas: HTMLCanvasElement, onPhaseChange?: (phase: Phase) => void) {
    this.canvas = canvas
    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) throw new Error('SkyOfWishes: 2D canvas is not available.')
    this.ctx = ctx
    this.onPhaseChange = onPhaseChange

    this.detectPerformanceTier()
    this.setupCanvas()
    this.createStars()
    this.createPetals()
    this.createBackgroundParticles()
    this.phaseStartTime = performance.now()
  }

  private detectPerformanceTier() {
    this.isMobile = window.innerWidth < 768
    const cores = typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 4 : 4
    const memory = typeof navigator !== 'undefined'
      ? Number((navigator as Navigator & { deviceMemory?: number }).deviceMemory || 4)
      : 4

    if (this.isMobile || cores <= 2 || memory <= 2) {
      this.performanceTier = 'low'
    } else if (cores >= 8 && memory >= 8) {
      this.performanceTier = 'high'
    } else {
      this.performanceTier = 'medium'
    }
  }

  private getTextParticleBudget(text: string) {
    if (text === 'ARFA') {
      return this.performanceTier === 'high'
        ? 6500
        : this.performanceTier === 'medium'
          ? 4500
          : 2600
    }

    return this.performanceTier === 'high'
      ? 5000
      : this.performanceTier === 'medium'
        ? 3500
        : 2100
  }

  private getBackgroundParticleCount() {
    if (this.performanceTier === 'high') return 500
    if (this.performanceTier === 'medium') return 300
    return 170
  }

  private getStarCount() {
    if (this.performanceTier === 'high') return 260
    if (this.performanceTier === 'medium') return 170
    return 90
  }

  private getPetalCount() {
    if (this.performanceTier === 'high') return 55
    if (this.performanceTier === 'medium') return 38
    return 20
  }

  private setupCanvas() {
    this.width = Math.max(1, window.innerWidth)
    this.height = Math.max(1, window.innerHeight)
    this.dpr = Math.min(window.devicePixelRatio || 1, this.performanceTier === 'low' ? 1.5 : 2)

    this.canvas.width = Math.round(this.width * this.dpr)
    this.canvas.height = Math.round(this.height * this.dpr)
    this.canvas.style.width = `${this.width}px`
    this.canvas.style.height = `${this.height}px`

    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0)
    this.ctx.globalAlpha = 1
    this.ctx.globalCompositeOperation = 'source-over'

    this.moonX = this.width * (this.isMobile ? 0.78 : 0.81)
    this.moonY = this.height * (this.isMobile ? 0.18 : 0.2)
    this.moonRadius = this.isMobile ? 30 : 45
  }

  private createStars() {
    const count = this.getStarCount()
    this.stars = Array.from({ length: count }, () => ({
      x: Math.random() * this.width,
      y: Math.random() * this.height * 0.78,
      vx: 0,
      vy: 0,
      size: Math.random() * 1.5 + 0.35,
      opacity: Math.random() * 0.65 + 0.25,
      color: Math.random() > 0.92 ? COLORS.warmGold : COLORS.white,
      twinkleSpeed: Math.random() * 1.8 + 0.7,
      twinkleOffset: Math.random() * TAU,
    }))
  }

  private createBackgroundParticles() {
    const count = this.getBackgroundParticleCount()
    this.backgroundParticles = Array.from({ length: count }, () => ({
      x: Math.random() * this.width,
      y: this.height + Math.random() * this.height * 0.35,
      vx: (Math.random() - 0.5) * 0.16,
      vy: -(Math.random() * 0.42 + 0.22),
      size: Math.random() * 1.8 + 0.45,
      opacity: Math.random() * 0.45 + 0.15,
      color: Math.random() > 0.75 ? COLORS.brightGold : COLORS.warmGold,
      twinkleSpeed: Math.random() * 1.8 + 0.8,
      twinkleOffset: Math.random() * TAU,
      drift: Math.random() * TAU,
    }))
  }

  private createPetals() {
    const colors = [COLORS.softPink, '#FFB4D9', '#FFC8DD', COLORS.rose, COLORS.brightGold]
    this.petals = Array.from({ length: this.getPetalCount() }, () => ({
      x: Math.random() * this.width,
      y: Math.random() * this.height,
      vx: (Math.random() - 0.5) * 0.35,
      vy: Math.random() * 0.22 + 0.08,
      rotation: Math.random() * TAU,
      rotationSpeed: (Math.random() - 0.5) * 0.025,
      size: Math.random() * 6 + 3,
      color: colors[Math.floor(Math.random() * colors.length)],
      opacity: Math.random() * 0.35 + 0.15,
      swayPhase: Math.random() * TAU,
      swaySpeed: Math.random() * 0.55 + 0.35,
      depth: Math.random() * 0.8 + 0.2,
    }))
  }

  private createGoldenRain(count?: number) {
    const defaultCount = this.performanceTier === 'high'
      ? 650
      : this.performanceTier === 'medium'
        ? 400
        : 220

    const total = count ?? defaultCount
    this.goldenRain = Array.from({ length: total }, () => ({
      x: Math.random() * this.width,
      y: -Math.random() * this.height,
      vx: (Math.random() - 0.5) * 0.45,
      vy: Math.random() * 0.8 + 0.35,
      size: Math.random() * 1.8 + 0.35,
      life: Math.random() * 100,
      maxLife: 180 + Math.random() * 180,
      phase: Math.random() * TAU,
    }))
  }

  private sampleText(text: string, fontSize: number): Array<{ x: number; y: number }> {
    const scale = this.performanceTier === 'low' ? 0.5 : 0.6
    const sampleWidth = Math.max(320, Math.round(this.width * scale))
    const sampleHeight = Math.max(240, Math.round(this.height * scale))
    const offscreen = document.createElement('canvas')
    const offCtx = offscreen.getContext('2d', { willReadFrequently: true })

    if (!offCtx) return []

    offscreen.width = sampleWidth
    offscreen.height = sampleHeight

    const scaledFont = Math.max(18, fontSize * scale)
    offCtx.clearRect(0, 0, sampleWidth, sampleHeight)
    offCtx.fillStyle = '#fff'
    offCtx.font = `700 ${scaledFont}px Georgia, serif`
    offCtx.textAlign = 'center'
    offCtx.textBaseline = 'middle'

    const centerX = sampleWidth / 2
    const centerY = sampleHeight * 0.42

    // Keep the long phrase inside a predictable area on phones.
    let renderedText = text
    if (text === 'HAPPY BIRTHDAY') {
      offCtx.font = `700 ${scaledFont}px Georgia, serif`
      const maxWidth = sampleWidth * 0.88
      while (offCtx.measureText(renderedText).width > maxWidth && scaledFont > 18) {
        break
      }
    }

    offCtx.fillText(renderedText, centerX, centerY)

    const imageData = offCtx.getImageData(0, 0, sampleWidth, sampleHeight)
    const data = imageData.data
    const gap = this.performanceTier === 'high' ? 2 : this.performanceTier === 'medium' ? 3 : 4
    const candidates: Array<{ x: number; y: number }> = []

    for (let y = 0; y < sampleHeight; y += gap) {
      for (let x = 0; x < sampleWidth; x += gap) {
        const alpha = data[(y * sampleWidth + x) * 4 + 3]
        if (alpha > 100) {
          candidates.push({
            x: x / scale,
            y: y / scale,
          })
        }
      }
    }

    const budget = this.getTextParticleBudget(text)
    if (candidates.length <= budget) return candidates

    // Deterministic-ish spatial thinning: retain evenly distributed samples.
    const stride = candidates.length / budget
    const result: Array<{ x: number; y: number }> = []
    for (let i = 0; i < budget; i++) {
      result.push(candidates[Math.floor(i * stride)])
    }
    return result
  }

  private formText(text: string) {
    const fontSize = text === 'ARFA'
      ? clamp(this.width * (this.isMobile ? 0.18 : 0.15), 54, 130)
      : clamp(this.width * (this.isMobile ? 0.065 : 0.075), 25, 64)

    const targets = this.sampleText(text, fontSize)
    this.textTargetCount = targets.length

    const oldText = this.textParticles
    this.textParticles = []

    for (const p of oldText) {
      p.isActive = false
      p.progress = 0
      p.startX = p.x
      p.startY = p.y
      const angle = Math.random() * TAU
      const speed = Math.random() * 2.5 + 1
      p.targetX = p.x + Math.cos(angle) * speed * 30
      p.targetY = p.y + Math.sin(angle) * speed * 30
      p.opacity *= 0.4
    }

    const source = this.backgroundParticles.splice(0, Math.min(targets.length, this.backgroundParticles.length))

    for (let i = 0; i < targets.length; i++) {
      const particle = source[i]
      const target = targets[i]
      const base: Particle = particle ?? {
        x: Math.random() * this.width,
        y: this.height + Math.random() * 120,
        vx: 0,
        vy: 0,
        size: Math.random() * 1.45 + 0.55,
        opacity: Math.random() * 0.45 + 0.55,
        color: COLORS.brightGold,
        twinkleSpeed: Math.random() * 2 + 0.8,
        twinkleOffset: Math.random() * TAU,
      }

      this.textParticles.push({
        ...base,
        startX: base.x,
        startY: base.y,
        targetX: target.x,
        targetY: target.y,
        progress: 0,
        isActive: true,
        seed: Math.random() * 1000,
        color: text === 'ARFA' ? COLORS.brightGold : COLORS.warmGold,
        size: text === 'ARFA' ? Math.random() * 1.55 + 0.65 : Math.random() * 1.35 + 0.5,
      })
    }
  }

  private dissolveText(force = false) {
    for (const p of this.textParticles) {
      p.isActive = false
      p.progress = 0
      p.startX = p.x
      p.startY = p.y
      const angle = Math.random() * TAU
      const speed = force ? Math.random() * 6 + 3 : Math.random() * 3 + 1.2
      p.targetX = p.x + Math.cos(angle) * speed * (force ? 24 : 18)
      p.targetY = p.y + Math.sin(angle) * speed * (force ? 24 : 18)
    }
  }

  private schedule(callback: () => void, delay: number) {
    const timer = window.setTimeout(() => {
      this.timers.delete(timer)
      if (!this.destroyed) callback()
    }, delay)
    this.timers.add(timer)
  }

  private createFirework(x: number, targetY: number) {
    const colors = [COLORS.warmGold, COLORS.brightGold, COLORS.softPink, COLORS.rose, '#FFFFFF']
    const color = colors[Math.floor(Math.random() * colors.length)]

    this.fireworkRockets.push({
      x,
      y: this.height + 20,
      targetY,
      vx: (Math.random() - 0.5) * 0.6,
      vy: -(Math.random() * 4.5 + 6.5),
      color,
      trail: [],
    })
  }

  private explodeFirework(x: number, y: number, color: string) {
    const count = this.performanceTier === 'high' ? 110 : this.performanceTier === 'medium' ? 80 : 48
    const pattern = Math.random()

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * TAU + (Math.random() - 0.5) * 0.15
      const speed = pattern < 0.35
        ? Math.random() * 3.6 + 2.2
        : Math.pow(Math.random(), 0.65) * 5.2 + 1.3

      this.fireworkParticles.push({
        x,
        y,
        px: x,
        py: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0,
        maxLife: 55 + Math.random() * 55,
        color: Math.random() > 0.76
          ? COLORS.brightGold
          : Math.random() > 0.88
            ? COLORS.white
            : color,
        size: Math.random() * 1.7 + 0.65,
        drag: 0.985 + Math.random() * 0.008,
        gravity: 0.025 + Math.random() * 0.02,
      })
    }
  }

  private triggerFireworks() {
    if (this.celebrationStarted) return
    this.celebrationStarted = true

    const positions = [
      { x: this.width * 0.18, y: this.height * 0.28, delay: 100 },
      { x: this.width * 0.82, y: this.height * 0.24, delay: 500 },
      { x: this.width * 0.5, y: this.height * 0.17, delay: 900 },
      { x: this.width * 0.34, y: this.height * 0.34, delay: 1250 },
      { x: this.width * 0.67, y: this.height * 0.31, delay: 1550 },
      { x: this.width * 0.5, y: this.height * 0.23, delay: 2100 },
    ]

    for (const position of positions) {
      this.schedule(() => this.createFirework(position.x, position.y), position.delay)
    }
  }

  private drawMoon(time: number) {
    const ctx = this.ctx
    const pulse = 0.92 + Math.sin(time * 0.00035) * 0.04

    const glow = ctx.createRadialGradient(
      this.moonX,
      this.moonY,
      this.moonRadius * 0.35,
      this.moonX,
      this.moonY,
      this.moonRadius * 3.8,
    )
    glow.addColorStop(0, 'rgba(255, 248, 240, 0.26)')
    glow.addColorStop(0.38, 'rgba(255, 220, 180, 0.10)')
    glow.addColorStop(1, 'rgba(255, 248, 240, 0)')

    ctx.fillStyle = glow
    ctx.globalAlpha = this.skyReveal
    ctx.beginPath()
    ctx.arc(this.moonX, this.moonY, this.moonRadius * 3.8, 0, TAU)
    ctx.fill()

    const moon = ctx.createRadialGradient(
      this.moonX - this.moonRadius * 0.25,
      this.moonY - this.moonRadius * 0.25,
      this.moonRadius * 0.08,
      this.moonX,
      this.moonY,
      this.moonRadius,
    )
    moon.addColorStop(0, '#FFFEF7')
    moon.addColorStop(0.78, '#F7E8D4')
    moon.addColorStop(1, '#DCC8B2')

    ctx.globalAlpha = this.skyReveal
    ctx.fillStyle = moon
    ctx.beginPath()
    ctx.arc(this.moonX, this.moonY, this.moonRadius * pulse, 0, TAU)
    ctx.fill()

    ctx.fillStyle = 'rgba(185, 160, 135, 0.18)'
    const craters = [
      { x: -0.3, y: -0.2, r: 0.2 },
      { x: 0.2, y: 0.3, r: 0.15 },
      { x: -0.1, y: 0.4, r: 0.1 },
    ]

    for (const crater of craters) {
      ctx.beginPath()
      ctx.arc(
        this.moonX + crater.x * this.moonRadius,
        this.moonY + crater.y * this.moonRadius,
        crater.r * this.moonRadius,
        0,
        TAU,
      )
      ctx.fill()
    }

    ctx.globalAlpha = 1
  }

  private drawParticle(particle: Particle | TextParticle, time: number, alphaMultiplier = 1) {
    const twinkle =
      Math.sin(time * 0.001 * particle.twinkleSpeed + particle.twinkleOffset) * 0.22 + 0.78
    const alpha = clamp(particle.opacity * twinkle * alphaMultiplier, 0, 1)

    if (alpha <= 0.01) return

    const size = particle.size
    const ctx = this.ctx

    // One cheap glow ring + one core instead of a radial gradient per particle.
    ctx.globalAlpha = alpha * 0.14
    ctx.fillStyle = particle.color
    ctx.beginPath()
    ctx.arc(particle.x, particle.y, size * 2.5, 0, TAU)
    ctx.fill()

    ctx.globalAlpha = alpha
    ctx.fillStyle = particle.color
    ctx.beginPath()
    ctx.arc(particle.x, particle.y, size, 0, TAU)
    ctx.fill()

    ctx.globalAlpha = 1
  }

  private drawTextParticle(particle: TextParticle, time: number, alphaMultiplier: number) {
    const twinkle =
      Math.sin(time * 0.0014 * particle.twinkleSpeed + particle.twinkleOffset) * 0.18 + 0.82
    const alpha = clamp(particle.opacity * twinkle * alphaMultiplier, 0, 1)
    if (alpha <= 0.01) return

    const ctx = this.ctx
    const shimmer = Math.sin(time * 0.0012 + particle.seed) * 0.5 + 0.5
    const core = particle.color
    const glowAlpha = 0.18 + shimmer * 0.1

    ctx.globalAlpha = alpha * glowAlpha
    ctx.fillStyle = COLORS.warmGold
    ctx.beginPath()
    ctx.arc(particle.x, particle.y, particle.size * 3.4, 0, TAU)
    ctx.fill()

    ctx.globalAlpha = alpha
    ctx.fillStyle = core
    ctx.beginPath()
    ctx.arc(particle.x, particle.y, particle.size, 0, TAU)
    ctx.fill()

    ctx.globalAlpha = 1
  }

  private updateParticles(time: number, dt: number) {
    const speed = dt / 16.6667

    for (const p of this.backgroundParticles) {
      p.x += p.vx * speed + Math.sin(time * 0.00035 + (p.drift ?? 0)) * 0.025 * speed
      p.y += p.vy * speed

      if (p.y < -20) {
        p.y = this.height + 20
        p.x = Math.random() * this.width
      }
    }

    for (const p of this.textParticles) {
      if (p.isActive) {
        if (p.progress < 1) {
          p.progress = Math.min(1, p.progress + 0.026 * speed)
          const eased = easeOutCubic(p.progress)
          p.x = p.startX + (p.targetX - p.startX) * eased
          p.y = p.startY + (p.targetY - p.startY) * eased
        } else {
          const floatAmount = p.size > 1.3 ? 1.35 : 0.8
          p.x = p.targetX + Math.sin(time * 0.001 + p.seed) * floatAmount
          p.y = p.targetY + Math.cos(time * 0.00115 + p.seed) * floatAmount
        }
      } else if (p.progress < 1) {
        p.progress = Math.min(1, p.progress + 0.034 * speed)
        const eased = easeOutCubic(p.progress)
        p.x = p.startX + (p.targetX - p.startX) * eased
        p.y = p.startY + (p.targetY - p.startY) * eased
        p.opacity *= Math.pow(0.965, speed)
      }
    }

    this.textParticles = this.textParticles.filter(
      p => p.isActive || p.progress < 1,
    )

    for (const rocket of this.fireworkRockets) {
      rocket.trail.push({ x: rocket.x, y: rocket.y })
      if (rocket.trail.length > 8) rocket.trail.shift()

      rocket.x += rocket.vx * speed
      rocket.y += rocket.vy * speed
      rocket.vy += 0.075 * speed
      rocket.vx *= Math.pow(0.995, speed)

      if (rocket.y <= rocket.targetY || rocket.vy >= -0.5) {
        this.explodeFirework(rocket.x, rocket.y, rocket.color)
        rocket.y = -9999
      }
    }
    this.fireworkRockets = this.fireworkRockets.filter(r => r.y > -1000)

    for (const p of this.fireworkParticles) {
      p.px = p.x
      p.py = p.y
      p.x += p.vx * speed
      p.y += p.vy * speed
      p.vx *= Math.pow(p.drag, speed)
      p.vy = p.vy * Math.pow(p.drag, speed) + p.gravity * speed
      p.life += speed
    }
    this.fireworkParticles = this.fireworkParticles.filter(p => p.life < p.maxLife)

    for (const p of this.goldenRain) {
      p.x += (p.vx + Math.sin(time * 0.001 + p.phase) * 0.15) * speed
      p.y += p.vy * speed
      p.life += speed

      if (p.y > this.height + 20 || p.life > p.maxLife) {
        p.x = Math.random() * this.width
        p.y = -10
        p.life = 0
      }
    }

    for (const p of this.petals) {
      p.x += (p.vx + Math.sin(time * 0.001 * p.swaySpeed + p.swayPhase) * 0.28 * p.depth) * speed
      p.y += p.vy * speed
      p.rotation += p.rotationSpeed * speed

      if (p.y > this.height + 30) {
        p.y = -30
        p.x = Math.random() * this.width
      }
      if (p.x > this.width + 30) p.x = -30
      if (p.x < -30) p.x = this.width + 30
    }
  }

  private drawSky(time: number) {
    const ctx = this.ctx
    const reveal = this.skyReveal

    const gradient = ctx.createLinearGradient(0, 0, 0, this.height)
    gradient.addColorStop(0, '#030611')
    gradient.addColorStop(0.42, COLORS.deepNight)
    gradient.addColorStop(0.72, COLORS.midnightBlue)
    gradient.addColorStop(1, '#17132F')

    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, this.width, this.height)

    const haze = ctx.createRadialGradient(
      this.width * 0.5,
      this.height * 0.42,
      0,
      this.width * 0.5,
      this.height * 0.42,
      this.width * 0.75,
    )
    haze.addColorStop(0, `rgba(56, 36, 92, ${0.28 * reveal})`)
    haze.addColorStop(0.5, `rgba(30, 40, 95, ${0.10 * reveal})`)
    haze.addColorStop(1, 'rgba(0,0,0,0)')

    ctx.fillStyle = haze
    ctx.fillRect(0, 0, this.width, this.height)

    this.stars.forEach(star => this.drawParticle(star, time, reveal))
    this.drawMoon(time)

    const particleAlpha = clamp(0.25 + reveal * 0.9, 0, 1)
    this.backgroundParticles.forEach(p => this.drawParticle(p, time, particleAlpha))
  }

  private drawRoomTransition(time: number) {
    // A stylized "camera leaving the room" layer. The actual room can remain
    // underneath this component; this canvas creates the visual receding/dimming
    // effect without requiring access to another scene's Three.js camera.
    const progress = this.roomRecede
    const ctx = this.ctx

    const roomGlow = ctx.createRadialGradient(
      this.width * 0.5,
      this.height * 0.72,
      0,
      this.width * 0.5,
      this.height * 0.72,
      Math.max(this.width, this.height) * 0.8,
    )
    roomGlow.addColorStop(0, `rgba(255, 190, 110, ${0.16 * (1 - progress)})`)
    roomGlow.addColorStop(0.45, `rgba(80, 45, 90, ${0.22 * (1 - progress)})`)
    roomGlow.addColorStop(1, 'rgba(0, 0, 0, 0)')

    ctx.fillStyle = roomGlow
    ctx.fillRect(0, 0, this.width, this.height)

    // Subtle upward-moving light streaks make the viewer feel as if the
    // camera is leaving the room rather than watching a static fade.
    ctx.save()
    ctx.globalAlpha = (1 - progress) * 0.12
    ctx.strokeStyle = COLORS.brightGold
    ctx.lineWidth = 1

    for (let i = 0; i < 8; i++) {
      const x = (i / 7) * this.width
      const sway = Math.sin(time * 0.0006 + i) * 20
      ctx.beginPath()
      ctx.moveTo(x + sway, this.height)
      ctx.lineTo(x + sway * 0.5, this.height * 0.45)
      ctx.stroke()
    }

    ctx.restore()
  }

  private drawFireworks() {
    const ctx = this.ctx

    ctx.save()
    ctx.globalCompositeOperation = 'lighter'

    for (const rocket of this.fireworkRockets) {
      for (let i = 1; i < rocket.trail.length; i++) {
        const a = i / rocket.trail.length
        const point = rocket.trail[i]
        const prev = rocket.trail[i - 1]

        ctx.globalAlpha = a * 0.45
        ctx.strokeStyle = rocket.color
        ctx.lineWidth = Math.max(0.5, 2 * a)
        ctx.beginPath()
        ctx.moveTo(prev.x, prev.y)
        ctx.lineTo(point.x, point.y)
        ctx.stroke()
      }

      ctx.globalAlpha = 0.9
      ctx.fillStyle = COLORS.brightGold
      ctx.beginPath()
      ctx.arc(rocket.x, rocket.y, 1.8, 0, TAU)
      ctx.fill()
    }

    for (const p of this.fireworkParticles) {
      const alpha = clamp(1 - p.life / p.maxLife, 0, 1)
      ctx.globalAlpha = alpha * 0.75
      ctx.strokeStyle = p.color
      ctx.lineWidth = Math.max(0.6, p.size * alpha)

      ctx.beginPath()
      ctx.moveTo(p.px, p.py)
      ctx.lineTo(p.x, p.y)
      ctx.stroke()

      ctx.globalAlpha = alpha
      ctx.fillStyle = p.color
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size * (0.75 + alpha * 0.45), 0, TAU)
      ctx.fill()
    }

    ctx.restore()
    ctx.globalAlpha = 1
  }

  private drawGoldenRain(time: number) {
    if (this.goldenRain.length === 0) return

    const ctx = this.ctx
    ctx.save()
    ctx.globalCompositeOperation = 'lighter'

    for (const p of this.goldenRain) {
      const lifeFade = Math.sin(clamp(p.life / p.maxLife, 0, 1) * Math.PI)
      const twinkle = 0.55 + Math.sin(time * 0.002 + p.phase) * 0.35
      ctx.globalAlpha = clamp(lifeFade * twinkle * 0.65, 0, 1)
      ctx.fillStyle = COLORS.warmGold
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size, 0, TAU)
      ctx.fill()
    }

    ctx.restore()
    ctx.globalAlpha = 1
  }

  private drawPetals(time: number) {
    const ctx = this.ctx

    for (const p of this.petals) {
      const scale = 0.65 + p.depth * 0.65
      ctx.save()
      ctx.translate(p.x, p.y)
      ctx.rotate(p.rotation)
      ctx.scale(scale, scale)

      const sway = Math.sin(time * 0.001 + p.swayPhase) * 0.18
      ctx.globalAlpha = p.opacity * (0.65 + p.depth * 0.35)
      ctx.fillStyle = p.color

      ctx.beginPath()
      ctx.moveTo(0, -p.size)
      ctx.bezierCurveTo(
        p.size * 0.85,
        -p.size * 0.55,
        p.size * 0.85,
        p.size * 0.55 + sway,
        0,
        p.size,
      )
      ctx.bezierCurveTo(
        -p.size * 0.85,
        p.size * 0.55 - sway,
        -p.size * 0.85,
        -p.size * 0.55,
        0,
        -p.size,
      )
      ctx.fill()

      ctx.restore()
    }

    ctx.globalAlpha = 1
  }

  private updateVisualState(time: number) {
    const elapsed = time - this.phaseStartTime

    switch (this.phase) {
      case 'roomTransition': {
        const progress = easeInOutCubic(elapsed / 2800)
        this.roomRecede = progress
        this.roomDarkness = progress
        this.skyReveal = easeOutCubic(Math.max(0, (progress - 0.15) / 0.85))

        if (elapsed >= 2800) {
          this.phase = 'fadeIn'
          this.phaseStartTime = time
          this.onPhaseChange?.('fadeIn')
        }
        break
      }

      case 'fadeIn': {
        this.skyReveal = easeOutCubic(elapsed / 1400)
        this.roomRecede = 1
        this.roomDarkness = 1

        if (elapsed >= 1400) {
          this.phase = 'riseParticles'
          this.phaseStartTime = time
          this.onPhaseChange?.('riseParticles')
        }
        break
      }

      case 'riseParticles':
        this.skyReveal = 1
        if (elapsed >= 1900) {
          this.phase = 'formHappyBirthday'
          this.phaseStartTime = time
          this.formText('HAPPY BIRTHDAY')
          this.onPhaseChange?.('formHappyBirthday')
        }
        break

      case 'formHappyBirthday':
        if (elapsed >= 1900) {
          this.phase = 'holdHappyBirthday'
          this.phaseStartTime = time
          this.onPhaseChange?.('holdHappyBirthday')
        }
        break

      case 'holdHappyBirthday':
        if (elapsed >= 2600) {
          this.phase = 'dissolve'
          this.phaseStartTime = time
          this.dissolveText()
          this.onPhaseChange?.('dissolve')
        }
        break

      case 'dissolve':
        if (elapsed >= 1250) {
          this.phase = 'formArfa'
          this.phaseStartTime = time
          this.formText('ARFA')
          this.onPhaseChange?.('formArfa')
        }
        break

      case 'formArfa':
        if (elapsed >= 1900) {
          this.phase = 'holdArfa'
          this.phaseStartTime = time
          this.onPhaseChange?.('holdArfa')
        }
        break

      case 'holdArfa': {
        const pulse = Math.sin((elapsed / 1200) * Math.PI) * 0.5 + 0.5
        this.arfaGlow = pulse

        if (elapsed >= 3200) {
          this.phase = 'burst'
          this.phaseStartTime = time
          this.dissolveText(true)
          this.onPhaseChange?.('burst')
        }
        break
      }

      case 'burst':
        this.arfaGlow = Math.max(0, 1 - elapsed / 900)
        if (elapsed >= 900) {
          this.phase = 'celebration'
          this.phaseStartTime = time
          this.createGoldenRain()
          this.triggerFireworks()
          this.onPhaseChange?.('celebration')
        }
        break

      case 'celebration':
        this.arfaGlow = 0
        break
    }
  }

  private render(time: number) {
    if (!this.running || this.destroyed) return

    const rawDt = this.lastTime ? time - this.lastTime : 16.6667
    const dt = clamp(rawDt, 8, 34)
    this.lastTime = time

    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0)
    this.ctx.globalAlpha = 1
    this.ctx.globalCompositeOperation = 'source-over'
    this.ctx.clearRect(0, 0, this.width, this.height)

    this.updateVisualState(time)
    this.updateParticles(time, dt)

    this.drawSky(time)

    // During the first transition, add a warm room-like atmosphere on top
    // while the sky gradually takes over.
    if (this.phase === 'roomTransition' || this.roomRecede < 1) {
      this.drawRoomTransition(time)
    }

    this.textParticles.forEach(p => {
      const isArfa = this.textTargetCount > 0 && this.phase !== 'formHappyBirthday' &&
        this.phase !== 'holdHappyBirthday' && this.phase !== 'dissolve'

      const alphaMultiplier = isArfa
        ? 0.9 + this.arfaGlow * 0.25
        : 0.82

      this.drawTextParticle(p, time, alphaMultiplier)
    })

    this.drawFireworks()
    this.drawGoldenRain(time)
    this.drawPetals(time)

    this.animationFrame = window.requestAnimationFrame(this.render.bind(this))
  }

  start() {
    if (this.running || this.destroyed) return
    this.running = true
    this.lastTime = performance.now()
    this.animationFrame = window.requestAnimationFrame(this.render.bind(this))
  }

  stop() {
    this.running = false

    if (this.animationFrame !== null) {
      window.cancelAnimationFrame(this.animationFrame)
      this.animationFrame = null
    }

    for (const timer of this.timers) {
      window.clearTimeout(timer)
    }
    this.timers.clear()
  }

  destroy() {
    if (this.destroyed) return
    this.destroyed = true
    this.stop()

    this.resizeObserver?.disconnect()
    this.resizeObserver = null

    this.backgroundParticles = []
    this.textParticles = []
    this.fireworkParticles = []
    this.fireworkRockets = []
    this.goldenRain = []
    this.petals = []
    this.stars = []
    this.onPhaseChange = undefined
  }

  resize() {
    if (this.destroyed) return

    const previousWidth = this.width
    const previousHeight = this.height

    this.detectPerformanceTier()
    this.setupCanvas()

    const scaleX = previousWidth > 0 ? this.width / previousWidth : 1
    const scaleY = previousHeight > 0 ? this.height / previousHeight : 1

    const resizeParticles = (particles: Array<{ x: number; y: number }>) => {
      for (const p of particles) {
        p.x *= scaleX
        p.y *= scaleY
      }
    }

    resizeParticles(this.stars)
    resizeParticles(this.backgroundParticles)
    resizeParticles(this.petals)
    resizeParticles(this.goldenRain)
    resizeParticles(this.textParticles)
    resizeParticles(this.fireworkParticles)
    resizeParticles(this.fireworkRockets)

    this.moonX = this.width * (this.isMobile ? 0.78 : 0.81)
    this.moonY = this.height * (this.isMobile ? 0.18 : 0.2)

    // Rebuild only fixed-count background layers if device tier changed.
    if (this.stars.length === 0) this.createStars()
    if (this.backgroundParticles.length === 0) this.createBackgroundParticles()
    if (this.petals.length === 0) this.createPetals()
  }
}

export function SkyOfWishes({ wishText, onComplete }: SkyOfWishesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const engineRef = useRef<SkyOfWishesEngine | null>(null)
  const audioTimersRef = useRef<number[]>([])
  const [showContinue, setShowContinue] = useState(false)
  const [finaleVisible, setFinaleVisible] = useState(false)
  const { beep } = useBeep()
  const prefersReducedMotion = useReducedMotion()

  const clearAudioTimers = useCallback(() => {
    audioTimersRef.current.forEach(timer => window.clearTimeout(timer))
    audioTimersRef.current = []
  }, [])

  useEffect(() => {
    if (!canvasRef.current) return

    if (prefersReducedMotion) {
      setShowContinue(true)
      setFinaleVisible(true)
      return
    }

    const engine = new SkyOfWishesEngine(canvasRef.current, phase => {
      if (phase === 'celebration') {
        setFinaleVisible(true)

        beep(880, 0.28, 'sine', 0.08)

        const t1 = window.setTimeout(() => beep(1100, 0.28, 'sine', 0.08), 220)
        const t2 = window.setTimeout(() => beep(1320, 0.5, 'sine', 0.08), 440)
        audioTimersRef.current.push(t1, t2)

        const continueTimer = window.setTimeout(() => setShowContinue(true), 4200)
        audioTimersRef.current.push(continueTimer)
      }
    })

    engineRef.current = engine
    engine.start()

    const handleResize = () => engine.resize()
    window.addEventListener('resize', handleResize, { passive: true })

    return () => {
      window.removeEventListener('resize', handleResize)
      clearAudioTimers()
      engine.destroy()
      if (engineRef.current === engine) {
        engineRef.current = null
      }
    }
  }, [beep, clearAudioTimers, prefersReducedMotion])

  const handleContinue = useCallback(() => {
    clearAudioTimers()
    engineRef.current?.destroy()
    engineRef.current = null
    onComplete()
  }, [clearAudioTimers, onComplete])

  return (
    <div className={styles.wrap}>
      <canvas
        ref={canvasRef}
        className={styles.canvas}
        aria-hidden="true"
      />

      <div
        className={styles.roomTransitionLayer}
        aria-hidden="true"
      />

      <motion.div
        className={styles.skyVignette}
        initial={{ opacity: 0.95 }}
        animate={{ opacity: 0.25 }}
        transition={{ duration: 3.4, ease: [0.22, 1, 0.36, 1] }}
        aria-hidden="true"
      />

      <AnimatePresence>
        {finaleVisible && (
          <motion.div
            className={styles.finaleLabel}
            initial={{ opacity: 0, y: 12, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 1.1, delay: 0.4 }}
          >
            <span>THE SKY OF WISHES</span>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showContinue && (
          <motion.button
            className={styles.continueBtn}
            onClick={handleContinue}
            initial={{ opacity: 0, y: 24, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.96 }}
            whileHover={{ scale: 1.045 }}
            whileTap={{ scale: 0.96 }}
          >
            Continue →
          </motion.button>
        )}
      </AnimatePresence>

      {prefersReducedMotion && (
        <div className={styles.reducedMotionFallback}>
          <div className={styles.staticMoon} aria-hidden="true" />
          <h1 className={styles.arfaText}>ARFA</h1>
          <p className={styles.wishText}>{wishText}</p>
          <button className={styles.continueBtn} onClick={onComplete}>
            Continue →
          </button>
        </div>
      )}
    </div>
  )
}
