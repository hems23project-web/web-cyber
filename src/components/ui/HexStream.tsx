import { useMemo } from 'react'
import { seededRandom } from '@/utils/format'

interface HexStreamProps {
  /** deterministic seed — same seed renders the same stream */
  seed?: string
  count?: number
  className?: string
  /** 'hex' | 'bin' | 'mixed' */
  mode?: 'hex' | 'bin' | 'mixed'
}

const HEXCHARS = '0123456789abcdef'

function token(rand: () => number, mode: 'hex' | 'bin' | 'mixed'): string {
  const kind = mode === 'mixed' ? (rand() > 0.5 ? 'hex' : 'bin') : mode
  if (kind === 'bin') {
    let s = ''
    for (let i = 0; i < 8; i++) s += rand() > 0.5 ? '1' : '0'
    return s
  }
  let s = '0x'
  for (let i = 0; i < 2; i++) s += HEXCHARS[Math.floor(rand() * 16)]
  return s
}

/**
 * HexStream — tiny hexadecimal / binary decorations, scattered and faint.
 * Deterministic per seed so layout never jitters between renders.
 */
export function HexStream({ seed = 'mi', count = 22, className = '', mode = 'mixed' }: HexStreamProps) {
  const items = useMemo(() => {
    const rand = seededRandom(seed)
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      text: token(rand, mode),
      x: rand() * 100,
      y: rand() * 100,
      size: 9 + rand() * 3,
      opacity: 0.06 + rand() * 0.14,
      drift: 18 + rand() * 40,
      delay: -rand() * 30,
    }))
  }, [seed, count, mode])

  return (
    <div className={`hexstream ${className}`} aria-hidden="true">
      {items.map((it) => (
        <span
          key={it.id}
          className="hexstream__t"
          style={{
            left: `${it.x}%`,
            top: `${it.y}%`,
            fontSize: `${it.size}px`,
            opacity: it.opacity,
            animationDuration: `${it.drift}s`,
            animationDelay: `${it.delay}s`,
          }}
        >
          {it.text}
        </span>
      ))}
    </div>
  )
}
