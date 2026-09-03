import { useEffect, useRef, useState } from 'react'

interface GlitchTextProps {
  text: string
  as?: 'span' | 'h1' | 'h2' | 'h3' | 'p' | 'div'
  className?: string
  /** fire a short glitch burst on an interval */
  auto?: boolean
  /** average ms between bursts */
  every?: number
}

/**
 * GlitchText — a restrained chromatic-aberration burst.
 * Fires on hover always, and (optionally) on a slow random interval so the
 * CTF phases feel alive without ever becoming a screensaver.
 */
export function GlitchText({ text, as: Tag = 'span', className = '', auto = false, every = 7000 }: GlitchTextProps) {
  const [on, setOn] = useState(false)
  const timer = useRef<number>()

  useEffect(() => {
    if (!auto) return
    let cancelled = false
    const schedule = () => {
      const wait = every * (0.55 + Math.random() * 0.9)
      timer.current = window.setTimeout(() => {
        if (cancelled) return
        setOn(true)
        window.setTimeout(() => {
          if (!cancelled) setOn(false)
          schedule()
        }, 420)
      }, wait)
    }
    schedule()
    return () => {
      cancelled = true
      if (timer.current) clearTimeout(timer.current)
    }
  }, [auto, every])

  return (
    <Tag className={`glitch ${on ? 'glitching' : ''} ${className}`} data-text={text}>
      {text}
    </Tag>
  )
}
