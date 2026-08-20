import { useEffect, useRef, useState, useCallback } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useBeep } from '../../hooks/useBeep'
import styles from './SkyOfWishes.module.css'

export interface SkyOfWishesProps {
  wishText: string
  onComplete: () => void
}

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
  vx: number
  vy: number
  life: number
  maxLife: number
  color: string
  size: number
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

class SkyOfWishesEngine {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private backgroundParticles: Particle[] = []
  private textParticles: TextParticle[] = []
  private fireworkParticles: FireworkParticle[] = []
  private petals: Petal[] = []
  private stars: Particle[] = []
  private animationFrame: number | null = null
  private phase: 'fadeIn' | 'riseParticles' | 'formHappyBirthday' | 'holdHappyBirthday' | 'dissolve' | 'formArfa' | 'holdArfa' | 'burst' | 'celebration' = 'fadeIn'
  private phaseStartTime = 0
  private moonX = 0
  private moonY = 0
  private moonRadius = 40
  private onPhaseChange?: (phase: string) => void
  private isMobile = false
  private lastTime = 0

  constructor(canvas: HTMLCanvasElement, onPhaseChange?: (phase: string) => void) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')!
    this.onPhaseChange = onPhaseChange
    this.isMobile = window.innerWidth < 768
    this.setupCanvas()
    this.createStars()
    this.createPetals()
    this.createBackgroundParticles()
    this.phaseStartTime = performance.now()
  }

  private setupCanvas() {
    const dpr = Math.min(window.devicePixelRatio, 2)
    this.canvas.width = window.innerWidth * dpr
    this.canvas.height = window.innerHeight * dpr
    this.canvas.style.width = `${window.innerWidth}px`
    this.canvas.style.height = `${window.innerHeight}px`
    this.ctx.scale(dpr, dpr)
    
    // Position moon in upper right, away from center
    this.moonX = window.innerWidth * 0.8
    this.moonY = window.innerHeight * 0.2
    this.moonRadius = this.isMobile ? 30 : 45
  }

  private createStars() {
    const starCount = this.isMobile ? 80 : 150
    this.stars = []
    for (let i = 0; i < starCount; i++) {
      this.stars.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight * 0.7,
        vx: 0,
        vy: 0,
        size: Math.random() * 1.5 + 0.5,
        opacity: Math.random() * 0.7 + 0.3,
        color: '#FFFFFF',
        twinkleSpeed: Math.random() * 2 + 1,
        twinkleOffset: Math.random() * Math.PI * 2,
      })
    }
  }

  private createBackgroundParticles() {
    const particleCount = this.isMobile ? 100 : 200
    this.backgroundParticles = []
    for (let i = 0; i < particleCount; i++) {
      this.backgroundParticles.push({
        x: Math.random() * window.innerWidth,
        y: window.innerHeight + Math.random() * 100,
        vx: (Math.random() - 0.5) * 0.2,
        vy: -(Math.random() * 0.5 + 0.3),
        size: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.4 + 0.2,
        color: Math.random() > 0.7 ? COLORS.brightGold : COLORS.warmGold,
        twinkleSpeed: Math.random() * 2 + 1,
        twinkleOffset: Math.random() * Math.PI * 2,
      })
    }
  }

  private createPetals() {
    const petalCount = this.isMobile ? 15 : 30
    const colors = ['#F5A6C8', '#FFB4D9', '#FFC8DD', '#E878A5', '#FFE8A3']
    this.petals = []
    for (let i = 0; i < petalCount; i++) {
      this.petals.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * 0.5,
        vy: Math.random() * 0.3 + 0.1,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.02,
        size: Math.random() * 6 + 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        opacity: Math.random() * 0.3 + 0.2,
        swayPhase: Math.random() * Math.PI * 2,
        swaySpeed: Math.random() * 0.5 + 0.5,
      })
    }
  }

  private sampleText(text: string, fontSize: number): { x: number; y: number }[] {
    const offscreen = document.createElement('canvas')
    const offCtx = offscreen.getContext('2d', { willReadFrequently: true })!
    offscreen.width = window.innerWidth
    offscreen.height = window.innerHeight
    
    offCtx.fillStyle = 'black'
    offCtx.fillRect(0, 0, offscreen.width, offscreen.height)
    
    offCtx.fillStyle = 'white'
    offCtx.font = `bold ${fontSize}px 'Georgia', serif`
    offCtx.textAlign = 'center'
    offCtx.textBaseline = 'middle'
    
    const centerX = offscreen.width / 2
    const centerY = offscreen.height * 0.4
    offCtx.fillText(text, centerX, centerY)
    
    const imageData = offCtx.getImageData(0, 0, offscreen.width, offscreen.height)
    const positions: { x: number; y: number }[] = []
    
    const gap = this.isMobile ? 4 : 3
    
    for (let y = 0; y < offscreen.height; y += gap) {
      for (let x = 0; x < offscreen.width; x += gap) {
        const index = (y * offscreen.width + x) * 4
        if (imageData.data[index + 3] > 128) {
          positions.push({ x, y })
        }
      }
    }
    
    offscreen.width = 0
    offscreen.height = 0
    
    return positions
  }

  private formText(text: string) {
    const fontSize = text === 'ARFA' ? 
      Math.min(window.innerWidth * 0.15, 120) : 
      Math.min(window.innerWidth * 0.08, 60)
    
    const targets = this.sampleText(text, fontSize)
    
    // Reset old text particles to background
    this.textParticles.forEach(p => {
      this.backgroundParticles.push({
        x: p.x,
        y: p.y,
        vx: (Math.random() - 0.5) * 0.5,
        vy: -(Math.random() * 0.3 + 0.1),
        size: p.size,
        opacity: p.opacity * 0.5,
        color: p.color,
        twinkleSpeed: p.twinkleSpeed,
        twinkleOffset: p.twinkleOffset,
      })
    })
    this.textParticles = []
    
    // Select particles for text formation
    const shuffledParticles = [...this.backgroundParticles].sort(() => Math.random() - 0.5)
    const neededParticles = Math.min(targets.length, shuffledParticles.length)
    
    for (let i = 0; i < neededParticles; i++) {
      const particle = shuffledParticles[i]
      const target = targets[i]
      
      this.textParticles.push({
        ...particle,
        startX: particle.x,
        startY: particle.y,
        targetX: target.x,
        targetY: target.y,
        progress: 0,
        isActive: true,
      })
      
      // Remove from background
      const index = this.backgroundParticles.indexOf(particle)
      if (index > -1) {
        this.backgroundParticles.splice(index, 1)
      }
    }
    
    // If not enough particles, create more
    if (neededParticles < targets.length) {
      for (let i = neededParticles; i < targets.length; i++) {
        const target = targets[i]
        this.textParticles.push({
          x: Math.random() * window.innerWidth,
          y: window.innerHeight + Math.random() * 100,
          vx: 0,
          vy: 0,
          startX: Math.random() * window.innerWidth,
          startY: window.innerHeight + Math.random() * 100,
          targetX: target.x,
          targetY: target.y,
          size: Math.random() * 1.5 + 0.5,
          opacity: Math.random() * 0.5 + 0.5,
          color: COLORS.brightGold,
          twinkleSpeed: Math.random() * 2 + 1,
          twinkleOffset: Math.random() * Math.PI * 2,
          progress: 0,
          isActive: true,
        })
      }
    }
  }

  private dissolveText() {
    this.textParticles.forEach(p => {
      p.isActive = false
      p.progress = 0
      p.startX = p.x
      p.startY = p.y
      const angle = Math.random() * Math.PI * 2
      const speed = Math.random() * 3 + 1
      p.targetX = p.x + Math.cos(angle) * speed * 20
      p.targetY = p.y + Math.sin(angle) * speed * 20
    })
  }

  private createFirework(x: number, y: number) {
    const particleCount = this.isMobile ? 30 : 60
    const colors = [COLORS.warmGold, COLORS.brightGold, COLORS.softPink, COLORS.rose, '#FFFFFF']
    
    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount + Math.random() * 0.5
      const speed = Math.random() * 3 + 2
      this.fireworkParticles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0,
        maxLife: 60 + Math.random() * 40,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 2 + 0.5,
      })
    }
  }

  private triggerFireworks() {
    const positions = [
      { x: window.innerWidth * 0.2, y: window.innerHeight * 0.3 },
      { x: window.innerWidth * 0.8, y: window.innerHeight * 0.25 },
      { x: window.innerWidth * 0.5, y: window.innerHeight * 0.2 },
      { x: window.innerWidth * 0.35, y: window.innerHeight * 0.35 },
      { x: window.innerWidth * 0.65, y: window.innerHeight * 0.3 },
    ]
    
    positions.forEach((pos, i) => {
      setTimeout(() => {
        this.createFirework(pos.x, pos.y)
      }, i * 500)
    })
  }

  private drawMoon(time: number) {
    const ctx = this.ctx
    
    // Soft glow
    const glowGradient = ctx.createRadialGradient(
      this.moonX, this.moonY, this.moonRadius * 0.5,
      this.moonX, this.moonY, this.moonRadius * 3
    )
    glowGradient.addColorStop(0, 'rgba(255, 248, 240, 0.3)')
    glowGradient.addColorStop(0.5, 'rgba(255, 248, 240, 0.1)')
    glowGradient.addColorStop(1, 'rgba(255, 248, 240, 0)')
    
    ctx.fillStyle = glowGradient
    ctx.beginPath()
    ctx.arc(this.moonX, this.moonY, this.moonRadius * 3, 0, Math.PI * 2)
    ctx.fill()
    
    // Moon body
    const moonGradient = ctx.createRadialGradient(
      this.moonX - this.moonRadius * 0.2, this.moonY - this.moonRadius * 0.2, this.moonRadius * 0.1,
      this.moonX, this.moonY, this.moonRadius
    )
    moonGradient.addColorStop(0, '#FFFEF5')
    moonGradient.addColorStop(0.8, '#F5E6D3')
    moonGradient.addColorStop(1, '#E8D5C0')
    
    ctx.fillStyle = moonGradient
    ctx.beginPath()
    ctx.arc(this.moonX, this.moonY, this.moonRadius, 0, Math.PI * 2)
    ctx.fill()
    
    // Subtle craters
    ctx.fillStyle = 'rgba(200, 180, 160, 0.2)'
    const craters = [
      { x: -this.moonRadius * 0.3, y: -this.moonRadius * 0.2, r: this.moonRadius * 0.2 },
      { x: this.moonRadius * 0.2, y: this.moonRadius * 0.3, r: this.moonRadius * 0.15 },
      { x: -this.moonRadius * 0.1, y: this.moonRadius * 0.4, r: this.moonRadius * 0.1 },
    ]
    
    craters.forEach(crater => {
      ctx.beginPath()
      ctx.arc(this.moonX + crater.x, this.moonY + crater.y, crater.r, 0, Math.PI * 2)
      ctx.fill()
    })
  }

  private drawParticle(particle: Particle | TextParticle, time: number) {
    const twinkle = Math.sin(time * 0.001 * particle.twinkleSpeed + particle.twinkleOffset) * 0.3 + 0.7
    const alpha = particle.opacity * twinkle
    const size = particle.size
    
    // Glow
    const glowGradient = this.ctx.createRadialGradient(particle.x, particle.y, 0, particle.x, particle.y, size * 3)
    glowGradient.addColorStop(0, particle.color)
    glowGradient.addColorStop(1, 'transparent')
    
    this.ctx.fillStyle = glowGradient
    this.ctx.globalAlpha = alpha * 0.3
    this.ctx.beginPath()
    this.ctx.arc(particle.x, particle.y, size * 3, 0, Math.PI * 2)
    this.ctx.fill()
    
    // Core
    this.ctx.fillStyle = particle.color
    this.ctx.globalAlpha = alpha
    this.ctx.beginPath()
    this.ctx.arc(particle.x, particle.y, size, 0, Math.PI * 2)
    this.ctx.fill()
    
    this.ctx.globalAlpha = 1
  }

  private updateParticles(time: number) {
    // Update background particles
    this.backgroundParticles.forEach(p => {
      p.x += p.vx
      p.y += p.vy
      
      if (p.y < -20) {
        p.y = window.innerHeight + 20
        p.x = Math.random() * window.innerWidth
      }
    })
    
    // Update text particles
    this.textParticles.forEach(p => {
      if (p.isActive) {
        // Moving to target
        if (p.progress < 1) {
          p.progress += 0.02
          const eased = 1 - Math.pow(1 - p.progress, 3)
          p.x = p.startX + (p.targetX - p.startX) * eased
          p.y = p.startY + (p.targetY - p.startY) * eased
        } else {
          // Gentle floating at target
          p.x = p.targetX + Math.sin(time * 0.001 + p.twinkleOffset) * 1
          p.y = p.targetY + Math.cos(time * 0.0012 + p.twinkleOffset) * 1
        }
      } else {
        // Dissolving
        if (p.progress < 1) {
          p.progress += 0.03
          const eased = 1 - Math.pow(1 - p.progress, 2)
          p.x = p.startX + (p.targetX - p.startX) * eased
          p.y = p.startY + (p.targetY - p.startY) * eased
          p.opacity *= 0.98
        }
      }
    })
    
    // Remove dissolved particles
    this.textParticles = this.textParticles.filter(p => p.isActive || p.progress < 1)
    
    // Update firework particles
    this.fireworkParticles.forEach(p => {
      p.x += p.vx
      p.y += p.vy
      p.vy += 0.05 // gravity
      p.vx *= 0.99
      p.vy *= 0.99
      p.life++
    })
    
    // Remove dead fireworks
    this.fireworkParticles = this.fireworkParticles.filter(p => p.life < p.maxLife)
    
    // Update petals
    this.petals.forEach(p => {
      p.x += p.vx + Math.sin(time * 0.001 * p.swaySpeed + p.swayPhase) * 0.3
      p.y += p.vy
      p.rotation += p.rotationSpeed
      
      if (p.y > window.innerHeight + 20) {
        p.y = -20
        p.x = Math.random() * window.innerWidth
      }
      if (p.x > window.innerWidth + 20) p.x = -20
      if (p.x < -20) p.x = window.innerWidth + 20
    })
  }

  private updatePhase(time: number) {
    const elapsed = time - this.phaseStartTime
    
    switch (this.phase) {
      case 'fadeIn':
        if (elapsed > 2000) {
          this.phase = 'riseParticles'
          this.phaseStartTime = time
          this.onPhaseChange?.('riseParticles')
        }
        break
        
      case 'riseParticles':
        if (elapsed > 2000) {
          this.phase = 'formHappyBirthday'
          this.phaseStartTime = time
          this.formText('HAPPY BIRTHDAY')
          this.onPhaseChange?.('formHappyBirthday')
        }
        break
        
      case 'formHappyBirthday':
        if (elapsed > 2000) {
          this.phase = 'holdHappyBirthday'
          this.phaseStartTime = time
          this.onPhaseChange?.('holdHappyBirthday')
        }
        break
        
      case 'holdHappyBirthday':
        if (elapsed > 2500) {
          this.phase = 'dissolve'
          this.phaseStartTime = time
          this.dissolveText()
          this.onPhaseChange?.('dissolve')
        }
        break
        
      case 'dissolve':
        if (elapsed > 1500) {
          this.phase = 'formArfa'
          this.phaseStartTime = time
          this.formText('ARFA')
          this.onPhaseChange?.('formArfa')
        }
        break
        
      case 'formArfa':
        if (elapsed > 2000) {
          this.phase = 'holdArfa'
          this.phaseStartTime = time
          this.onPhaseChange?.('holdArfa')
        }
        break
        
      case 'holdArfa':
        if (elapsed > 3000) {
          this.phase = 'burst'
          this.phaseStartTime = time
          this.dissolveText()
          this.onPhaseChange?.('burst')
        }
        break
        
      case 'burst':
        if (elapsed > 1000) {
          this.phase = 'celebration'
          this.phaseStartTime = time
          this.triggerFireworks()
          this.onPhaseChange?.('celebration')
        }
        break
    }
  }

  private render(time: number) {
    // Background gradient
    const gradient = this.ctx.createLinearGradient(0, 0, 0, window.innerHeight)
    gradient.addColorStop(0, '#050817')
    gradient.addColorStop(0.5, '#0B1230')
    gradient.addColorStop(1, '#1a1a3a')
    
    this.ctx.fillStyle = gradient
    this.ctx.fillRect(0, 0, window.innerWidth, window.innerHeight)
    
    // Atmospheric haze
    const hazeGradient = this.ctx.createRadialGradient(
      window.innerWidth / 2, window.innerHeight * 0.4, 0,
      window.innerWidth / 2, window.innerHeight * 0.4, window.innerWidth * 0.7
    )
    hazeGradient.addColorStop(0, 'rgba(56, 36, 92, 0.2)')
    hazeGradient.addColorStop(1, 'transparent')
    
    this.ctx.fillStyle = hazeGradient
    this.ctx.fillRect(0, 0, window.innerWidth, window.innerHeight)
    
    // Draw stars
    this.stars.forEach(star => this.drawParticle(star, time))
    
    // Draw moon
    this.drawMoon(time)
    
    // Draw background particles
    this.backgroundParticles.forEach(p => this.drawParticle(p, time))
    
    // Draw text particles
    this.textParticles.forEach(p => this.drawParticle(p, time))
    
    // Draw firework particles
    this.fireworkParticles.forEach(p => {
      const alpha = 1 - (p.life / p.maxLife)
      this.ctx.fillStyle = p.color
      this.ctx.globalAlpha = alpha
      this.ctx.beginPath()
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
      this.ctx.fill()
      this.ctx.globalAlpha = 1
    })
    
    // Draw petals
    this.petals.forEach(p => {
      this.ctx.save()
      this.ctx.translate(p.x, p.y)
      this.ctx.rotate(p.rotation)
      this.ctx.globalAlpha = p.opacity
      this.ctx.fillStyle = p.color
      this.ctx.beginPath()
      this.ctx.ellipse(0, 0, p.size, p.size * 0.6, 0, 0, Math.PI * 2)
      this.ctx.fill()
      this.ctx.globalAlpha = 1
      this.ctx.restore()
    })
    
    this.updateParticles(time)
    this.updatePhase(time)
    
    this.animationFrame = requestAnimationFrame(this.render.bind(this))
  }

  start() {
    this.lastTime = performance.now()
    this.animationFrame = requestAnimationFrame(this.render.bind(this))
  }

  stop() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame)
      this.animationFrame = null
    }
  }

  resize() {
    this.setupCanvas()
    this.createStars()
  }
}

export function SkyOfWishes({ wishText, onComplete }: SkyOfWishesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const engineRef = useRef<SkyOfWishesEngine | null>(null)
  const [currentPhase, setCurrentPhase] = useState('fadeIn')
  const [showContinue, setShowContinue] = useState(false)
  const { beep } = useBeep()
  const prefersReducedMotion = useReducedMotion()

  useEffect(() => {
    if (!canvasRef.current) return
    
    const engine = new SkyOfWishesEngine(canvasRef.current, (phase) => {
      setCurrentPhase(phase)
      
      if (phase === 'celebration') {
        beep(880, 0.3, 'sine', 0.1)
        setTimeout(() => beep(1100, 0.3, 'sine', 0.1), 200)
        setTimeout(() => beep(1320, 0.5, 'sine', 0.1), 400)
        setTimeout(() => setShowContinue(true), 4000)
      }
    })
    
    engineRef.current = engine
    
    if (prefersReducedMotion) {
      setShowContinue(true)
    } else {
      engine.start()
    }
    
    const handleResize = () => {
      engine.resize()
    }
    
    window.addEventListener('resize', handleResize)
    
    return () => {
      window.removeEventListener('resize', handleResize)
      engine.stop()
    }
  }, [beep, prefersReducedMotion])

  const handleContinue = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.stop()
    }
    onComplete()
  }, [onComplete])

  return (
    <div className={styles.wrap}>
      <canvas
        ref={canvasRef}
        className={styles.canvas}
        style={{ display: prefersReducedMotion ? 'none' : 'block' }}
      />
      
      <motion.div
        className={styles.roomOverlay}
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 2, ease: 'easeInOut' }}
      />
      
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
