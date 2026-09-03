/**
 * flags.ts — normalised flag comparison.
 *
 * The accepted answers are unsealed at runtime from `data/challenges.ts` and
 * normalised before comparison, so casing, spacing, separators and the
 * FLAG{...} wrapper are all forgiving — while still only accepting the
 * intended answers.
 *
 * Error paths never leak the correct answer.
 */

import { CHALLENGES, CHALLENGE_BY_ID, acceptedAnswers, type ChallengeId } from '@/data/challenges'

export const FLAG_PREFIX = 'FLAG{'
export const FLAG_SUFFIX = '}'

export type Verdict = 'CORRECT' | 'ALREADY' | 'LOCKED' | 'MALFORMED' | 'INCORRECT'

/** "Trivandrum ILP" / "27/09/2025" → "TRIVANDRUM_ILP" / "27_09_2025" */
export function toFlagToken(answer: string): string {
  return answer
    .toUpperCase()
    .trim()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

/** Build a displayable flag from an answer. Never appears as a literal in source. */
export function buildFlag(answer: string): string {
  return FLAG_PREFIX + toFlagToken(answer) + FLAG_SUFFIX
}

const WRAPPED = /^\s*flag\s*[\{[(<]\s*([\s\S]*?)\s*[\}\])>]\s*$/i

export interface ParsedSubmission {
  token: string
  hadWrapper: boolean
  /** looked like a flag but the wrapper was never closed */
  malformed: boolean
  raw: string
}

export function parseSubmission(raw: string): ParsedSubmission {
  const trimmed = raw.trim()
  const match = trimmed.match(WRAPPED)
  const inner = match ? match[1] : trimmed
  const mentionsFlag = /^[\s\W]*flag/i.test(trimmed)
  return {
    token: toFlagToken(inner),
    hadWrapper: Boolean(match),
    malformed: mentionsFlag && !match && trimmed.length > 4,
    raw: trimmed,
  }
}

export function isUnlocked(id: ChallengeId, solved: ChallengeId[]): boolean {
  return CHALLENGE_BY_ID[id].requires.every((r) => solved.includes(r))
}

/** Verify a submission against one specific challenge. */
export function verifyAgainst(id: ChallengeId, raw: string, solved: ChallengeId[]): Verdict {
  const parsed = parseSubmission(raw)
  if (!parsed.token) return 'INCORRECT'
  if (parsed.malformed) return 'MALFORMED'

  const hit = acceptedAnswers(id).some((a) => toFlagToken(a) === parsed.token)
  if (!hit) return 'INCORRECT'
  if (solved.includes(id)) return 'ALREADY'
  if (!isUnlocked(id, solved)) return 'LOCKED'
  return 'CORRECT'
}

export interface MatchResult {
  id: ChallengeId
  verdict: Verdict
}

/**
 * Verify a submission without knowing which challenge it belongs to
 * (used by the global HUD field). Returns null when nothing is empty.
 */
export function matchAny(raw: string, solved: ChallengeId[]): MatchResult | null {
  const parsed = parseSubmission(raw)
  if (!parsed.token) return null
  if (parsed.malformed) return { id: 'mem01', verdict: 'MALFORMED' }

  // Prefer an exact hit on an unsolved, unlocked challenge.
  let lockedHit: ChallengeId | null = null
  let solvedHit: ChallengeId | null = null

  for (const c of CHALLENGES) {
    const hit = acceptedAnswers(c.id).some((a) => toFlagToken(a) === parsed.token)
    if (!hit) continue
    if (solved.includes(c.id)) {
      solvedHit ??= c.id
      continue
    }
    if (!isUnlocked(c.id, solved)) {
      lockedHit ??= c.id
      continue
    }
    return { id: c.id, verdict: 'CORRECT' }
  }

  if (lockedHit) return { id: lockedHit, verdict: 'LOCKED' }
  if (solvedHit) return { id: solvedHit, verdict: 'ALREADY' }
  return { id: 'mem01', verdict: 'INCORRECT' }
}

/** e.g. "FLAG 03" — used in HUD feedback. */
export function flagLabel(id: ChallengeId): string {
  return `FLAG ${String(CHALLENGE_BY_ID[id].index).padStart(2, '0')}`
}
