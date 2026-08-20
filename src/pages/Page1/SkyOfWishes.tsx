import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useBeep } from '../../hooks/useBeep'
import styles from './SkyOfWishes.module.css'

export interface SkyOfWishesProps {
  wishText: string
  onComplete: () => void
}

type Phase =
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
}

interface TextParticle extends Particle {
  targetX: number
  targetY: number
  startX: number
  startY: number
  progress: number
  isActive: boolean
}

interface FireworkParticle {
  x: number
  y: number
  prevX: number
  prevY: number
  vx: number
  vy: number
  life: number
  maxLife: number
  color: string
  size: number
}

interface FireworkRocket {
  x: number
  y: number
  targetY: number
  vx: number
  vy: number
  color: string
  trail: Array<{ x: number; y: number; alpha: number }>
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
}

const TEXT_PARTICLES_DESKTOP = 9000
const TEXT_PARTICLES_MOBILE = 4000
const BG_PARTICLES_DESKTOP = 900
const BG_PARTICLES_MOBILE = 450

class SkyOfWishesEngine {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private backgroundParticles: Particle[] = []
  private textParticles: TextParticle[] = []
  private fireworkParticles: FireworkParticle[] = []
  private fireworkRockets: FireworkRocket[] = []
  private petals: Petal[] = []
  private stars: Particle[] = []
  private animationFrame: number | null = null
  private resizeObserver: ResizeObserver | null = null
  private fireworkTimers: number[] = []
  private phase: Phase = 'fadeIn'
  private phaseStartTime = 0
  private moonX = 0
  private moonY = 0
  private moonRadius = 40
  private isMobile = false
  private lastTime = 0
  private currentText = ''
  private destroyed = false
  private onPhaseChange?: (phase: Phase) => void

  constructor(canvas: HTMLCanvasElement, onPhaseChange?: (phase: Phase) => void) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d', { alpha: false })!
    this.onPhaseChange = onPhaseChange
    this.updateDeviceClass()
    this.setupCanvas()
    this.createStars()
    this.createPetals()
    this.createBackgroundParticles()
    this.phaseStartTime = performance.now()
  }

  private updateDeviceClass() {
    this.isMobile = window.innerWidth < 768
  }

  private setupCanvas() {
    const width = Math.max(1, window.innerWidth)
    const height = Math.max(1, window.innerHeight)
    const dpr = Math.min(window.devicePixelRatio || 1, this.isMobile ? 1.5 : 2)

    this.canvas.width = Math.round(width * dpr)
    this.canvas.height = Math.round(height * dpr)
    this.canvas.style.width = `${width}px`
    this.canvas.style.height = `${height}px`

    // Critical: reset the transform before applying the DPR scale.
    this.ctx.setTransform(1, 0, 0, 1, 0, 0)
    this.ctx.scale(dpr, dpr)

    this.moonX = width * (this.isMobile ? 0.82 : 0.8)
    this.moonY = height * (this.isMobile ? 0.16 : 0.2)
    this.moonRadius = this.isMobile ? 30 : 45
  }

  private createStars() {
    const count = this.isMobile ? 70 : 150
    this.stars = Array.from({ length: count }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight * 0.72,
      vx: 0,
      vy: 0,
      size: Math.random() * 1.4 + 0.4,
      opacity: Math.random() * 0.7 + 0.2,
      color: Math.random() > 0.85 ? COLORS.brightGold : COLORS.white,
      twinkleSpeed: Math.random() * 2 + 0.5,
      twinkleOffset: Math.random() * Math.PI * 2,
    }))
  }

  private createBackgroundParticles() {
    const count = this.isMobile ? BG_PARTICLES_MOBILE : BG_PARTICLES_DESKTOP
    this.backgroundParticles = Array.from({ length: count }, () => ({
      x: Math.random() * window.innerWidth,
      y: window.innerHeight + Math.random() * 140,
      vx: (Math.random() - 0.5) * 0.18,
      vy: -(Math.random() * 0.65 + 0.25),
      size: Math.random() * 1.6 + 0.45,
      opacity: Math.random() * 0.45 + 0.15,
      color: Math.random() > 0.25 ? COLORS.warmGold : COLORS.brightGold,
      twinkleSpeed: Math.random() * 2 + 0.5,
      twinkleOffset: Math.random() * Math.PI * 2,
    }))
  }

  private createPetals() {
    const count = this.isMobile ? 12 : 28
    const colors = [COLORS.softPink, '#FFB4D9', '#FFC8DD', COLORS.rose, COLORS.brightGold]

    this.petals = Array.from({ length: count }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.35,
      vy: Math.random() * 0.28 + 0.08,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.018,
      size: Math.random() * 5 + 3,
      color: colors[Math.floor(Math.random() * colors.length)],
      opacity: Math.random() * 0.28 + 0.16,
      swayPhase: Math.random() * Math.PI * 2,
      swaySpeed: Math.random() * 0.7 + 0.35,
    }))
  }

  private sampleText(text: string, fontSize: number) {
    // Sampling at a smaller resolution makes text formation dramatically cheaper.
    const scale = this.isMobile ? 0.5 : 0.55
    const width = Math.max(320, Math.floor(window.innerWidth * scale))
    const height = Math.max(240, Math.floor(window.innerHeight * scale))
    const offscreen = document.createElement('canvas')
    offscreen.width = width
    offscreen.height = height

    const offCtx = offscreen.getContext('2d', { willReadFrequently: true })
    if (!offCtx) return []

    const scaledFontSize = Math.max(20, fontSize * scale)
    offCtx.clearRect(0, 0, width, height)
    offCtx.fillStyle = '#fff'
    offCtx.font = `700 ${scaledFontSize}px Georgia, serif`
    offCtx.textAlign = 'center'
    offCtx.textBaseline = 'middle'

    const centerX = width / 2
    const centerY = height * 0.42

    // Keep the long phrase inside a predictable safe area.
    const maxTextWidth = width * (this.isMobile ? 0.9 : 0.78)
    let finalFontSize = scaledFontSize
    while (offCtx.measureText(text).width > maxTextWidth && finalFontSize > 18) {
      finalFontSize -= 2
      offCtx.font = `700 ${finalFontSize}px Georgia, serif`
    }

    offCtx.fillText(text, centerX, centerY)

    const data = offCtx.getImageData(0, 0, width, height).data
    const candidates: Array<{ x: number; y: number }> = []
    const gap = this.isMobile ? 3 : 3

    for (let y = 0; y < height; y += gap) {
      for (let x = 0; x < width; x += gap) {
        const alpha = data[(y * width + x) * 4 + 3]
        if (alpha > 150) {
          candidates.push({
            x: x / scale,
            y: y / scale,
          })
        }
      }
    }

    const maxParticles = this.isMobile
      ? TEXT_PARTICLES_MOBILE
      : TEXT_PARTICLES_DESKTOP

    if (candidates.length <= maxParticles) return candidates

    // Evenly downsample rather than randomly deleting pixels.
    const stride = candidates.length / maxParticles
    const result: Array<{ x: number; y: number }> = []
    for (let i = 0; i < maxParticles; i++) {
      result.push(candidates[Math.floor(i * stride)])
    }

    return result
  }

  private formText(text: string) {
    this.currentText = text

    const fontSize = text === 'ARFA'
      ? Math.min(window.innerWidth * (this.isMobile ? 0.24 : 0.15), this.isMobile ? 86 : 120)
      : Math.min(window.innerWidth * (this.isMobile ? 0.075 : 0.08), this.isMobile ? 36 : 60)

    const targets = this.sampleText(text, fontSize)

    const sourceParticles = [...this.backgroundParticles]
    const count = Math.min(targets.length, sourceParticles.length)

    this.textParticles = []

    for (let i = 0; i < count; i++) {
      const source = sourceParticles[i]
      const target = targets[i]

      this.textParticles.push({
        ...source,
        startX: source.x,
        startY: source.y,
        targetX: target.x,
        targetY: target.y,
        progress: 0,
        isActive: true,
        size: text === 'ARFA' ? Math.random() * 1.5 + 0.7 : Math.random() * 1.2 + 0.55,
        color: Math.random() > 0.12 ? COLORS.brightGold : COLORS.white,
      })
    }

    // Remove the selected particles from the background without O(n²) indexOf calls.
    this.backgroundParticles = sourceParticles.slice(count)

    // If there are more text targets than background particles, create only up to budget.
    for (let i = count; i < targets.length; i++) {
      const target = targets[i]
      const startX = Math.random() * window.innerWidth
      const startY = window.innerHeight + Math.random() * 120

      this.textParticles.push({
        x: startX,
        y: startY,
        vx: 0,
        vy: 0,
        startX,
        startY,
        targetX: target.x,
        targetY: target.y,
        progress: 0,
        isActive: true,
        size: Math.random() * 1.2 + 0.55,
        opacity: Math.random() * 0.45 + 0.55,
        color: Math.random() > 0.12 ? COLORS.brightGold : COLORS.white,
        twinkleSpeed: Math.random() * 2 + 0.5,
        twinkleOffset: Math.random() * Math.PI * 2,
      })
    }
  }

  private dissolveText() {
    for (const p of this.textParticles) {
      p.isActive = false
      p.progress = 0
      p.startX = p.x
      p.startY = p.y

      const angle = Math.random() * Math.PI * 2
      const speed = Math.random() * 2.5 + 1.5
      p.targetX = p.x + Math.cos(angle) * speed * 35
      p.targetY = p.y + Math.sin(angle) * speed * 35
    }
  }

  private createFirework(x: number, y: number, colorSet?: string[]) {
    const count = this.isMobile ? 42 : 78
    const colors = colorSet ?? [
      COLORS.warmGold,
      COLORS.brightGold,
      COLORS.softPink,
      COLORS.rose,
      COLORS.white,
    ]

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.12
      const speed = Math.random() * 3.6 + 2.1

      this.fireworkParticles.push({
        x,
        y,
        prevX: x,
        prevY: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0,
        maxLife: 55 + Math.random() * 45,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 1.6 + 0.7,
      })
    }
  }

  private createRocket(x: number, targetY: number) {
    this.fireworkRockets.push({
      x,
      y: window.innerHeight + 10,
      targetY,
      vx: (Math.random() - 0.5) * 0.7,
      vy: -(Math.random() * 3 + 7),
      color: Math.random() > 0.5 ? COLORS.brightGold : COLORS.softPink,
      trail: [],
    })
  }

  private triggerFireworks() {
    this.clearFireworkTimers()

    const w = window.innerWidth
    const h = window.innerHeight

    const schedule = [
      { delay: 0, x: w * 0.18, y: h * 0.30 },
      { delay: 350, x: w * 0.82, y: h * 0.25 },
      { delay: 700, x: w * 0.50, y: h * 0.20 },
      { delay: 1050, x: w * 0.34, y: h * 0.34 },
      { delay: 1350, x: w * 0.66, y: h * 0.29 },
      { delay: 1800, x: w * 0.50, y: h * 0.16 },
    ]

    for (const item of schedule) {
      const timer = window.setTimeout(() => {
        this.createRocket(item.x, item.y)
      }, item.delay)
      this.fireworkTimers.push(timer)
    }
  }

  private clearFireworkTimers() {
    for (const timer of this.fireworkTimers) {
      window.clearTimeout(timer)
    }
    this.fireworkTimers = []
  }

  private drawMoon() {
    const ctx = this.ctx

    const glow = ctx.createRadialGradient(
      this.moonX,
      this.moonY,
      this.moonRadius * 0.3,
      this.moonX,
      this.moonY,
      this.moonRadius * 3.2,
    )
    glow.addColorStop(0, 'rgba(255,248,240,0.22)')
    glow.addColorStop(0.45, 'rgba(255,248,240,0.08)')
    glow.addColorStop(1, 'rgba(255,248,240,0)')

    ctx.fillStyle = glow
    ctx.beginPath()
    ctx.arc(this.moonX, this.moonY, this.moonRadius * 3.2, 0, Math.PI * 2)
    ctx.fill()

    const body = ctx.createRadialGradient(
      this.moonX - this.moonRadius * 0.25,
      this.moonY - this.moonRadius * 0.25,
      this.moonRadius * 0.1,
      this.moonX,
      this.moonY,
      this.moonRadius,
    )
    body.addColorStop(0, '#FFFEF5')
    body.addColorStop(0.75, '#F5E6D3')
    body.addColorStop(1, '#DCC8B5')

    ctx.fillStyle = body
    ctx.beginPath()
    ctx.arc(this.moonX, this.moonY, this.moonRadius, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = 'rgba(190,170,150,0.16)'
    const craters = [
      [-0.3, -0.2, 0.2],
      [0.2, 0.3, 0.15],
      [-0.1, 0.4, 0.1],
    ]

    for (const [x, y, r] of craters) {
      ctx.beginPath()
      ctx.arc(
        this.moonX + this.moonRadius * x,
        this.moonY + this.moonRadius * y,
        this.moonRadius * r,
        0,
        Math.PI * 2,
      )
      ctx.fill()
    }
  }

  private drawParticle(particle: Particle | TextParticle, time: number) {
    const twinkle =
      Math.sin(time * 0.001 * particle.twinkleSpeed + particle.twinkleOffset) * 0.25 + 0.75

    this.ctx.globalAlpha = Math.max(0, Math.min(1, particle.opacity * twinkle))
    this.ctx.fillStyle = particle.color
    this.ctx.beginPath()
    this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
    this.ctx.fill()
    this.ctx.globalAlpha = 1
  }

  private updateParticles(dt: number, time: number) {
    const speed = dt / 16.6667

    for (const p of this.backgroundParticles) {
      p.x += p.vx * speed
      p.y += p.vy * speed

      if (p.y < -20) {
        p.y = window.innerHeight + 20
        p.x = Math.random() * window.innerWidth
      }
    }

    for (const p of this.textParticles) {
      if (p.isActive) {
        if (p.progress < 1) {
          p.progress = Math.min(1, p.progress + 0.018 * speed)
          const eased = 1 - Math.pow(1 - p.progress, 3)
          p.x = p.startX + (p.targetX - p.startX) * eased
          p.y = p.startY + (p.targetY - p.startY) * eased
        } else {
          const drift = this.phase === 'holdArfa' ? 1.6 : 0.8
          p.x = p.targetX + Math.sin(time * 0.001 + p.twinkleOffset) * drift
          p.y = p.targetY + Math.cos(time * 0.0012 + p.twinkleOffset) * drift
        }
      } else if (p.progress < 1) {
        p.progress = Math.min(1, p.progress + 0.032 * speed)
        const eased = 1 - Math.pow(1 - p.progress, 2)
        p.x = p.startX + (p.targetX - p.startX) * eased
        p.y = p.startY + (p.targetY - p.startY) * eased
        p.opacity = Math.max(0, p.opacity * Math.pow(0.97, speed))
      }
    }

    this.textParticles = this.textParticles.filter(p => p.isActive || p.progress < 1)

    for (const p of this.fireworkRockets) {
      p.x += p.vx * speed
      p.y += p.vy * speed
      p.vy += 0.055 * speed

      p.trail.push({ x: p.x, y: p.y, alpha: 1 })
      if (p.trail.length > 8) p.trail.shift()

      if (p.y <= p.targetY || p.vy >= -1) {
        this.createFirework(p.x, p.y, [p.color, COLORS.brightGold, COLORS.white])
        p.y = -1000
      }
    }

    this.fireworkRockets = this.fireworkRockets.filter(p => p.y > -500)

    for (const p of this.fireworkParticles) {
      p.prevX = p.x
      p.prevY = p.y
      p.x += p.vx * speed
      p.y += p.vy * speed
      p.vy += 0.045 * speed
      p.vx *= Math.pow(0.985, speed)
      p.vy *= Math.pow(0.992, speed)
      p.life += speed
    }

    this.fireworkParticles = this.fireworkParticles.filter(p => p.life < p.maxLife)

    for (const p of this.petals) {
      p.x += (p.vx + Math.sin(time * 0.001 * p.swaySpeed + p.swayPhase) * 0.28) * speed
      p.y += p.vy * speed
      p.rotation += p.rotationSpeed * speed

      if (p.y > window.innerHeight + 20) {
        p.y = -20
        p.x = Math.random() * window.innerWidth
      }
      if (p.x > window.innerWidth + 20) p.x = -20
      if (p.x < -20) p.x = window.innerWidth + 20
    }
  }

  private drawFireworks() {
    const ctx = this.ctx

    // Rocket trails.
    for (const rocket of this.fireworkRockets) {
      for (let i = 0; i < rocket.trail.length; i++) {
        const point = rocket.trail[i]
        const alpha = (i + 1) / rocket.trail.length
        ctx.globalAlpha = alpha * 0.6
        ctx.fillStyle = rocket.color
        ctx.beginPath()
        ctx.arc(point.x, point.y, 1.2 + alpha * 0.9, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    // Explosion trails.
    for (const p of this.fireworkParticles) {
      const alpha = Math.max(0, 1 - p.life / p.maxLife)
      ctx.globalAlpha = alpha * 0.85
      ctx.strokeStyle = p.color
      ctx.lineWidth = Math.max(0.5, p.size * 0.7)
      ctx.beginPath()
      ctx.moveTo(p.prevX, p.prevY)
      ctx.lineTo(p.x, p.y)
      ctx.stroke()

      ctx.globalAlpha = alpha
      ctx.fillStyle = p.color
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
      ctx.fill()
    }

    ctx.globalAlpha = 1
  }

  private drawPetal(p: Petal) {
    const ctx = this.ctx
    ctx.save()
    ctx.translate(p.x, p.y)
    ctx.rotate(p.rotation)
    ctx.globalAlpha = p.opacity
    ctx.fillStyle = p.color

    // Slightly more petal-like than a plain ellipse.
    ctx.beginPath()
    ctx.moveTo(0, -p.size)
    ctx.bezierCurveTo(p.size * 0.9, -p.size * 0.65, p.size, p.size * 0.45, 0, p.size)
    ctx.bezierCurveTo(-p.size, p.size * 0.45, -p.size * 0.9, -p.size * 0.65, 0, -p.size)
    ctx.fill()

    ctx.restore()
  }

  private render(time: number) {
    if (this.destroyed) return

    const dt = this.lastTime
      ? Math.min(50, Math.max(0.1, time - this.lastTime))
      : 16.6667

    this.lastTime = time

    const width = window.innerWidth
    const height = window.innerHeight
    const ctx = this.ctx

    // Background.
    const gradient = ctx.createLinearGradient(0, 0, 0, height)
    gradient.addColorStop(0, COLORS.deepNight)
    gradient.addColorStop(0.5, COLORS.midnightBlue)
    gradient.addColorStop(1, '#17162F')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, width, height)

    // Atmospheric center glow.
    const haze = ctx.createRadialGradient(
      width / 2,
      height * 0.42,
      0,
      width / 2,
      height * 0.42,
      width * 0.72,
    )
    haze.addColorStop(0, 'rgba(56,36,92,0.22)')
    haze.addColorStop(0.55, 'rgba(80,45,105,0.07)')
    haze.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = haze
    ctx.fillRect(0, 0, width, height)

    this.drawMoon()

    for (const star of this.stars) this.drawParticle(star, time)
    for (const p of this.backgroundParticles) this.drawParticle(p, time)
    for (const p of this.textParticles) this.drawParticle(p, time)

    this.drawFireworks()

    for (const petal of this.petals) this.drawPetal(petal)

    this.updateParticles(dt, time)
    this.updatePhase(time)

    this.animationFrame = requestAnimationFrame(this.renderFrame)
  }

  private renderFrame = (time: number) => {
    this.render(time)
  }

  private updatePhase(time: number) {
    const elapsed = time - this.phaseStartTime

    const change = (next: Phase) => {
      this.phase = next
      this.phaseStartTime = time
      this.onPhaseChange?.(next)
    }

    switch (this.phase) {
      case 'fadeIn':
        if (elapsed >= 1800) change('riseParticles')
        break

      case 'riseParticles':
        if (elapsed >= 2200) {
          this.formText('HAPPY BIRTHDAY')
          change('formHappyBirthday')
        }
        break

      case 'formHappyBirthday':
        if (elapsed >= 1900) change('holdHappyBirthday')
        break

      case 'holdHappyBirthday':
        if (elapsed >= 2300) {
          this.dissolveText()
          change('dissolve')
        }
        break

      case 'dissolve':
        if (elapsed >= 1400) {
          this.formText('ARFA')
          change('formArfa')
        }
        break

      case 'formArfa':
        if (elapsed >= 2100) change('holdArfa')
        break

      case 'holdArfa':
        if (elapsed >= 3000) {
          this.dissolveText()
          change('burst')
        }
        break

      case 'burst':
        if (elapsed >= 850) {
          this.triggerFireworks()
          change('celebration')
        }
        break

      case 'celebration':
        break
    }
  }

  start() {
    if (this.destroyed || this.animationFrame !== null) return
    this.lastTime = performance.now()
    this.animationFrame = requestAnimationFrame(this.renderFrame)
  }

  stop() {
    if (this.animationFrame !== null) {
      cancelAnimationFrame(this.animationFrame)
      this.animationFrame = null
    }

    this.clearFireworkTimers()
  }

  resize() {
    if (this.destroyed) return

    const previousMobile = this.isMobile
    this.updateDeviceClass()
    this.setupCanvas()

    if (previousMobile !== this.isMobile) {
      this.createStars()
      this.createPetals()
      this.createBackgroundParticles()
    }

    // Keep active text aligned after resize.
    if (
      this.currentText &&
      (this.phase === 'formHappyBirthday' ||
        this.phase === 'holdHappyBirthday' ||
        this.phase === 'formArfa' ||
        this.phase === 'holdArfa')
    ) {
      this.formText(this.currentText)
    }
  }

  destroy() {
    this.destroyed = true
    this.stop()

    if (this.resizeObserver) {
      this.resizeObserver.disconnect()
      this.resizeObserver = null
    }

    this.textParticles = []
    this.backgroundParticles = []
    this.fireworkParticles = []
    this.fireworkRockets = []
    this.petals = []
    this.stars = []
  }
}

export function SkyOfWishes({ wishText, onComplete }: SkyOfWishesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const engineRef = useRef<SkyOfWishesEngine | null>(null)
  const soundTimersRef = useRef<number[]>([])
  const [showContinue, setShowContinue] = useState(false)
  const [showWish, setShowWish] = useState(false)

  const { beep } = useBeep()
  const prefersReducedMotion = useReducedMotion()

  useEffect(() => {
    if (!canvasRef.current) return

    // Avoid creating the expensive engine when reduced motion is requested.
    if (prefersReducedMotion) {
      setShowContinue(true)
      setShowWish(true)
      return
    }

    const engine = new SkyOfWishesEngine(canvasRef.current, (phase) => {
      if (phase !== 'celebration') return

      beep(880, 0.25, 'sine', 0.08)

      const t1 = window.setTimeout(() => beep(1100, 0.25, 'sine', 0.08), 180)
      const t2 = window.setTimeout(() => beep(1320, 0.4, 'sine', 0.08), 360)
      const t3 = window.setTimeout(() => setShowWish(true), 2200)
      const t4 = window.setTimeout(() => setShowContinue(true), 3600)

      soundTimersRef.current.push(t1, t2, t3, t4)
    })

    engineRef.current = engine
    engine.start()

    const handleResize = () => engine.resize()
    window.addEventListener('resize', handleResize, { passive: true })

    return () => {
      window.removeEventListener('resize', handleResize)

      for (const timer of soundTimersRef.current) {
        window.clearTimeout(timer)
      }
      soundTimersRef.current = []

      engine.destroy()

      if (engineRef.current === engine) {
        engineRef.current = null
      }
    }
  }, [beep, prefersReducedMotion])

  const handleContinue = useCallback(() => {
    engineRef.current?.stop()
    onComplete()
  }, [onComplete])

  return (
    <div className={styles.wrap}>
      {!prefersReducedMotion && (
        <canvas
          ref={canvasRef}
          className={styles.canvas}
          aria-hidden="true"
        />
      )}

      <motion.div
        className={styles.roomOverlay}
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 2.2, ease: [0.22, 1, 0.36, 1] }}
        aria-hidden="true"
      />

      <AnimatePresence>
        {showWish && (
          <motion.div
            className={styles.wishText}
            initial={{ opacity: 0, y: 16, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.1, ease: 'easeOut' }}
          >
            <p className={styles.wishText}>{wishText}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showContinue && (
          <motion.button
            className={styles.continueBtn}
            onClick={handleContinue}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Continue →
          </motion.button>
        )}
      </AnimatePresence>

      {prefersReducedMotion && (
        <div className={styles.reducedMotionFallback}>
          <h1 className={styles.arfaText}>Arfa</h1>
          <p className={styles.wishText}>{wishText}</p>
          <button className={styles.continueBtn} onClick={onComplete}>
            Continue →
          </button>
        </div>
      )}
    </div>
  )
}
