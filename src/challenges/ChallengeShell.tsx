import type { ReactNode } from 'react'
import { CHALLENGE_BY_ID, canonicalAnswer, type ChallengeId } from '@/data/challenges'
import { useGame } from '@/hooks/useGame'
import { buildFlag } from '@/utils/flags'
import { FlagSubmit } from '@/components/FlagSubmit'
import { HintStack } from '@/components/HintStack'
import { DotMatrix } from '@/components/ui/DotMatrix'

interface ChallengeShellProps {
  id: ChallengeId
  children: ReactNode
  /** rendered under the interface, above the submit field */
  footer?: ReactNode
  /** hide the submit field (used by the finale) */
  hideSubmit?: boolean
  onSolved?: () => void
}

/**
 * ChallengeShell — the shared frame every memory panel lives in.
 * Header, in-fiction opening, the challenge's own interface, hints, submit,
 * and the recovered-memory readout once it is solved.
 */
export function ChallengeShell({ id, children, footer, hideSubmit = false }: ChallengeShellProps) {
  const { isSolved } = useGame()
  const c = CHALLENGE_BY_ID[id]
  const solved = isSolved(id)

  return (
    <article className={`challenge ${solved ? 'challenge--solved' : ''}`} id={`challenge-${id}`}>
      <header className="challenge__head">
        <div className="challenge__idrow">
          <span className="challenge__label mono accent">{c.label}</span>
          <span className="challenge__sep mono faint" aria-hidden="true">
            //
          </span>
          <span className="challenge__cat mono faint">{c.category}</span>
          <span className="challenge__pts mono">{c.points} PTS</span>
        </div>
        <h2 className="challenge__title">
          <DotMatrix text={c.title} />
        </h2>
        <div className="challenge__mech mono faint">
          MECHANISM · {c.mechanism}
        </div>
      </header>

      {!solved && (
        <div className="challenge__opening">
          {c.opening.map((line, i) => (
            <p key={i} className={`challenge__poem rise d${i + 1}`}>
              {line}
            </p>
          ))}
        </div>
      )}

      <div className="challenge__body">{children}</div>

      {footer}

      {solved ? (
        <div className="recovered rise">
          <div className="recovered__bar mono">✓ {c.label} RECOVERED</div>
          <div className="recovered__body">
            <div className="recovered__headline mono">{c.solvedHeadline}</div>
            {c.solvedLines.map((l, i) => (
              <div key={i} className="recovered__line mono">
                {l}
              </div>
            ))}
            <div className="recovered__flag mono">{buildFlag(canonicalAnswer(id))}</div>
            <p className="recovered__note">{c.solvedNote}</p>
          </div>
        </div>
      ) : (
        !hideSubmit && (
          <div className="challenge__submit">
            <FlagSubmit targetId={id} />
            <HintStack id={id} />
          </div>
        )
      )}
    </article>
  )
}
