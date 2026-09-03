import { useEffect, useRef, useState } from 'react'

export interface TypewriterState {
  /** fully typed lines */
  done: string[]
  /** the line currently being typed (partial) */
  current: string
  /** true once every line has finished */
  finished: boolean
  /** index of the line currently being typed */
  lineIndex: number
}

interface Options {
  /** ms per character */
  speed?: number
  /** pause between lines */
  lineDelay?: number
  /** pause before starting */
  startDelay?: number
  /** skip the animation entirely */
  instant?: boolean
  onDone?: () => void
  /** restart whenever this value changes */
  resetKey?: unknown
}

/**
 * useTypewriter — types an array of lines out, one character at a time.
 * Returns a stable snapshot so callers can render `done` + `current`.
 *
 * Uses a single rAF-driven timer; safe to unmount mid-animation.
 */
export function useTypewriter(lines: string[], opts: Options = {}): TypewriterState {
  const { speed = 22, lineDelay = 260, startDelay = 0, instant = false, onDone, resetKey } = opts

  const [state, setState] = useState<TypewriterState>(() => ({
    done: instant ? lines : [],
    current: '',
    finished: instant,
    lineIndex: instant ? lines.length : 0,
  }))

  const doneRef = useRef<() => void>(() => {})
  doneRef.current = () => onDone?.()

  const joined = lines.join('\u0000')

  useEffect(() => {
    if (instant) {
      setState({ done: lines, current: '', finished: true, lineIndex: lines.length })
      const t = setTimeout(() => doneRef.current(), 0)
      return () => clearTimeout(t)
    }
    if (!lines.length) {
      setState({ done: [], current: '', finished: true, lineIndex: 0 })
      return
    }

    let cancelled = false
    let lineIdx = 0
    let charIdx = 0
    let timer: number | undefined

    setState({ done: [], current: '', finished: false, lineIndex: 0 })

    const tick = () => {
      if (cancelled) return
      if (lineIdx >= lines.length) {
        setState((s) => ({ ...s, current: '', finished: true }))
        doneRef.current()
        return
      }
      const line = lines[lineIdx]
      charIdx += 1
      if (charIdx >= line.length) {
        const finishedLines = lines.slice(0, lineIdx + 1)
        setState({ done: finishedLines, current: '', finished: false, lineIndex: lineIdx + 1 })
        lineIdx += 1
        charIdx = 0
        timer = window.setTimeout(tick, lineDelay)
      } else {
        setState((s) => ({ ...s, current: line.slice(0, charIdx), finished: false, lineIndex: lineIdx }))
        timer = window.setTimeout(tick, speed)
      }
    }

    timer = window.setTimeout(tick, startDelay)
    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [joined, instant, speed, lineDelay, startDelay, resetKey])

  return state
}
