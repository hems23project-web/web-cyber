import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTypewriter } from '@/hooks/useTypewriter'
import { useGame } from '@/hooks/useGame'
import { mia } from '@/ai/mia'
import { DISPLAY_DATES } from '@/data/birthdayConfig'
import { sfx } from '@/utils/sound'

/**
 * FinalSequence — the hand-off from CTF to birthday.
 *
 * The interface drops away, M.I.A. says the last thing she has to say, and
 * then the light comes up. Auto-advances the first time; after that it becomes
 * a button so revisiting MEMORY 07 never yanks you off the page.
 */
export function FinalSequence() {
  const { goReveal, state } = useGame()
  const [stage, setStage] = useState<'dark' | 'bloom'>('dark')
  const seenBefore = state.visited.includes('reveal')

  const lines = [...mia.finalLines(), ...mia.farewell()]
  const [typed, setTyped] = useState(seenBefore)

  const tw = useTypewriter(lines, {
    speed: 24,
    lineDelay: 380,
    startDelay: 420,
    instant: state.reduceMotion || seenBefore,
    onDone: () => setTyped(true),
  })

  useEffect(() => {
    if (!typed || seenBefore) return
    const t1 = setTimeout(() => {
      setStage('bloom')
      sfx.finale()
    }, 900)
    const t2 = setTimeout(goReveal, 2400)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [typed, seenBefore, goReveal])

  // Portal to <body>: the finale must never be clipped by an ancestor's
  // overflow or affected by a stacking context inside the challenge card.
  return createPortal(
    <div className={`finale finale--${stage}`} role="dialog" aria-modal="true" aria-label="Final memory recovered">
      <div className="finale__bloom" aria-hidden="true" />
      <div className="finale__inner">
        <div className="finale__sys mono">
          <span>&gt; record 07 :: accepted</span>
          <span>&gt; memory core :: complete</span>
          <span className="accent">&gt; {DISPLAY_DATES.hisBirthday}</span>
        </div>

        <div className="finale__lines">
          {seenBefore
            ? lines.map((l, i) => (
                <p key={i} className={`finale__line ${i < 4 ? 'finale__line--big' : 'finale__line--sys mono'}`}>
                  {l}
                </p>
              ))
            : tw.done.map((l, i) => (
                <p
                  key={i}
                  className={`finale__line rise ${i < 4 ? 'finale__line--big' : 'finale__line--sys mono'}`}
                >
                  {l}
                </p>
              ))}
          {!seenBefore && !tw.finished && tw.current && <p className="finale__line finale__line--big caret">{tw.current}</p>}
        </div>

        {typed && (
          <button type="button" className="btn btn-primary btn-lg finale__go rise" onClick={goReveal}>
            {seenBefore ? 'RETURN TO THE ENDING →' : 'CONTINUE →'}
          </button>
        )}
      </div>
    </div>,
    document.body,
  )
}
