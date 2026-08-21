'use client'

import {
  useEffect,
  useRef,
  useState,
} from 'react'

import styles from './SkyOfWishes.module.css'

interface SkyOfWishesProps {
  transitionProgress?: number
  active?: boolean
  onComplete?: () => void
}

interface Particle {
  x: number
  y: number
  z: number

  vx: number
  vy: number
  vz: number

  size: number
  alpha: number

  life: number
  maxLife: number

  color: string

  gravity: number
  drag: number

  type:
    | 'star'
    | 'gold'
    | 'firework'
    | 'petal'
    | 'text'
}

interface Firework {
  x: number
  y: number

  targetY: number

  speed: number

  exploded: boolean

  particles: Particle[]
}

interface Balloon {
  x: number
  y: number

  size: number

  speed: number

  sway: number
  phase: number

  color: string
}

interface TextParticle {
  x: number
  y: number

  targetX: number
  targetY: number

  vx: number
  vy: number

  size: number

  alpha: number

  delay: number
}


/* ============================================================
   CONSTANTS
============================================================ */

const GOLD = '#FFD166'
const GOLD_LIGHT = '#FFE8A3'
const PINK = '#F5A6C8'
const WHITE_GOLD = '#FFF4D2'

const STAR_COLORS = [
  '#FFFFFF',
  '#FFF4D2',
  '#FFD166',
  '#F5A6C8',
]

const BALLOON_COLORS = [
  '#F5A6C8',
  '#FFD166',
  '#B8C7FF',
  '#D8A7FF',
  '#FFE8A3',
]


/* ============================================================
   HELPERS
============================================================ */

function random(min: number, max: number) {
  return Math.random() * (max - min) + min
}


function clamp(
  value: number,
  min: number,
  max: number,
) {
  return Math.max(
    min,
    Math.min(max, value),
  )
}


function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3)
}


function easeInOutCubic(t: number) {
  return t < 0.5
    ? 4 * t * t * t
    : 1 -
        Math.pow(
          -2 * t + 2,
          3,
        ) /
          2
}


/* ============================================================
   SKY OF WISHES
============================================================ */

export default function SkyOfWishes({
  transitionProgress = 0,
  active = true,
  onComplete,
}: SkyOfWishesProps) {
  const canvasRef =
    useRef<HTMLCanvasElement | null>(null)

  const animationRef =
    useRef<number | null>(null)

  const startTimeRef =
    useRef<number | null>(null)

  const fireworksRef =
    useRef<Firework[]>([])

  const particlesRef =
    useRef<Particle[]>([])

  const starsRef =
    useRef<Particle[]>([])

  const balloonsRef =
    useRef<Balloon[]>([])

  const textParticlesRef =
    useRef<TextParticle[]>([])

  const dimensionsRef =
    useRef({
      width: 0,
      height: 0,
      dpr: 1,
    })

  // Page1 updates transitionProgress every animation frame. Keep that value
  // in a ref so the canvas loop does not tear down and restart on every tick.
  const transitionProgressRef =
    useRef(transitionProgress)

  transitionProgressRef.current =
    transitionProgress

  const completionCalledRef =
    useRef(false)

  const [reducedMotion, setReducedMotion] =
    useState(false)


  /* ==========================================================
     REDUCED MOTION
  ========================================================== */

  useEffect(() => {
    const media =
      window.matchMedia(
        '(prefers-reduced-motion: reduce)',
      )

    const update = () => {
      setReducedMotion(media.matches)
    }

    update()

    media.addEventListener(
      'change',
      update,
    )

    return () => {
      media.removeEventListener(
        'change',
        update,
      )
    }
  }, [])


  /* ==========================================================
     CANVAS SETUP
  ========================================================== */

  useEffect(() => {
    const canvas =
      canvasRef.current

    if (!canvas) return

    const ctx =
      canvas.getContext('2d')

    if (!ctx) return

    const resize = () => {
      const width =
        window.innerWidth

      const height =
        window.innerHeight

      const dpr = Math.min(
        window.devicePixelRatio || 1,
        window.innerWidth < 768
          ? 1.5
          : 2,
      )

      dimensionsRef.current = {
        width,
        height,
        dpr,
      }

      canvas.width =
        Math.floor(width * dpr)

      canvas.height =
        Math.floor(height * dpr)

      canvas.style.width =
        `${width}px`

      canvas.style.height =
        `${height}px`

      ctx.setTransform(
        dpr,
        0,
        0,
        dpr,
        0,
        0,
      )
    }

    resize()

    window.addEventListener(
      'resize',
      resize,
    )

    return () => {
      window.removeEventListener(
        'resize',
        resize,
      )
    }
  }, [])


  /* ==========================================================
     INITIALIZE STARS
  ========================================================== */

  useEffect(() => {
    const {
      width,
      height,
    } = dimensionsRef.current

    if (!width || !height) return

    const mobile =
      width < 768

    const starCount =
      reducedMotion
        ? mobile
          ? 120
          : 220
        : mobile
          ? 420
          : 900

    const stars: Particle[] = []

    for (
      let i = 0;
      i < starCount;
      i++
    ) {
      stars.push({
        x: random(0, width),
        y: random(0, height),
        z: random(0, 1),

        vx: 0,
        vy: 0,
        vz: 0,

        size: random(
          0.4,
          mobile ? 1.4 : 1.9,
        ),

        alpha: random(
          0.2,
          0.9,
        ),

        life: 0,
        maxLife: Infinity,

        color:
          STAR_COLORS[
            Math.floor(
              Math.random() *
                STAR_COLORS.length,
            )
          ],

        gravity: 0,
        drag: 1,

        type: 'star',
      })
    }

    starsRef.current = stars
  }, [reducedMotion])


  /* ==========================================================
     INITIALIZE BALLOONS
  ========================================================== */

  useEffect(() => {
    const {
      width,
      height,
    } = dimensionsRef.current

    if (!width || !height) return

    const count =
      width < 768 ? 5 : 8

    const balloons: Balloon[] = []

    for (
      let i = 0;
      i < count;
      i++
    ) {
      balloons.push({
        x: random(
          width * 0.08,
          width * 0.92,
        ),

        y: random(
          height * 0.45,
          height * 1.05,
        ),

        size: random(
          width < 768 ? 22 : 30,
          width < 768 ? 38 : 58,
        ),

        speed: random(
          0.08,
          0.22,
        ),

        sway: random(
          12,
          35,
        ),

        phase: random(
          0,
          Math.PI * 2,
        ),

        color:
          BALLOON_COLORS[
            Math.floor(
              Math.random() *
                BALLOON_COLORS.length,
            )
          ],
      })
    }

    balloonsRef.current =
      balloons
  }, [])


  /* ==========================================================
     CREATE TEXT PARTICLES
  ========================================================== */

  const createTextParticles = (
    ctx: CanvasRenderingContext2D,
    text: string,
    fontSize: number,
  ) => {
    const {
      width,
      height,
    } = dimensionsRef.current

    const offscreen =
      document.createElement(
        'canvas',
      )

    const offCtx =
      offscreen.getContext(
        '2d',
      )

    if (!offCtx) return []

    offscreen.width = width
    offscreen.height = height

    offCtx.clearRect(
      0,
      0,
      width,
      height,
    )

    offCtx.fillStyle = '#FFFFFF'

    offCtx.textAlign = 'center'

    offCtx.textBaseline =
      'middle'

    offCtx.font =
      `700 ${fontSize}px Georgia, serif`

    offCtx.fillText(
      text,
      width / 2,
      height * 0.48,
    )

    const imageData =
      offCtx.getImageData(
        0,
        0,
        width,
        height,
      )

    const particles: TextParticle[] =
      []

    /*
     * Larger step on mobile for performance.
     */
    const step =
      width < 768 ? 5 : 4

    for (
      let y = 0;
      y < height;
      y += step
    ) {
      for (
        let x = 0;
        x < width;
        x += step
      ) {
        const index =
          (y * width + x) * 4

        const alpha =
          imageData.data[index + 3]

        if (
          alpha > 100 &&
          Math.random() > 0.32
        ) {
          particles.push({
            x: random(
              width * 0.5 - 20,
              width * 0.5 + 20,
            ),

            y:
              height +
              random(
                20,
                180,
              ),

            targetX: x,
            targetY: y,

            vx: random(
              -0.5,
              0.5,
            ),

            vy: random(
              -1,
              -0.2,
            ),

            size: random(
              1,
              width < 768
                ? 1.8
                : 2.4,
            ),

            alpha: 0,

            delay: random(
              0,
              900,
            ),
          })
        }
      }
    }

    return particles
  }


  /* ==========================================================
     SPAWN GOLD PARTICLES
  ========================================================== */

  const spawnGoldBurst = (
    x: number,
    y: number,
    amount = 80,
  ) => {
    for (
      let i = 0;
      i < amount;
      i++
    ) {
      const angle =
        Math.random() *
        Math.PI *
        2

      const speed =
        random(
          1.5,
          6,
        )

      particlesRef.current.push({
        x,
        y,
        z: 0,

        vx:
          Math.cos(angle) *
          speed,

        vy:
          Math.sin(angle) *
          speed,

        vz: 0,

        size: random(
          0.8,
          2.8,
        ),

        alpha: 1,

        life: 0,

        maxLife: random(
          900,
          1800,
        ),

        color:
          Math.random() > 0.5
            ? GOLD
            : GOLD_LIGHT,

        gravity: 0.025,

        drag: 0.985,

        type: 'gold',
      })
    }
  }


  /* ==========================================================
     SPAWN FIREWORK
  ========================================================== */

  const spawnFirework = () => {
    const {
      width,
      height,
    } = dimensionsRef.current

    const x =
      random(
        width * 0.15,
        width * 0.85,
      )

    const targetY =
      random(
        height * 0.15,
        height * 0.48,
      )

    fireworksRef.current.push({
      x,

      y: height + 10,

      targetY,

      speed: random(
        5,
        8,
      ),

      exploded: false,

      particles: [],
    })
  }


  /* ==========================================================
     EXPLODE FIREWORK
  ========================================================== */

  const explodeFirework = (
    firework: Firework,
  ) => {
    const count =
      dimensionsRef.current.width <
      768
        ? 65
        : 110

    const colors = [
      GOLD,
      GOLD_LIGHT,
      PINK,
      '#FFFFFF',
      '#C8D6FF',
    ]

    for (
      let i = 0;
      i < count;
      i++
    ) {
      const angle =
        Math.random() *
        Math.PI *
        2

      const speed =
        random(
          1.5,
          5.8,
        )

      firework.particles.push({
        x: firework.x,
        y: firework.y,

        z: 0,

        vx:
          Math.cos(angle) *
          speed,

        vy:
          Math.sin(angle) *
          speed,

        vz: 0,

        size: random(
          1,
          2.7,
        ),

        alpha: 1,

        life: 0,

        maxLife: random(
          900,
          1700,
        ),

        color:
          colors[
            Math.floor(
              Math.random() *
                colors.length,
            )
          ],

        gravity: 0.035,

        drag: 0.982,

        type: 'firework',
      })
    }

    spawnGoldBurst(
      firework.x,
      firework.y,
      35,
    )

    firework.exploded = true
  }


  /* ==========================================================
     DRAW STAR
  ========================================================== */

  const drawStar = (
    ctx: CanvasRenderingContext2D,
    star: Particle,
    time: number,
  ) => {
    const pulse =
      0.65 +
      Math.sin(
        time * 0.0015 +
          star.x,
      ) *
        0.35

    ctx.globalAlpha =
      star.alpha * pulse

    ctx.fillStyle =
      star.color

    ctx.beginPath()

    ctx.arc(
      star.x,
      star.y,
      star.size,
      0,
      Math.PI * 2,
    )

    ctx.fill()

    /*
     * Tiny glow on brighter stars.
     */
    if (star.size > 1.2) {
      ctx.globalAlpha =
        star.alpha *
        0.18

      ctx.beginPath()

      ctx.arc(
        star.x,
        star.y,
        star.size * 4,
        0,
        Math.PI * 2,
      )

      ctx.fill()
    }
  }


  /* ==========================================================
     DRAW GOLD PARTICLE
  ========================================================== */

  const drawGoldParticle = (
    ctx: CanvasRenderingContext2D,
    particle: Particle,
  ) => {
    ctx.globalAlpha =
      clamp(
        particle.alpha,
        0,
        1,
      )

    ctx.fillStyle =
      particle.color

    ctx.beginPath()

    ctx.arc(
      particle.x,
      particle.y,
      particle.size,
      0,
      Math.PI * 2,
    )

    ctx.fill()
  }


  /* ==========================================================
     DRAW PETAL
  ========================================================== */

  const drawPetal = (
    ctx: CanvasRenderingContext2D,
    particle: Particle,
  ) => {
    ctx.save()

    ctx.globalAlpha =
      particle.alpha

    ctx.translate(
      particle.x,
      particle.y,
    )

    ctx.rotate(
      particle.life * 0.003,
    )

    ctx.fillStyle =
      particle.color

    ctx.beginPath()

    ctx.ellipse(
      0,
      0,
      particle.size * 1.6,
      particle.size,
      0,
      0,
      Math.PI * 2,
    )

    ctx.fill()

    ctx.restore()
  }


  /* ==========================================================
     DRAW BALLOON
  ========================================================== */

  const drawBalloon = (
    ctx: CanvasRenderingContext2D,
    balloon: Balloon,
    time: number,
  ) => {
    const sway =
      Math.sin(
        time * 0.0007 +
          balloon.phase,
      ) *
      balloon.sway

    const x =
      balloon.x + sway

    const y =
      balloon.y

    ctx.save()

    /*
     * String.
     */
    ctx.strokeStyle =
      'rgba(255,255,255,0.35)'

    ctx.lineWidth = 0.7

    ctx.beginPath()

    ctx.moveTo(
      x,
      y + balloon.size,
    )

    ctx.quadraticCurveTo(
      x + 8,
      y +
        balloon.size +
        25,
      x - 4,
      y +
        balloon.size +
        55,
    )

    ctx.stroke()

    /*
     * Balloon body.
     */
    const gradient =
      ctx.createRadialGradient(
        x -
          balloon.size *
            0.35,
        y -
          balloon.size *
            0.35,
        2,

        x,
        y,
        balloon.size,
      )

    gradient.addColorStop(
      0,
      'rgba(255,255,255,0.85)',
    )

    gradient.addColorStop(
      0.15,
      balloon.color,
    )

    gradient.addColorStop(
      1,
      'rgba(0,0,0,0.18)',
    )

    ctx.fillStyle =
      gradient

    ctx.beginPath()

    ctx.ellipse(
      x,
      y,
      balloon.size * 0.72,
      balloon.size,
      -0.12,
      0,
      Math.PI * 2,
    )

    ctx.fill()

    /*
     * Balloon knot.
     */
    ctx.fillStyle =
      balloon.color

    ctx.beginPath()

    ctx.moveTo(
      x - 4,
      y + balloon.size - 1,
    )

    ctx.lineTo(
      x + 4,
      y + balloon.size - 1,
    )

    ctx.lineTo(
      x,
      y + balloon.size + 8,
    )

    ctx.closePath()

    ctx.fill()

    ctx.restore()
  }


  /* ==========================================================
     DRAW MOON
  ========================================================== */

  const drawMoon = (
    ctx: CanvasRenderingContext2D,
  ) => {
    const {
      width,
      height,
    } = dimensionsRef.current

    const x =
      width * 0.82

    const y =
      height * 0.16

    const radius =
      Math.min(
        width,
        height,
      ) * 0.055

    /*
     * Outer glow.
     */
    const glow =
      ctx.createRadialGradient(
        x,
        y,
        radius * 0.4,
        x,
        y,
        radius * 4,
      )

    glow.addColorStop(
      0,
      'rgba(255,240,190,0.18)',
    )

    glow.addColorStop(
      1,
      'rgba(255,240,190,0)',
    )

    ctx.fillStyle =
      glow

    ctx.beginPath()

    ctx.arc(
      x,
      y,
      radius * 4,
      0,
      Math.PI * 2,
    )

    ctx.fill()

    /*
     * Moon.
     */
    const moon =
      ctx.createRadialGradient(
        x - radius * 0.25,
        y - radius * 0.25,
        radius * 0.1,

        x,
        y,
        radius,
      )

    moon.addColorStop(
      0,
      '#FFF9E8',
    )

    moon.addColorStop(
      0.7,
      '#FFE9AD',
    )

    moon.addColorStop(
      1,
      '#D6B96B',
    )

    ctx.fillStyle =
      moon

    ctx.beginPath()

    ctx.arc(
      x,
      y,
      radius,
      0,
      Math.PI * 2,
    )

    ctx.fill()
  }


  /* ==========================================================
     CREATE PETALS
  ========================================================== */

  const spawnPetal = () => {
    const {
      width,
      height,
    } = dimensionsRef.current

    particlesRef.current.push({
      x: random(
        0,
        width,
      ),

      y: -20,

      z: 0,

      vx: random(
        -0.5,
        0.5,
      ),

      vy: random(
        0.5,
        1.8,
      ),

      vz: 0,

      size: random(
        3,
        7,
      ),

      alpha: random(
        0.45,
        0.85,
      ),

      life: 0,

      maxLife: random(
        5000,
        9000,
      ),

      color:
        Math.random() >
        0.5
          ? '#F5A6C8'
          : '#FFD9E8',

      gravity: 0.006,

      drag: 0.995,

      type: 'petal',
    })
  }


  /* ==========================================================
     ANIMATION LOOP
  ========================================================== */

  useEffect(() => {
    const canvas =
      canvasRef.current

    if (!canvas) return

    const ctx =
      canvas.getContext('2d')

    if (!ctx) return

    if (!active) {
      ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height,
      )

      return
    }

    startTimeRef.current =
      performance.now()

    completionCalledRef.current =
      false

    let lastTime =
      performance.now()

    let fireworkTimer = 0
    let petalTimer = 0

    let textCreated = false

    const animate = (
      currentTime: number,
    ) => {
      const elapsed =
        currentTime -
        (startTimeRef.current ??
          currentTime)

      const delta =
        Math.min(
          currentTime -
            lastTime,
          32,
        )

      lastTime =
        currentTime

      const {
        width,
        height,
      } = dimensionsRef.current

      const progress =
        transitionProgressRef.current

      /*
       * Clear canvas.
       */
      ctx.clearRect(
        0,
        0,
        width,
        height,
      )

      /*
       * Night background.
       */
      const sky =
        ctx.createLinearGradient(
          0,
          0,
          0,
          height,
        )

      sky.addColorStop(
        0,
        '#02030E',
      )

      sky.addColorStop(
        0.45,
        '#070B24',
      )

      sky.addColorStop(
        1,
        '#101638',
      )

      ctx.fillStyle =
        sky

      ctx.fillRect(
        0,
        0,
        width,
        height,
      )

      /*
       * Stars.
       */
      const starVisibility =
        clamp(
          progress *
            1.8,
          0,
          1,
        )

      ctx.save()

      ctx.globalAlpha =
        starVisibility

      for (
        const star of starsRef.current
      ) {
        drawStar(
          ctx,
          star,
          currentTime,
        )
      }

      ctx.restore()

      /*
       * Moon.
       */
      ctx.save()

      ctx.globalAlpha =
        starVisibility

      drawMoon(ctx)

      ctx.restore()


      /* ======================================================
         PARTICLE TEXT
      ====================================================== */

      /*
       * Start text formation after the room
       * has mostly transitioned away.
       */
      if (
        progress > 0.55 &&
        !textCreated
      ) {
        const fontSize =
          width < 768
            ? Math.min(
                width * 0.075,
                34,
              )
            : Math.min(
                width * 0.06,
                64,
              )

        textParticlesRef.current =
          createTextParticles(
            ctx,
            'HAPPY BIRTHDAY ARFA',
            fontSize,
          )

        textCreated = true
      }


      /*
       * Animate text particles.
       */
      if (
        textCreated &&
        textParticlesRef.current
          .length
      ) {
        const textProgress =
          clamp(
            (elapsed - 1800) /
              2500,
            0,
            1,
          )

        for (
          const particle of
            textParticlesRef.current
        ) {
          if (
            elapsed <
            particle.delay
          ) {
            continue
          }

          const progress =
            easeInOutCubic(
              textProgress,
            )

          particle.x +=
            (
              particle.targetX -
              particle.x
            ) *
            0.055

          particle.y +=
            (
              particle.targetY -
              particle.y
            ) *
            0.055

          particle.vx *=
            0.94

          particle.vy *=
            0.94

          particle.alpha =
            clamp(
              progress *
                1.5,
              0,
              1,
            )

          ctx.save()

          ctx.globalAlpha =
            particle.alpha

          /*
           * Dark golden core.
           */
          ctx.fillStyle =
            '#6F4B16'

          ctx.shadowColor =
            'rgba(255, 209, 102, 0.95)'

          ctx.shadowBlur = 10

          ctx.beginPath()

          ctx.arc(
            particle.x,
            particle.y,
            particle.size,
            0,
            Math.PI * 2,
          )

          ctx.fill()

          /*
           * Bright highlight.
           */
          ctx.globalAlpha =
            particle.alpha * 0.8

          ctx.fillStyle =
            GOLD_LIGHT

          ctx.beginPath()

          ctx.arc(
            particle.x,
            particle.y,
            particle.size *
              0.42,
            0,
            Math.PI * 2,
          )

          ctx.fill()

          ctx.restore()
        }
      }


      /* ======================================================
         GOLDEN RISING PARTICLES
      ====================================================== */

      if (
        progress > 0.35
      ) {
        const spawnCount =
          reducedMotion
            ? 1
            : width < 768
              ? 3
              : 6

        for (
          let i = 0;
          i < spawnCount;
          i++
        ) {
          particlesRef.current.push({
            x: random(
              width * 0.2,
              width * 0.8,
            ),

            y:
              height +
              random(
                0,
                100,
              ),

            z: 0,

            vx: random(
              -0.4,
              0.4,
            ),

            vy: random(
              -1.5,
              -0.45,
            ),

            vz: 0,

            size: random(
              0.7,
              2.2,
            ),

            alpha: random(
              0.35,
              0.8,
            ),

            life: 0,

            maxLife: random(
              2500,
              5000,
            ),

            color:
              Math.random() >
              0.5
                ? GOLD
                : GOLD_LIGHT,

            gravity: -0.002,

            drag: 0.997,

            type: 'gold',
          })
        }
      }


      /* ======================================================
         FIREWORKS
      ====================================================== */

      if (
        progress > 0.75 &&
        !reducedMotion
      ) {
        fireworkTimer += delta

        if (
          fireworkTimer >
          random(
            700,
            1300,
          )
        ) {
          spawnFirework()

          fireworkTimer = 0
        }
      }


      /*
       * Update rockets.
       */
      for (
        let i =
          fireworksRef.current
            .length - 1;
        i >= 0;
        i--
      ) {
        const firework =
          fireworksRef.current[i]

        if (
          !firework.exploded
        ) {
          firework.y -=
            firework.speed *
            (delta / 16)

          /*
           * Rocket trail.
           */
          ctx.save()

          ctx.globalAlpha =
            0.65

          ctx.strokeStyle =
            GOLD_LIGHT

          ctx.lineWidth = 1.4

          ctx.beginPath()

          ctx.moveTo(
            firework.x,
            firework.y + 14,
          )

          ctx.lineTo(
            firework.x,
            firework.y + 2,
          )

          ctx.stroke()

          ctx.restore()

          if (
            firework.y <=
            firework.targetY
          ) {
            explodeFirework(
              firework,
            )
          }
        } else {
          /*
           * Update explosion particles.
           */
          for (
            let j =
              firework.particles
                .length - 1;
            j >= 0;
            j--
          ) {
            const particle =
              firework.particles[j]

            particle.life +=
              delta

            particle.vx *=
              particle.drag

            particle.vy =
              particle.vy *
                particle.drag +
              particle.gravity *
                (delta / 16)

            particle.x +=
              particle.vx *
              (delta / 16)

            particle.y +=
              particle.vy *
              (delta / 16)

            particle.alpha =
              1 -
              particle.life /
                particle.maxLife

            drawGoldParticle(
              ctx,
              particle,
            )

            if (
              particle.life >=
              particle.maxLife
            ) {
              firework.particles.splice(
                j,
                1,
              )
            }
          }

          if (
            firework.particles
              .length === 0
          ) {
            fireworksRef.current.splice(
              i,
              1,
            )
          }
        }
      }


      /* ======================================================
         PETALS
      ====================================================== */

      if (
        progress > 0.8
      ) {
        petalTimer += delta

        if (
          petalTimer >
          (reducedMotion
            ? 900
            : 300)
        ) {
          spawnPetal()

          petalTimer = 0
        }
      }


      /* ======================================================
         UPDATE GENERAL PARTICLES
      ====================================================== */

      for (
        let i =
          particlesRef.current
            .length - 1;
        i >= 0;
        i--
      ) {
        const particle =
          particlesRef.current[i]

        particle.life +=
          delta

        particle.vx *=
          particle.drag

        particle.vy =
          particle.vy *
            particle.drag +
          particle.gravity *
            (delta / 16)

        particle.x +=
          particle.vx *
          (delta / 16)

        particle.y +=
          particle.vy *
          (delta / 16)

        if (
          particle.type ===
          'petal'
        ) {
          drawPetal(
            ctx,
            particle,
          )
        } else {
          drawGoldParticle(
            ctx,
            particle,
          )
        }

        if (
          particle.life >=
          particle.maxLife
        ) {
          particlesRef.current.splice(
            i,
            1,
          )
        }
      }


      /* ======================================================
         BALLOONS
      ====================================================== */

      if (
        progress >
        0.65
      ) {
        for (
          const balloon of
            balloonsRef.current
        ) {
          balloon.y -=
            balloon.speed *
            (delta / 16)

          /*
           * Reset balloon after leaving screen.
           */
          if (
            balloon.y <
            -balloon.size * 2
          ) {
            balloon.y =
              height +
              random(
                50,
                250,
              )

            balloon.x =
              random(
                width * 0.08,
                width * 0.92,
              )
          }

          drawBalloon(
            ctx,
            balloon,
            currentTime,
          )
        }
      }


      /* ======================================================
         FINAL GOLDEN FLASH
      ====================================================== */

      const finale =
        clamp(
          (elapsed - 9000) /
            1000,
          0,
          1,
        )

      if (
        finale > 0 &&
        progress >
          0.8
      ) {
        ctx.save()

        ctx.globalAlpha =
          Math.sin(
            finale * Math.PI,
          ) * 0.12

        const flash =
          ctx.createRadialGradient(
            width / 2,
            height * 0.48,
            0,

            width / 2,
            height * 0.48,
            Math.max(
              width,
              height,
            ) *
              0.6,
          )

        flash.addColorStop(
          0,
          'rgba(255,209,102,0.9)',
        )

        flash.addColorStop(
          1,
          'rgba(255,209,102,0)',
        )

        ctx.fillStyle =
          flash

        ctx.fillRect(
          0,
          0,
          width,
          height,
        )

        ctx.restore()
      }


      /* ======================================================
         END
      ====================================================== */

      if (
        elapsed > 11000 &&
        onComplete &&
        !completionCalledRef.current
      ) {
        completionCalledRef.current = true
        onComplete()
      }


      animationRef.current =
        requestAnimationFrame(
          animate,
        )
    }


    animationRef.current =
      requestAnimationFrame(
        animate,
      )

    return () => {
      if (
        animationRef.current !==
        null
      ) {
        cancelAnimationFrame(
          animationRef.current,
        )

        animationRef.current =
          null
      }

      fireworksRef.current = []
      particlesRef.current = []
      textParticlesRef.current = []
    }
  }, [
    active,
    reducedMotion,
    onComplete,
  ])


  /* ==========================================================
     RENDER
  ========================================================== */

  if (!active) {
    return null
  }

  return (
    <div
      className={
        styles.skyOfWishes
      }
    >

      {/* ================================================
          NIGHT SKY
      ================================================ */}

      <div
        className={
          styles.nightSky
        }
      />


      {/* ================================================
          CANVAS
      ================================================ */}

      <canvas
        ref={canvasRef}
        className={
          styles.canvas
        }
        aria-hidden="true"
      />


      {/* ================================================
          ATMOSPHERIC GLOW
      ================================================ */}

      <div
        className={
          styles.atmosphere
        }
        aria-hidden="true"
      />


      {/* ================================================
          DARK VIGNETTE
      ================================================ */}

      <div
        className={
          styles.vignette
        }
        aria-hidden="true"
      />


      {/* ================================================
          ACCESSIBLE FALLBACK
      ================================================ */}

      <div
        className={
          styles.accessibleContent
        }
        aria-live="polite"
      >
        <span>
          Happy Birthday Arfa
        </span>
      </div>

    </div>
  )
}
