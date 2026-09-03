import { useGame, type Phase } from '@/hooks/useGame'

const PREV: Partial<Record<Phase, Phase>> = {
  protocol: 'landing',
  ctf: 'protocol',
  reveal: 'ctf',
}

const LABEL: Record<Phase, string> = {
  landing: 'the beginning',
  protocol: 'the briefing',
  ctf: 'the system',
  reveal: 'the ending',
}

/**
 * BackLink — one step back through the phases.
 *
 * The story is linear on purpose, but nobody should ever feel trapped in it.
 * This walks back a single phase and touches nothing else: solved memories,
 * hints and M.I.A.'s state all stay exactly where they were.
 */
export function BackLink({ inline = false }: { inline?: boolean }) {
  const { phase, setPhase } = useGame()
  const to = PREV[phase]
  if (!to) return null
  return (
    <button
      type="button"
      className={`backlink mono${inline ? ' backlink--inline' : ''}`}
      onClick={() => setPhase(to)}
      aria-label={`Go back to ${LABEL[to]}`}
    >
      ← {LABEL[to]}
    </button>
  )
}
