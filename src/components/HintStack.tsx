import { useState } from 'react'
import { useGame } from '@/hooks/useGame'
import { CHALLENGE_BY_ID, type ChallengeId } from '@/data/challenges'
import { sfx } from '@/utils/sound'

const HINT_LABELS = ['HINT 01 // subtle', 'HINT 02 // specific', 'HINT 03 // very helpful']

interface HintStackProps {
  id: ChallengeId
}

/**
 * HintStack — three escalating hints per challenge.
 * Hints are free, tracked but never penalised. This is a birthday present,
 * not a scored scoreboard.
 */
export function HintStack({ id }: HintStackProps) {
  const { hintsFor, useHint } = useGame()
  const challenge = CHALLENGE_BY_ID[id]
  const revealed = hintsFor(id)
  const [open, setOpen] = useState(false)

  const next = () => {
    if (revealed >= 3) return
    useHint(id)
    sfx.open()
  }

  return (
    <div className={`hintstack ${open ? 'is-open' : ''}`}>
      <button
        type="button"
        className="hintstack__toggle mono"
        onClick={() => {
          setOpen((o) => !o)
          sfx.key()
        }}
        aria-expanded={open}
      >
        <span className="hintstack__chev" aria-hidden="true">
          {open ? '▾' : '▸'}
        </span>
        HINTS
        <span className="hintstack__count">{revealed}/3</span>
      </button>

      {open && (
        <div className="hintstack__body">
          {challenge.hints.slice(0, revealed).map((h, i) => (
            <div className="hintstack__item rise" key={i}>
              <span className="hintstack__label mono">{HINT_LABELS[i]}</span>
              <p>{h}</p>
            </div>
          ))}

          {revealed < 3 ? (
            <button type="button" className="btn btn-sm hintstack__next" onClick={next}>
              {revealed === 0 ? 'REVEAL FIRST HINT' : 'REVEAL NEXT HINT'}
            </button>
          ) : (
            <p className="hintstack__done mono faint">
              All three spent. No penalty, no score, no judgement — it's your birthday.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
