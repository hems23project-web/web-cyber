import type { ElementType, ReactNode } from 'react'
import { useTypewriter } from '@/hooks/useTypewriter'
import { useGame } from '@/hooks/useGame'

interface TypeWriterProps {
  lines: string[]
  as?: ElementType
  className?: string
  lineClassName?: string
  speed?: number
  lineDelay?: number
  startDelay?: number
  /** render a blinking caret on the active line */
  caret?: boolean
  onDone?: () => void
  resetKey?: unknown
  /** render a prefix (e.g. "> ") before every line */
  prefix?: string
  children?: ReactNode
}

/** Types out `lines`, respecting the global reduce-motion setting. */
export function TypeWriter({
  lines,
  as: Tag = 'div',
  className,
  lineClassName,
  speed = 22,
  lineDelay = 240,
  startDelay = 0,
  caret = true,
  onDone,
  resetKey,
  prefix,
}: TypeWriterProps) {
  const { state } = useGame()
  const instant = state.reduceMotion
  const tw = useTypewriter(lines, { speed, lineDelay, startDelay, instant, onDone, resetKey })

  return (
    <Tag className={className}>
      {tw.done.map((l, i) => (
        <div key={i} className={lineClassName}>
          {prefix}
          {l}
        </div>
      ))}
      {!tw.finished && tw.current !== '' && (
        <div className={`${lineClassName ?? ''} ${caret ? 'caret' : ''}`.trim()}>
          {prefix}
          {tw.current}
        </div>
      )}
      {!tw.finished && tw.current === '' && caret && lines.length > 0 && (
        <div className={`${lineClassName ?? ''} caret`.trim()} aria-hidden="true">
          {prefix}
        </div>
      )}
    </Tag>
  )
}
