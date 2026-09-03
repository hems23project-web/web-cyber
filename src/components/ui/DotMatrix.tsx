import { useEffect, useRef, useState } from 'react'

interface DotMatrixProps {
  text: string
  className?: string
  /** scramble duration in ms */
  duration?: number
}

const GLYPHS = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789/#*<>'

/**
 * DotMatrix — a short, tasteful decode-scramble on mount.
 * Not Matrix rain: the glyphs settle into the real title in under a second.
 */
export function DotMatrix({ text, className = '', duration = 700 }: DotMatrixProps) {
  const [out, setOut] = useState(text)
  const frame = useRef<number>()
  const reduced = useRef(false)

  useEffect(() => {
    reduced.current =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true
    const root = document.querySelector('.reduce-motion')
    if (reduced.current || root) {
      setOut(text)
      return
    }

    const start = performance.now()
    const chars = Array.from(text)

    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      const settled = Math.floor(t * chars.length * 1.25)
      setOut(
        chars
          .map((ch, i) => {
            if (ch === ' ') return ' '
            if (i < settled) return ch
            return GLYPHS[Math.floor(Math.random() * GLYPHS.length)]
          })
          .join(''),
      )
      if (t < 1) {
        frame.current = requestAnimationFrame(step)
      } else {
        setOut(text)
      }
    }

    frame.current = requestAnimationFrame(step)
    return () => {
      if (frame.current) cancelAnimationFrame(frame.current)
    }
  }, [text, duration])

  return (
    <span className={`dotmatrix ${className}`} aria-label={text}>
      <span aria-hidden="true">{out}</span>
    </span>
  )
}
