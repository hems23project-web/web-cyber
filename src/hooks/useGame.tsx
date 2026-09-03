import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import {
  CHALLENGES,
  CHALLENGE_BY_ID,
  FRAGMENT_IDS,
  TOTAL_FRAGMENTS,
  canonicalAnswer,
  type ChallengeId,
} from '@/data/challenges'
import { buildFlag, isUnlocked, matchAny, parseSubmission, verifyAgainst, type Verdict } from '@/utils/flags'
import { FLAG_FEEDBACK, HUD, MIA } from '@/data/birthdayConfig'
import { makeMessage, mia, type ChatMessage, type MiaContext } from '@/ai/mia'
import { sfx, setSoundEnabled } from '@/utils/sound'

/* -------------------------------------------------------------------------- */

export type Phase = 'landing' | 'protocol' | 'ctf' | 'reveal'
export type AiCore = 'LOCKED' | 'ONLINE' | 'UNLOCKED'

const STORAGE_KEY = 'mi-birthday-protocol:v1'
const STATE_VERSION = 1
const CHAT_CAP = 90

export interface PersistedState {
  version: number
  phase: Phase
  solved: ChallengeId[]
  solvedAt: Partial<Record<ChallengeId, number>>
  hints: Partial<Record<ChallengeId, number>>
  attempts: Partial<Record<ChallengeId, number>>
  chat: ChatMessage[]
  miaTurn: number
  startedAt: number | null
  finishedAt: number | null
  revealUnlocked: boolean
  sound: boolean
  reduceMotion: boolean
  visited: Phase[]
}

/**
 * Honour the OS accessibility preference on first load. Once the player has
 * used the in-app toggle their choice is persisted and wins from then on.
 */
function prefersReducedMotion(): boolean {
  try {
    return (
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches === true
    )
  } catch {
    return false
  }
}

const initialState = (): PersistedState => ({
  version: STATE_VERSION,
  phase: 'landing',
  solved: [],
  solvedAt: {},
  hints: {},
  attempts: {},
  chat: [],
  miaTurn: 0,
  startedAt: null,
  finishedAt: null,
  revealUnlocked: false,
  sound: false,
  reduceMotion: prefersReducedMotion(),
  visited: [],
})

function load(): PersistedState {
  if (typeof window === 'undefined') return initialState()
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return initialState()
    const parsed = JSON.parse(raw) as Partial<PersistedState>
    if (parsed.version !== STATE_VERSION) return initialState()
    const base = initialState()
    const merged: PersistedState = {
      ...base,
      ...parsed,
      solved: (parsed.solved ?? []).filter((id): id is ChallengeId => Boolean(CHALLENGE_BY_ID[id])),
      chat: Array.isArray(parsed.chat) ? parsed.chat.slice(-CHAT_CAP) : [],
      visited: parsed.visited ?? [],
    }
    return merged
  } catch {
    return initialState()
  }
}

function save(state: PersistedState) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    /* private mode / quota — the game still works, it just won't persist */
  }
}

/* -------------------------------------------------------------------------- */

export interface SubmitResult {
  verdict: Verdict
  id: ChallengeId | null
  /** the canonical flag, only ever populated on CORRECT / ALREADY */
  flag: string | null
  lines: string[]
  final: boolean
}

interface GameApi {
  state: PersistedState
  phase: Phase
  solved: ChallengeId[]
  solvedCount: number
  totalCount: number
  progressPct: number
  aiCore: AiCore
  hintsUsed: number
  isSolved: (id: ChallengeId) => boolean
  isOpen: (id: ChallengeId) => boolean
  hintsFor: (id: ChallengeId) => number
  attemptsFor: (id: ChallengeId) => number
  chat: ChatMessage[]

  begin: () => void
  enterSystem: () => void
  setPhase: (p: Phase) => void
  goReveal: () => void
  backToHub: () => void

  submit: (raw: string, targetId?: ChallengeId) => SubmitResult
  useHint: (id: ChallengeId) => number
  toggleSound: () => void
  toggleMotion: () => void
  reset: () => void

  sendToMia: (text: string) => Promise<void>
  pushMiaLines: (lines: string[], role?: ChatMessage['role']) => void
  requestMem03Clue: () => void
  clearChat: () => void
}

const GameContext = createContext<GameApi | null>(null)

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PersistedState>(load)
  const stateRef = useRef(state)
  stateRef.current = state

  /* persist ------------------------------------------------------------- */
  useEffect(() => {
    save(state)
  }, [state])

  useEffect(() => {
    setSoundEnabled(state.sound)
  }, [state.sound])

  const patch = useCallback((fn: (prev: PersistedState) => Partial<PersistedState>) => {
    setState((prev) => ({ ...prev, ...fn(prev) }))
  }, [])

  /* derived ------------------------------------------------------------- */
  const solved = state.solved
  const solvedCount = useMemo(
    () => FRAGMENT_IDS.filter((id) => solved.includes(id)).length,
    [solved],
  )
  const progressPct = Math.round((solvedCount / TOTAL_FRAGMENTS) * 100)

  const aiCore: AiCore = useMemo(() => {
    if (solvedCount >= TOTAL_FRAGMENTS) return 'UNLOCKED'
    if (solved.includes('mem02')) return 'ONLINE'
    return 'LOCKED'
  }, [solved, solvedCount])

  const hintsUsed = useMemo(
    () => Object.values(state.hints).reduce<number>((a, b) => a + (b ?? 0), 0),
    [state.hints],
  )

  const miaCtx = useMemo<MiaContext>(
    () => ({
      solved,
      hintsUsed,
      attempts: Object.values(state.attempts).reduce<number>((a, b) => a + (b ?? 0), 0),
      turn: state.miaTurn,
    }),
    [solved, hintsUsed, state.attempts, state.miaTurn],
  )

  /* chat ---------------------------------------------------------------- */
  const pushChat = useCallback(
    (msg: ChatMessage) => {
      patch((prev) => ({ chat: [...prev.chat, msg].slice(-CHAT_CAP) }))
    },
    [patch],
  )

  const pushMiaLines = useCallback(
    (lines: string[], role: ChatMessage['role'] = 'mia') => {
      if (!lines.length) return
      pushChat(makeMessage(role, lines))
    },
    [pushChat],
  )

  /* navigation ---------------------------------------------------------- */
  const markVisited = (prev: PersistedState, p: Phase) =>
    prev.visited.includes(p) ? prev.visited : [...prev.visited, p]

  const begin = useCallback(() => {
    sfx.open()
    patch((prev) => ({ phase: 'protocol', visited: markVisited(prev, 'protocol') }))
  }, [patch])

  const enterSystem = useCallback(() => {
    sfx.unlock()
    patch((prev) => ({
      phase: 'ctf',
      startedAt: prev.startedAt ?? Date.now(),
      visited: markVisited(prev, 'ctf'),
    }))
  }, [patch])

  const setPhase = useCallback(
    (p: Phase) => patch((prev) => ({ phase: p, visited: markVisited(prev, p) })),
    [patch],
  )

  const goReveal = useCallback(() => {
    sfx.finale()
    patch((prev) => ({ phase: 'reveal', revealUnlocked: true, visited: markVisited(prev, 'reveal') }))
  }, [patch])

  const backToHub = useCallback(() => {
    patch((prev) => ({ phase: prev.revealUnlocked ? 'ctf' : 'ctf' }))
  }, [patch])

  /* hints --------------------------------------------------------------- */
  const useHint = useCallback(
    (id: ChallengeId) => {
      const next = Math.min(3, (stateRef.current.hints[id] ?? 0) + 1)
      patch((prev) => ({ hints: { ...prev.hints, [id]: Math.min(3, (prev.hints[id] ?? 0) + 1) } }))
      sfx.key()
      return next
    },
    [patch],
  )

  /* M.I.A. -------------------------------------------------------------- */
  const sendToMia = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (!trimmed) return
      pushChat(makeMessage('player', [trimmed]))
      patch((prev) => ({ miaTurn: prev.miaTurn + 1 }))
      sfx.mia()
      const { lines } = await mia.ask(trimmed, miaCtx)
      pushChat(makeMessage('mia', lines))
    },
    [miaCtx, patch, pushChat],
  )

  const requestMem03Clue = useCallback(() => {
    pushChat(makeMessage('player', ['Give me the clue you are holding.']))
    pushChat(makeMessage('mia', mia.mem03Clue()))
    sfx.mia()
  }, [pushChat])

  const clearChat = useCallback(() => patch(() => ({ chat: [] })), [patch])

  /* submission ---------------------------------------------------------- */
  const submit = useCallback(
    (raw: string, targetId?: ChallengeId): SubmitResult => {
      const parsed = parseSubmission(raw)
      if (!parsed.token) {
        return { verdict: 'INCORRECT', id: null, flag: null, lines: [FLAG_FEEDBACK.empty], final: false }
      }

      const prev = stateRef.current
      const result = targetId ? { id: targetId, verdict: verifyAgainst(targetId, raw, prev.solved) } : matchAny(raw, prev.solved)

      if (!result) {
        return { verdict: 'INCORRECT', id: null, flag: null, lines: [...FLAG_FEEDBACK.incorrect], final: false }
      }

      const { id, verdict } = result

      if (verdict === 'CORRECT') {
        const challenge = CHALLENGE_BY_ID[id]
        const flag = buildFlag(canonicalAnswer(id))
        const now = Date.now()

        sfx.correct()

        patch((p) => ({
          solved: [...p.solved, id],
          solvedAt: { ...p.solvedAt, [id]: now },
          finishedAt: challenge.final ? now : p.finishedAt,
          revealUnlocked: p.revealUnlocked || Boolean(challenge.final),
        }))

        const lines: string[] = [FLAG_FEEDBACK.correct]

        // M.I.A. progression — she wakes up on mem02 and comments from then on.
        const wakeUp = challenge.unlocksAI && !prev.solved.includes('mem02')
        if (wakeUp) {
          setTimeout(() => {
            pushChat(makeMessage('system', [...mia.bootLines()]))
            pushChat(makeMessage('mia', mia.greeting()))
            pushMiaLines(mia.progressionFor(id))
            sfx.unlock()
          }, 450)
        } else if (prev.solved.includes('mem02')) {
          const reaction = mia.reactionFor(id)
          const progression = mia.progressionFor(id)
          setTimeout(() => {
            if (reaction.length) pushMiaLines(reaction)
            if (progression.length) pushMiaLines(progression)
          }, 450)
        }

        return { verdict, id, flag, lines, final: Boolean(challenge.final) }
      }

      if (verdict === 'ALREADY') {
        sfx.open()
        return {
          verdict,
          id,
          flag: buildFlag(canonicalAnswer(id)),
          lines: [FLAG_FEEDBACK.already],
          final: false,
        }
      }

      if (verdict === 'LOCKED') {
        sfx.error()
        return { verdict, id, flag: null, lines: [FLAG_FEEDBACK.tooEarly], final: false }
      }

      if (verdict === 'MALFORMED') {
        sfx.error()
        return { verdict, id, flag: null, lines: [FLAG_FEEDBACK.malformed], final: false }
      }

      sfx.error()
      patch((p) => ({ attempts: { ...p.attempts, [id]: (p.attempts[id] ?? 0) + 1 } }))
      const n = (prev.attempts[id] ?? 0) + 1
      const lines: string[] = [...FLAG_FEEDBACK.incorrect]
      if (n >= 3) {
        lines.push('Three attempts on this one. The hints are free — nobody is scoring you.')
      }
      return { verdict, id, flag: null, lines, final: false }
    },
    [patch, pushChat, pushMiaLines],
  )

  /* misc ---------------------------------------------------------------- */
  const toggleSound = useCallback(() => {
    patch((prev) => {
      const sound = !prev.sound
      if (sound) {
        setSoundEnabled(true)
        setTimeout(() => sfx.open(), 30)
      }
      return { sound }
    })
  }, [patch])

  const toggleMotion = useCallback(() => patch((prev) => ({ reduceMotion: !prev.reduceMotion })), [patch])

  const reset = useCallback(() => {
    try {
      window.localStorage.removeItem(STORAGE_KEY)
    } catch {
      /* ignore */
    }
    setState({ ...initialState(), reduceMotion: stateRef.current.reduceMotion })
  }, [])

  /* derived helpers ----------------------------------------------------- */
  const isSolved = useCallback((id: ChallengeId) => solved.includes(id), [solved])
  const isOpen = useCallback((id: ChallengeId) => isUnlocked(id, solved), [solved])
  const hintsFor = useCallback((id: ChallengeId) => state.hints[id] ?? 0, [state.hints])
  const attemptsFor = useCallback((id: ChallengeId) => state.attempts[id] ?? 0, [state.attempts])

  const api = useMemo<GameApi>(
    () => ({
      state,
      phase: state.phase,
      solved,
      solvedCount,
      totalCount: TOTAL_FRAGMENTS,
      progressPct,
      aiCore,
      hintsUsed,
      isSolved,
      isOpen,
      hintsFor,
      attemptsFor,
      chat: state.chat,

      begin,
      enterSystem,
      setPhase,
      goReveal,
      backToHub,

      submit,
      useHint,
      toggleSound,
      toggleMotion,
      reset,

      sendToMia,
      pushMiaLines,
      requestMem03Clue,
      clearChat,
    }),
    [
      state,
      solved,
      solvedCount,
      progressPct,
      aiCore,
      hintsUsed,
      isSolved,
      isOpen,
      hintsFor,
      attemptsFor,
      begin,
      enterSystem,
      setPhase,
      goReveal,
      backToHub,
      submit,
      useHint,
      toggleSound,
      toggleMotion,
      reset,
      sendToMia,
      pushMiaLines,
      requestMem03Clue,
      clearChat,
    ],
  )

  return <GameContext.Provider value={api}>{children}</GameContext.Provider>
}

export function useGame(): GameApi {
  const ctx = useContext(GameContext)
  if (!ctx) throw new Error('useGame must be used inside <GameProvider>')
  return ctx
}

/* -------------------------------------------------------------------------- */
/* Small conveniences used by the HUD and hub                                  */
/* -------------------------------------------------------------------------- */

export function useOrderedChallenges() {
  return CHALLENGES
}

export function aiCoreLabel(core: AiCore): string {
  return core === 'LOCKED' ? HUD.aiLocked : core === 'ONLINE' ? HUD.aiOnline : HUD.aiUnlocked
}

export { MIA }
