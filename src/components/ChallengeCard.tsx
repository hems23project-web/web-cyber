import { CHALLENGE_BY_ID, FRAGMENT_IDS, type ChallengeId } from '@/data/challenges'
import { useGame } from '@/hooks/useGame'
import { sfx } from '@/utils/sound'

interface ChallengeCardProps {
  id: ChallengeId
  onOpen: (id: ChallengeId) => void
  className?: string
}

/**
 * One row in the memory-fragment list.
 * Shows state (SEALED / ACTIVE / RECOVERED) and what it is waiting on —
 * never anything about the answer.
 */
export function ChallengeCard({ id, onOpen, className = '' }: ChallengeCardProps) {
  const { isSolved, isOpen } = useGame()
  const c = CHALLENGE_BY_ID[id]
  const solved = isSolved(id)
  const open = isOpen(id)
  const status = solved ? 'RECOVERED' : open ? 'ACTIVE' : 'SEALED'

  const blockers = c.requires.filter((r) => !isSolved(r)).map((r) => CHALLENGE_BY_ID[r].label)

  return (
    <li className={className}>
      <button
        type="button"
        className={`ccard ccard--${status.toLowerCase()} ${c.final ? 'ccard--final' : ''}`}
        disabled={!open}
        onClick={() => {
          sfx.open()
          onOpen(id)
        }}
        aria-label={`${c.label} — ${c.title} — ${status}`}
      >
        <span className="ccard__index mono">{String(c.index).padStart(2, '0')}</span>

        <span className="ccard__main">
          <span className="ccard__label mono">{c.label}</span>
          <span className="ccard__title">
            {open ? c.title : <span className="ccard__title--locked">{'▮'.repeat(Math.min(c.title.length, 14))}</span>}
          </span>
          <span className="ccard__meta mono faint">
            {c.category} · {c.points} PTS · {c.mechanism}
          </span>
        </span>

        <span className="ccard__right">
          {solved ? (
            <span className="ccard__status ccard__status--ok mono">✓ RECOVERED</span>
          ) : open ? (
            <span className="ccard__status ccard__status--active mono">
              OPEN <span aria-hidden="true">→</span>
            </span>
          ) : (
            <span className="ccard__status ccard__status--locked mono" title={`requires ${blockers.join(', ')}`}>
              🔒{' '}
              {blockers.length === 0
                ? 'SEALED'
                : blockers.length > 2
                  ? `SEALED · ${blockers.length} PREREQS`
                  : `NEEDS ${blockers.join(' + ')}`}
            </span>
          )}
        </span>
      </button>
    </li>
  )
}

/** The six fragments, plus the sealed core when it is due. */
export const HUB_IDS: ChallengeId[] = [...FRAGMENT_IDS, 'mem07']
