import { useCallback, useEffect, useRef, useState } from 'react'
import { useGame, type SubmitResult } from '@/hooks/useGame'
import { CHALLENGE_BY_ID, canonicalAnswer, type ChallengeId } from '@/data/challenges'
import { buildFlag } from '@/utils/flags'
import type { Verdict } from '@/utils/flags'
import { sfx } from '@/utils/sound'

interface FlagSubmitProps {
  /** when set, the submission is verified against this challenge only */
  targetId?: ChallengeId
  /** fired after any submission */
  onResult?: (r: SubmitResult) => void
  compact?: boolean
  label?: string
  autoFocus?: boolean
  disabled?: boolean
}

const VERDICT_TONE: Record<Verdict, string> = {
  CORRECT: 'ok',
  ALREADY: 'warn',
  LOCKED: 'warn',
  MALFORMED: 'err',
  INCORRECT: 'err',
}

const VERDICT_TAG: Record<Verdict, string> = {
  CORRECT: 'ACCEPTED',
  ALREADY: 'DUPLICATE',
  LOCKED: 'SEALED',
  MALFORMED: 'MALFORMED',
  INCORRECT: 'REJECTED',
}

/**
 * FlagSubmit — the one place flags are verified.
 * Error copy never contains the answer. Success prints the canonical flag.
 */
export function FlagSubmit({
  targetId,
  onResult,
  compact = false,
  label = 'SUBMIT FLAG',
  autoFocus = false,
  disabled = false,
}: FlagSubmitProps) {
  const { submit, isSolved } = useGame()
  const [value, setValue] = useState('')
  const [result, setResult] = useState<SubmitResult | null>(null)
  const [shake, setShake] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const refocus = useRef(false)

  // The row is re-keyed so the shake animation replays; that remounts the
  // input, so focus has to be restored after the new one lands.
  useEffect(() => {
    if (!refocus.current) return
    refocus.current = false
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [shake])

  const alreadySolved = targetId ? isSolved(targetId) : false

  const go = useCallback(() => {
    const raw = value.trim()
    if (!raw) {
      setResult({ verdict: 'INCORRECT', id: null, flag: null, lines: ['Nothing to verify.'], final: false })
      setShake((s) => s + 1)
      return
    }
    const r = submit(raw, targetId)
    setResult(r)
    onResult?.(r)
    if (r.verdict === 'CORRECT' || r.verdict === 'ALREADY') {
      setValue('')
    } else {
      refocus.current = true
      setShake((s) => s + 1)
    }
  }, [onResult, submit, targetId, value])

  const solvedFlag = targetId && alreadySolved ? buildFlag(canonicalAnswer(targetId)) : null

  return (
    <div className={`flagsubmit ${compact ? 'flagsubmit--compact' : ''}`}>
      <div className="flagsubmit__label mono">
        <span>{label}</span>
        {targetId && (
          <span className="flagsubmit__meta faint">
            {CHALLENGE_BY_ID[targetId].label} · {CHALLENGE_BY_ID[targetId].points} pts
          </span>
        )}
      </div>

      <div className="flagsubmit__row" key={shake} data-shake={shake}>
        <span className="flagsubmit__prefix mono" aria-hidden="true">
          FLAG&#123;
        </span>
        <input
          ref={inputRef}
          className="flagsubmit__input mono"
          type="text"
          spellCheck={false}
          autoCapitalize="characters"
          autoComplete="off"
          autoCorrect="off"
          autoFocus={autoFocus}
          disabled={disabled || alreadySolved}
          value={value}
          placeholder={alreadySolved ? 'recovered' : 'ANSWER_IN_UPPER_SNAKE_CASE'}
          aria-label="Flag answer"
          onChange={(e) => {
            setValue(e.target.value)
            if (e.target.value.length % 4 === 0) sfx.key()
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              go()
            }
          }}
        />
        <span className="flagsubmit__suffix mono" aria-hidden="true">
          &#125;
        </span>
        <button type="button" className="btn btn-primary btn-sm" onClick={go} disabled={disabled || alreadySolved}>
          VERIFY
        </button>
      </div>

      {result && (
        <div className={`flagfeedback flagfeedback--${VERDICT_TONE[result.verdict]}`} role="status" aria-live="polite">
          <span className="flagfeedback__tag mono">{VERDICT_TAG[result.verdict]}</span>
          <div className="flagfeedback__lines">
            {result.lines.map((l, i) => (
              <div key={i} className="mono">
                {l}
              </div>
            ))}
            {result.verdict === 'CORRECT' && result.flag && (
              <div className="flagfeedback__flag mono">{result.flag}</div>
            )}
            {result.verdict === 'ALREADY' && result.flag && (
              <div className="flagfeedback__flag mono faint">{result.flag}</div>
            )}
          </div>
        </div>
      )}

      {solvedFlag && !result && (
        <div className="flagfeedback flagfeedback--ok mono">
          <span className="flagfeedback__tag">RECOVERED</span>
          <div className="flagfeedback__flag">{solvedFlag}</div>
        </div>
      )}
    </div>
  )
}
