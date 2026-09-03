import { memo } from 'react'
import { useGame } from '@/hooks/useGame'

interface AmbientProps {
  /** which layers to paint */
  circuit?: boolean
  glow?: boolean
  grain?: boolean
  scan?: boolean
  vignette?: boolean
  rain?: boolean
  /** extra class on the fixed wrapper */
  className?: string
}

/**
 * Ambient — the layered, mostly-static atmosphere behind every phase.
 * Purely decorative: `pointer-events: none`, `aria-hidden`, and it never
 * re-renders on state change (except for the reduce-motion class).
 */
function AmbientBase({
  circuit = true,
  glow = true,
  grain = true,
  scan = false,
  vignette = true,
  rain = false,
  className = '',
}: AmbientProps) {
  const { state } = useGame()
  const off = state.reduceMotion

  return (
    <div className={`ambient ${off ? 'reduce-motion' : ''} ${className}`} aria-hidden="true">
      {glow && <div className="ambient-glow" />}
      {circuit && <div className="ambient-circuit" />}
      {rain && <RainLayer />}
      {scan && <div className="ambient-scan" />}
      {grain && !off && <div className="ambient-grain" />}
      {vignette && <div className="ambient-vignette" />}
    </div>
  )
}

/**
 * RainLayer — a handful of thin streaks, deterministic positions, low opacity.
 * Used on the landing page and MEMORY 02 only. Not "Matrix rain".
 */
function RainLayer() {
  const drops = DROPS.map((d, i) => (
    <i
      key={i}
      style={{
        left: `${d.x}%`,
        height: `${d.h}px`,
        opacity: d.o,
        animationDuration: `${d.dur}s`,
        animationDelay: `-${d.delay}s`,
      }}
    />
  ))
  return <div className="rain">{drops}</div>
}

/** Hand-tuned so the rain reads as weather, not as a screensaver. */
const DROPS = [
  { x: 6, h: 48, o: 0.22, dur: 2.6, delay: 0.2 },
  { x: 13, h: 70, o: 0.16, dur: 3.4, delay: 1.1 },
  { x: 21, h: 40, o: 0.26, dur: 2.2, delay: 0.6 },
  { x: 29, h: 62, o: 0.14, dur: 3.9, delay: 2.0 },
  { x: 37, h: 44, o: 0.2, dur: 2.9, delay: 1.5 },
  { x: 44, h: 76, o: 0.12, dur: 4.2, delay: 0.4 },
  { x: 52, h: 38, o: 0.24, dur: 2.4, delay: 2.4 },
  { x: 61, h: 58, o: 0.17, dur: 3.2, delay: 0.9 },
  { x: 68, h: 42, o: 0.22, dur: 2.7, delay: 1.8 },
  { x: 76, h: 72, o: 0.13, dur: 4.0, delay: 0.3 },
  { x: 83, h: 46, o: 0.2, dur: 2.5, delay: 2.2 },
  { x: 91, h: 64, o: 0.15, dur: 3.6, delay: 1.3 },
  { x: 96, h: 36, o: 0.23, dur: 2.3, delay: 0.7 },
]

export const Ambient = memo(AmbientBase)
