import { useEffect, useRef } from 'react'
import { asset } from '../lib/asset'

const SRC_W = 502
const SRC_H = 360
const PAD = 48
const FRAME_W = SRC_W + PAD * 2
const FRAME_H = SRC_H + PAD * 2
const PIVOT_X = 286 + PAD
const PIVOT_Y = 196 + PAD

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = reject
    image.src = src
    if (image.complete && image.naturalWidth > 0) resolve(image)
  })
}

export function FlyingBird() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      canvas.style.display = 'none'
      return
    }

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let raf = 0
    let start = 0
    let cancelled = false
    const dpr = Math.min(window.devicePixelRatio || 1, 2)

    const cssSize = () => {
      const width = Math.min(240, Math.max(150, window.innerWidth * 0.3))
      return { width, height: width * (FRAME_H / FRAME_W) }
    }

    const layout = () => {
      const { width, height } = cssSize()
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
    }

    layout()
    window.addEventListener('resize', layout)

    const draw = (body: HTMLImageElement, wing: HTMLImageElement, now: number) => {
      if (cancelled) return
      if (!start) start = now
      const t = (now - start) / 1000
      const loop = 20
      const a = (t / loop) * Math.PI * 2
      const xN = 0.5 + 0.34 * Math.sin(a)
      const yN = 0.3 + 0.15 * Math.sin(a * 2 + 0.35)
      const face = Math.tanh(Math.cos(a) * 4.2)
      const beat = Math.sin(t * Math.PI * 2 * 2.55)
      const flap = -0.3 + beat * 0.3
      const bob = beat * 10
      const pitch = Math.sin(a * 2 + 0.35) * 7
      const { width, height } = cssSize()
      const x = xN * window.innerWidth - width / 2
      const y = yN * window.innerHeight - height / 2 + bob

      canvas.style.transform = `translate3d(${x}px, ${y}px, 0) scaleX(${face}) rotate(${pitch}deg)`

      ctx.setTransform(canvas.width / FRAME_W, 0, 0, canvas.height / FRAME_H, 0, 0)
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      ctx.clearRect(0, 0, FRAME_W, FRAME_H)
      ctx.drawImage(body, PAD, PAD, SRC_W, SRC_H)
      ctx.save()
      ctx.translate(PIVOT_X, PIVOT_Y)
      ctx.rotate(flap)
      ctx.drawImage(wing, PAD - PIVOT_X, PAD - PIVOT_Y, SRC_W, SRC_H)
      ctx.restore()

      raf = requestAnimationFrame((stamp) => draw(body, wing, stamp))
    }

    Promise.all([
      loadImage(asset('images/dakh-bird-body.png')),
      loadImage(asset('images/dakh-bird-wing.png')),
    ]).then(([body, wing]) => {
      if (cancelled) return
      raf = requestAnimationFrame((stamp) => draw(body, wing, stamp))
    })

    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', layout)
    }
  }, [])

  return (
    <div className="dakh-bird-sky" aria-hidden="true">
      <canvas ref={canvasRef} className="dakh-bird-canvas" />
    </div>
  )
}
