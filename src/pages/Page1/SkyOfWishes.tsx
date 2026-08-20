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
  targetX: number
  targetY: number
  size: number
  speed: number
  opacity: number
  color: string
  phase: 'rising' | 'forming' | 'holding' | 'exploding' | 'falling'
  turbulence: number
  drift: number
}

interface Firework {
  x: number
  y: number
  particles: Particle[]
  age: number
  maxAge: number
}

interface Petal {
  x: number
  y: number
  rotation: number
  rotationSpeed: number
  xSpeed: number
  ySpeed: number
  size: number
  color: string
  opacity: number
  swayPhase: number
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
  private particles: Particle[] = []
  private fireworks: Firework[] = []
  private petals: Petal[] = []
  private stars: { x: number; y: number; size: number; opacity: number; twinkleSpeed: number }[] = []
  private animationFrame: number | null = null
  private phase: 'room' | 'rising' | 'formingHappy' | 'holdingHappy' | 'exploding' | 'formingArfa' | 'holdingArfa' | 'finalExplosion' | 'celebration' = 'rising'
  private phaseStartTime = 0
  private cameraY = 0
  private moonX = 0
  private moonY = 0
  private onPhaseChange?: (phase: string) => void
  private textParticlesTargets: Map<string, { x: number; y: number }[]> = new Map()
  private particleLevel: 'high' | 'normal' | 'low' = 'normal'

  constructor(canvas: HTMLCanvasElement, onPhaseChange?: (phase: string) => void) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')!
    this.onPhaseChange = onPhaseChange
    this.detectPerformance()
    this.setupCanvas()
    this.createStars()
    this.createInitialParticles()
    this.createPetals()
    this.phaseStartTime = performance.now()
  }

  private detectPerformance() {
    const isMobile = /iPhone|iPad|Android/i.test(navigator.userAgent)
    const cores = navigator.hardwareConcurrency || 4
    
    if (isMobile || cores <= 4) {
      this.particleLevel = 'low'
    } else if (cores >= 8) {
      this.particleLevel = 'high'
    } else {
      this.particleLevel = 'normal'
    }
  }

  private getParticleCount(): number {
    switch (this.particleLevel) {
      case 'high': return 20000
      case 'normal': return 12000
      case 'low': return 5000
    }
  }

  private setupCanvas() {
    const dpr = Math.min(window.devicePixelRatio, 2)
    this.canvas.width = window.innerWidth * dpr
    this.canvas.height = window.innerHeight * dpr
    this.canvas.style.width = `${window.innerWidth}px`
    this.canvas.style.height = `${window.innerHeight}px`
    this.ctx.scale(dpr, dpr)
    this.moonX = window.innerWidth * 0.75
    this.moonY = window.innerHeight * 0.2
  }

  private createStars() {
    const starCount = 200
    for (let i = 0; i < starCount; i++) {
      this.stars.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight * 0.7,
        size: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.8 + 0.2,
        twinkleSpeed: Math.random() * 0.02 + 0.005,
      })
    }
  }

  private createInitialParticles() {
    const count = this.getParticleCount()
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: Math.random() * window.innerWidth,
        y: window.innerHeight + Math.random() * 200,
        targetX: 0,
        targetY: 0,
        size: Math.random() * 3 + 1,
        speed: Math.random() * 2 + 1,
        opacity: Math.random() * 0.6 + 0.4,
        color: Math.random() > 0.7 ? COLORS.brightGold : COLORS.warmGold,
        phase: 'rising',
        turbulence: Math.random() * 20 - 10,
        drift: Math.random() * Math.PI * 2,
      })
    }
  }

  private createPetals() {
    const petalCount = 30
    const colors = ['#F5A6C8', '#FFB4D9', '#FFC8DD', '#E878A5', '#FFE8A3']
    for (let i = 0; i < petalCount; i++) {
      this.petals.push({
        x: Math.random() * window.innerWidth,
        y: -20,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.05,
        xSpeed: (Math.random() - 0.5) * 2,
        ySpeed: Math.random() * 1.5 + 0.5,
        size: Math.random() * 8 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        opacity: Math.random() * 0.4 + 0.3,
        swayPhase: Math.random() * Math.PI * 2,
      })
    }
  }

  private sampleText(text: string, fontSize: number): { x: number; y: number }[] {
    const offscreen = document.createElement('canvas')
    const offCtx = offscreen.getContext('2d')!
    offscreen.width = window.innerWidth
    offscreen.height = window.innerHeight
    
    offCtx.fillStyle = 'white'
    offCtx.font = `bold ${fontSize}px Georgia, serif`
    offCtx.textAlign = 'center'
    offCtx.textBaseline = 'middle'
    offCtx.fillText(text, window.innerWidth / 2, window.innerHeight / 2)
    
    const imageData = offCtx.getImageData(0, 0, offscreen.width, offscreen.height)
    const positions: { x: number; y: number }[] = []
    const gap = this.particleLevel === 'high' ? 3 : this.particleLevel === 'normal' ? 4 : 6
    
    for (let y = 0; y < offscreen.height; y += gap) {
      for (let x = 0; x < offscreen.width; x += gap) {
        if (imageData.data[(y * offscreen.width + x) * 4 + 3] > 128) {
          positions.push({ x, y })
        }
      }
    }
    
    return positions
  }

  private formText(text: string, fontSize: number) {
    const targets = this.sampleText(text, fontSize)
    const availableParticles = this.particles.filter(p => p.phase !== 'exploding' && p.phase !== 'falling')
    
    if (availableParticles.length < targets.length) {
      // Add more particles if needed
      const needed = targets.length - availableParticles.length
      for (let i = 0; i < needed; i++) {
        this.particles.push({
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight,
          targetX: 0,
          targetY: 0,
          size: Math.random() * 2 + 1,
          speed: Math.random() * 2 + 1,
          opacity: Math.random() * 0.6 + 0.4,
          color: Math.random() > 0.7 ? COLORS.brightGold : COLORS.warmGold,
          phase: 'rising',
          turbulence: Math.random() * 20 - 10,
          drift: Math.random() * Math.PI * 2,
        })
      }
    }
    
    const shuffledParticles = [...availableParticles].sort(() => Math.random() - 0.5)
    const particlesToUse = shuffledParticles.slice(0, targets.length)
    
    particlesToUse.forEach((particle, i) => {
      particle.targetX = targets[i].x
      particle.targetY = targets[i].y
      particle.phase = 'forming'
    })
    
    // Set remaining particles to rise and disperse
    this.particles.forEach(particle => {
      if (particle.phase === 'rising') {
        particle.targetX = particle.x + (Math.random() - 0.5) * 400
        particle.targetY = window.innerHeight * 0.2 + Math.random() * 100
      }
    })
  }

  private explodeText() {
    this.particles.forEach(particle => {
      if (particle.phase === 'forming' || particle.phase === 'holding') {
        particle.phase = 'exploding'
        const angle = Math.random() * Math.PI * 2
        const force = Math.random() * 10 + 5
        particle.targetX = particle.x + Math.cos(angle) * force
        particle.targetY = particle.y + Math.sin(angle) * force
      }
    })
  }

  private createFirework(x: number, y: number) {
    const firework: Firework = {
      x,
      y,
      particles: [],
      age: 0,
      maxAge: 2000 + Math.random() * 1000,
    }
    
    const particleCount = this.particleLevel === 'high' ? 200 : this.particleLevel === 'normal' ? 120 : 60
    const colors = [COLORS.warmGold, COLORS.brightGold, COLORS.softPink, COLORS.rose, '#FFFFFF']
    
    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount
      const speed = Math.random() * 5 + 2
      firework.particles.push({
        x,
        y,
        targetX: x + Math.cos(angle) * speed * 20,
        targetY: y + Math.sin(angle) * speed * 20,
        size: Math.random() * 2 + 0.5,
        speed,
        opacity: 1,
        color: colors[Math.floor(Math.random() * colors.length)],
        phase: 'exploding',
        turbulence: 0,
        drift: 0,
      })
    }
    
    this.fireworks.push(firework)
  }

  private triggerFireworks() {
    const positions = [
      { x: window.innerWidth * 0.2, y: window.innerHeight * 0.3 },
      { x: window.innerWidth * 0.8, y: window.innerHeight * 0.25 },
      { x: window.innerWidth * 0.5, y: window.innerHeight * 0.4 },
      { x: window.innerWidth * 0.3, y: window.innerHeight * 0.2 },
      { x: window.innerWidth * 0.7, y: window.innerHeight * 0.35 },
    ]
    
    positions.forEach((pos, i) => {
      setTimeout(() => {
        this.createFirework(pos.x, pos.y)
      }, i * 300)
    })
  }

  private drawMoon() {
    const ctx = this.ctx
    const moonRadius = 60
    const glowRadius = moonRadius * 3
    
    // Moon glow
    const glowGradient = ctx.createRadialGradient(this.moonX, this.moonY, 0, this.moonX, this.moonY, glowRadius)
    glowGradient.addColorStop(0, 'rgba(255, 248, 240, 0.3)')
    glowGradient.addColorStop(0.4, 'rgba(255, 248, 240, 0.1)')
    glowGradient.addColorStop(1, 'rgba(255, 248, 240, 0)')
    
    ctx.fillStyle = glowGradient
    ctx.beginPath()
    ctx.arc(this.moonX, this.moonY, glowRadius, 0, Math.PI * 2)
    ctx.fill()
    
    // Moon
    const moonGradient = ctx.createRadialGradient(
      this.moonX - moonRadius * 0.3, this.moonY - moonRadius * 0.3, 0,
      this.moonX, this.moonY, moonRadius
    )
    moonGradient.addColorStop(0, '#FFF8F0')
    moonGradient.addColorStop(0.7, '#FFE8D6')
    moonGradient.addColorStop(1, '#F5D0B0')
    
    ctx.fillStyle = moonGradient
    ctx.beginPath()
    ctx.arc(this.moonX, this.moonY, moonRadius, 0, Math.PI * 2)
    ctx.fill()
    
    // Moon craters
    ctx.fillStyle = 'rgba(200, 180, 160, 0.3)'
    ctx.beginPath()
    ctx.arc(this.moonX - 20, this.moonY - 10, 8, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(this.moonX + 15, this.moonY + 20, 12, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(this.moonX + 25, this.moonY - 25, 6, 0, Math.PI * 2)
    ctx.fill()
  }

  private drawStars(currentTime: number) {
    this.stars.forEach(star => {
      const twinkle = Math.sin(currentTime * star.twinkleSpeed + star.x) * 0.3 + 0.7
      this.ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity * twinkle})`
      this.ctx.beginPath()
      this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2)
      this.ctx.fill()
    })
  }

  private drawParticles(currentTime: number) {
    this.particles.forEach(particle => {
      let x = particle.x
      let y = particle.y
      
      switch (particle.phase) {
        case 'rising':
          y -= particle.speed * 0.5
          x += Math.sin(currentTime * 0.001 + particle.drift) * 0.5
          particle.x = x
          particle.y = y
          
          if (y < -20) {
            particle.y = window.innerHeight + 20
            particle.x = Math.random() * window.innerWidth
          }
          break
          
        case 'forming':
          x += (particle.targetX - x) * 0.05
          y += (particle.targetY - y) * 0.05
          particle.x = x
          particle.y = y
          
          if (Math.abs(particle.targetX - x) < 1 && Math.abs(particle.targetY - y) < 1) {
            particle.phase = 'holding'
          }
          break
          
        case 'holding':
          x = particle.targetX + Math.sin(currentTime * 0.002 + particle.drift) * 0.5
          y = particle.targetY + Math.cos(currentTime * 0.0015 + particle.drift) * 0.5
          particle.x = x
          particle.y = y
          break
          
        case 'exploding':
          x += (particle.targetX - x) * 0.1
          y += (particle.targetY - y) * 0.1
          particle.opacity *= 0.98
          particle.x = x
          particle.y = y
          
          if (particle.opacity < 0.05) {
            particle.phase = 'rising'
            particle.opacity = Math.random() * 0.6 + 0.4
            particle.x = Math.random() * window.innerWidth
            particle.y = window.innerHeight + Math.random() * 200
          }
          break
      }
      
      const alpha = particle.opacity
      const size = particle.size
      
      // Glow effect
      const glowGradient = this.ctx.createRadialGradient(x, y, 0, x, y, size * 4)
      glowGradient.addColorStop(0, particle.color)
      glowGradient.addColorStop(1, 'transparent')
      
      this.ctx.fillStyle = glowGradient
      this.ctx.globalAlpha = alpha * 0.3
      this.ctx.beginPath()
      this.ctx.arc(x, y, size * 4, 0, Math.PI * 2)
      this.ctx.fill()
      
      // Core particle
      this.ctx.fillStyle = particle.color
      this.ctx.globalAlpha = alpha
      this.ctx.beginPath()
      this.ctx.arc(x, y, size, 0, Math.PI * 2)
      this.ctx.fill()
      
      this.ctx.globalAlpha = 1
    })
  }

  private drawFireworks(currentTime: number) {
    this.fireworks.forEach(firework => {
      firework.age += 16
      
      if (firework.age < firework.maxAge) {
        const progress = firework.age / firework.maxAge
        const alpha = 1 - progress
        
        firework.particles.forEach(particle => {
          const x = particle.x + (particle.targetX - particle.x) * 0.1
          const y = particle.y + (particle.targetY - particle.y) * 0.1
          particle.x = x
          particle.y = y
          particle.opacity = alpha
          
          this.ctx.fillStyle = particle.color
          this.ctx.globalAlpha = particle.opacity
          this.ctx.beginPath()
          this.ctx.arc(x, y, particle.size, 0, Math.PI * 2)
          this.ctx.fill()
          this.ctx.globalAlpha = 1
        })
      }
    })
    
    // Clean up old fireworks
    this.fireworks = this.fireworks.filter(fw => fw.age < fw.maxAge)
  }

  private drawPetals(currentTime: number) {
    this.petals.forEach(petal => {
      petal.y += petal.ySpeed * 0.3
      petal.x += petal.xSpeed + Math.sin(currentTime * 0.001 + petal.swayPhase) * 0.5
      petal.rotation += petal.rotationSpeed
      
      if (petal.y > window.innerHeight + 20) {
        petal.y = -20
        petal.x = Math.random() * window.innerWidth
      }
      
      if (petal.x > window.innerWidth + 20) {
        petal.x = -20
      }
      
      if (petal.x < -20) {
        petal.x = window.innerWidth + 20
      }
      
      this.ctx.save()
      this.ctx.translate(petal.x, petal.y)
      this.ctx.rotate(petal.rotation)
      this.ctx.globalAlpha = petal.opacity
      this.ctx.fillStyle = petal.color
      
      // Draw petal shape
      this.ctx.beginPath()
      this.ctx.ellipse(0, 0, petal.size, petal.size * 0.6, 0, 0, Math.PI * 2)
      this.ctx.fill()
      
      this.ctx.globalAlpha = 1
      this.ctx.restore()
    })
  }

  private updatePhase(currentTime: number) {
    const elapsed = currentTime - this.phaseStartTime
    
    switch (this.phase) {
      case 'rising':
        if (elapsed > 3000) {
          this.phase = 'formingHappy'
          this.phaseStartTime = currentTime
          this.formText('HAPPY BIRTHDAY', 60)
          this.onPhaseChange?.('formingHappy')
        }
        break
        
      case 'formingHappy':
        if (elapsed > 2000) {
          this.phase = 'holdingHappy'
          this.phaseStartTime = currentTime
          this.onPhaseChange?.('holdingHappy')
        }
        break
        
      case 'holdingHappy':
        if (elapsed > 2500) {
          this.phase = 'exploding'
          this.phaseStartTime = currentTime
          this.explodeText()
          this.onPhaseChange?.('exploding')
        }
        break
        
      case 'exploding':
        if (elapsed > 1500) {
          this.phase = 'formingArfa'
          this.phaseStartTime = currentTime
          this.formText('ARFA', 80)
          this.onPhaseChange?.('formingArfa')
        }
        break
        
      case 'formingArfa':
        if (elapsed > 2000) {
          this.phase = 'holdingArfa'
          this.phaseStartTime = currentTime
          this.onPhaseChange?.('holdingArfa')
        }
        break
        
      case 'holdingArfa':
        if (elapsed > 3000) {
          this.phase = 'finalExplosion'
          this.phaseStartTime = currentTime
          this.explodeText()
          this.onPhaseChange?.('finalExplosion')
        }
        break
        
      case 'finalExplosion':
        if (elapsed > 1000) {
          this.phase = 'celebration'
          this.phaseStartTime = currentTime
          this.triggerFireworks()
          this.onPhaseChange?.('celebration')
        }
        break
    }
  }

  private render(currentTime: number) {
    // Clear canvas with gradient
    const gradient = this.ctx.createLinearGradient(0, 0, 0, window.innerHeight)
    gradient.addColorStop(0, '#050817')
    gradient.addColorStop(0.5, '#0B1230')
    gradient.addColorStop(1, '#1a1a3a')
    
    this.ctx.fillStyle = gradient
    this.ctx.fillRect(0, 0, window.innerWidth, window.innerHeight)
    
    // Draw atmospheric haze
    const hazeGradient = this.ctx.createRadialGradient(
      window.innerWidth / 2, window.innerHeight * 0.4, 0,
      window.innerWidth / 2, window.innerHeight * 0.4, window.innerWidth * 0.7
    )
    hazeGradient.addColorStop(0, 'rgba(56, 36, 92, 0.3)')
    hazeGradient.addColorStop(1, 'transparent')
    
    this.ctx.fillStyle = hazeGradient
    this.ctx.fillRect(0, 0, window.innerWidth, window.innerHeight)
    
    this.drawStars(currentTime)
    this.drawMoon()
    this.drawParticles(currentTime)
    this.drawFireworks(currentTime)
    this.drawPetals(currentTime)
    
    this.updatePhase(currentTime)
    
    this.animationFrame = requestAnimationFrame(this.render.bind(this))
  }

  start() {
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
  }
}

export function SkyOfWishes({ wishText, onComplete }: SkyOfWishesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const engineRef = useRef<SkyOfWishesEngine | null>(null)
  const [currentPhase, setCurrentPhase] = useState('rising')
  const [showContinue, setShowContinue] = useState(false)
  const { beep } = useBeep()
  const prefersReducedMotion = useReducedMotion()

  useEffect(() => {
    if (!canvasRef.current) return
    
    const engine = new SkyOfWishesEngine(canvasRef.current, (phase) => {
      setCurrentPhase(phase)
      
      if (phase === 'celebration') {
        // Play celebration beep
        beep(880, 0.3, 'sine', 0.1)
        setTimeout(() => beep(1100, 0.3, 'sine', 0.1), 200)
        setTimeout(() => beep(1320, 0.5, 'sine', 0.1), 400)
        
        // Show continue button after celebration
        setTimeout(() => setShowContinue(true), 5000)
      }
    })
    
    engineRef.current = engine
    
    if (prefersReducedMotion) {
      // Skip animations for reduced motion preference
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
      
      {/* Room transition overlay */}
      <motion.div
        className={styles.roomOverlay}
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 3, ease: 'easeInOut' }}
      />
      
      {/* Phase indicators */}
      <AnimatePresence>
        {currentPhase === 'holdingHappy' && (
          <motion.div
            className={styles.phaseText}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.2 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className={styles.birthdayText}>Happy Birthday</h2>
          </motion.div>
        )}
        
        {currentPhase === 'holdingArfa' && (
          <motion.div
            className={styles.phaseText}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.2 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className={styles.arfaText}>Arfa</h1>
            <p className={styles.wishText}>{wishText}</p>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Continue button */}
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
      
      {/* Reduced motion fallback */}
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
