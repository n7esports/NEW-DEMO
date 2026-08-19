/**
 * Applies an in-place warm-tint + grain + vignette treatment to whatever is
 * currently drawn on the given canvas context. Pure pixel manipulation —
 * no external image processing library needed.
 */
export function applyVintageFilter(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const imageData = ctx.getImageData(0, 0, width, height)
  const data = imageData.data

  for (let i = 0; i < data.length; i += 4) {
    // Warm tint: boost red/yellow, pull back blue
    let r = data[i] * 1.08 + 12
    let g = data[i + 1] * 1.02 + 4
    let b = data[i + 2] * 0.9

    // Grain: per-pixel luminance noise
    const noise = (Math.random() - 0.5) * 20
    r += noise
    g += noise
    b += noise

    data[i] = Math.min(255, Math.max(0, r))
    data[i + 1] = Math.min(255, Math.max(0, g))
    data[i + 2] = Math.min(255, Math.max(0, b))
  }

  ctx.putImageData(imageData, 0, 0)

  // Vignette
  const gradient = ctx.createRadialGradient(
    width / 2,
    height / 2,
    height * 0.25,
    width / 2,
    height / 2,
    height * 0.72,
  )
  gradient.addColorStop(0, 'rgba(0,0,0,0)')
  gradient.addColorStop(1, 'rgba(20,10,5,0.5)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)
}
