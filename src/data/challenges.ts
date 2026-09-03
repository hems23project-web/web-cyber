/* =============================================================================
 * challenges.ts — challenge metadata
 * =============================================================================
 * The accepted answers are NOT stored as plain text. Each one is a sealed
 * payload (XOR + base64, keyed by challenge id) that `src/utils/flags.ts`
 * unseals at runtime and normalises before comparing.
 *
 * Consequence: you cannot grep the built bundle for `FLAG{...}` and find any
 * of the answers. If you ever need to change one, run:
 *
 *     node scripts/seal.mjs "NEW ANSWER" --id mem01
 *
 * Copy-writing (titles, poems, hints, success lines) IS plain text and is meant
 * to be edited freely.
 * ========================================================================== */

import { unseal } from '@/utils/seal'
import { JOKES } from '@/data/birthdayConfig'

export type ChallengeId = 'mem01' | 'mem02' | 'mem03' | 'mem04' | 'mem05' | 'mem06' | 'mem07'

export type Mechanism =
  | 'HTML SOURCE / COMMENTS'
  | 'JAVASCRIPT RUNTIME / ENCODING'
  | 'AI / ASCII ENCODING'
  | 'HEX / BASE64 / ROMAN / STATIC FILE'
  | 'BASE64 / CONTEXTUAL CLUE'
  | 'WORDPLAY / A1Z26 / ROT13'
  | 'MULTI-STAGE REASONING'

export interface Challenge {
  id: ChallengeId
  /** 1..7 */
  index: number
  /** "MEMORY 01" */
  label: string
  /** "WHERE IT BEGAN" */
  title: string
  category: string
  mechanism: Mechanism
  points: number
  /** Poetic / in-fiction text shown before it is solved. */
  opening: string[]
  /** Exactly three, escalating. Never reveals the flag outright. */
  hints: [string, string, string]
  /** Canonical answer — sealed. */
  seal: string
  /** Extra forgiving spellings — sealed. Canonical is always accepted too. */
  aliasSeals: string[]
  /** Shown after a correct submission. */
  solvedHeadline: string
  solvedLines: string[]
  solvedNote: string
  /** Challenges that must be solved before this one opens. */
  requires: ChallengeId[]
  /** Solving this one ends the game. */
  final?: boolean
  /** Solving this one switches M.I.A. on. */
  unlocksAI?: boolean
}

/* -------------------------------------------------------------------------- */

export const CHALLENGES: Challenge[] = [
  /* ==========================================================================
   * 01 — WHERE IT BEGAN
   * ======================================================================= */
  {
    id: 'mem01',
    index: 1,
    label: 'MEMORY 01',
    title: 'WHERE IT BEGAN',
    category: 'RECON',
    mechanism: 'HTML SOURCE / COMMENTS',
    points: 100,
    opening: [
      'I remember where it began.',
      'The system remembers too.',
      "But it doesn't display everything it knows.",
    ],
    hints: [
      "The page you see isn't everything the browser received.",
      'Look at the source.',
      'Search the source for comments — the top of index.html names a folder that exists on this server. Everything you need is filed there, including the flag-construction rule.',
    ],
    seal: 'TNGNp4jO0jQ/J5FxQ90=',
    aliasSeals: [
      'TMuNo5zW1ygrJOVwTt1YtHc2CGwHPA==',
      'Uc+U0Z3S3zArJPVqWsA=',
      'TNWJ0YDMxg==',
    ],
    solvedHeadline: 'WHERE IT BEGAN:',
    solvedLines: ['TRIVANDRUM // ILP'],
    solvedNote: "That's where it started.",
    requires: [],
  },

  /* ==========================================================================
   * 02 — THE FIRST DATE
   * ======================================================================= */
  {
    id: 'mem02',
    index: 2,
    label: 'MEMORY 02',
    title: 'THE FIRST DATE',
    category: 'FORENSICS',
    mechanism: 'JAVASCRIPT RUNTIME / ENCODING',
    points: 150,
    opening: ['It rained.', 'There was tea.', 'And it was the first one.'],
    hints: [
      'Three fragments, three different disguises. None of them are plain text, and none of them are the same cipher.',
      'Open the DevTools console on this page and type: window.__ARCHIVE_02__ — the sensor object is attached to the runtime, not to the markup.',
      'base64 → what was drunk. hex pairs → what fell from the sky. 0x-prefixed hex → which one it was. The DECODER in the toolbar handles all three. Assembly rule: FLAG{DRINK_IN_THE_WEATHER}.',
    ],
    seal: 'TMaF0YDOtjIiL5FqTsRD',
    aliasSeals: ['TMaF0YDOtjQrI/8=', 'TMaF0ZvB3yg=', 'TMaF0Y3BwiNKI/8YW8VIxmQ6YWs='],
    solvedHeadline: 'THE FIRST DATE:',
    solvedLines: ['TEA + RAIN'],
    solvedNote: "Some memories don't need much decoding.",
    requires: [],
    unlocksAI: true,
  },

  /* ==========================================================================
   * 03 — THE ISLAND   (guarded by M.I.A.)
   * ======================================================================= */
  {
    id: 'mem03',
    index: 3,
    label: 'MEMORY 03',
    title: 'THE ISLAND',
    category: 'AI // CRYPTO',
    mechanism: 'AI / ASCII ENCODING',
    points: 200,
    opening: [
      'This one is not locked.',
      'It is guarded.',
      'Something in this system is awake now, and it is holding it.',
    ],
    hints: [
      'M.I.A. is not withholding it for fun — she is withholding it because she was told to. Ask her about the memory she is holding.',
      'Open the M.I.A. terminal and ask for the clue. "island", "clue", "next memory", "memory 03" all work — or just press REQUEST CLUE.',
      'She hands over ASCII decimals and a reversed base64 string. Decimals → letters (109 = m). Base64 → decode, then reverse the result. Two words, the second one plural.',
    ],
    seal: 'VdaKo4bFti85JvB2S94=',
    aliasSeals: [
      'VdaKo4bFti85JvB2Sw==',
      'VdaKo4ag3zUmK/98XA==',
      'VdaKo4bFti85JvB2S94trXk3ZGQG',
    ],
    solvedHeadline: 'AN ADVENTURE:',
    solvedLines: ['MUNROE ISLANDS'],
    solvedNote: 'Memory restored. Apparently you two disappeared to an island at some point.',
    requires: ['mem02'],
  },

  /* ==========================================================================
   * 04 — THE PROMISE
   * ======================================================================= */
  {
    id: 'mem04',
    index: 4,
    label: 'MEMORY 04',
    title: 'THE PROMISE',
    category: 'CRYPTO',
    mechanism: 'HEX / BASE64 / ROMAN / STATIC FILE',
    points: 200,
    opening: [
      'A question was asked.',
      'The answer was not no.',
      'The system keeps the date behind three different locks.',
    ],
    hints: [
      'Three shards, three numeral systems. Two of them are on this panel; one of them had to be filed somewhere else on the server.',
      'Shard A is printed on the panel as a hex literal. Shard B is in the markup around the panel — inspect the element, it is not in the pixels. Shard C is the attachment the panel links to, under /records/.',
      'hex → day. base64 → month. roman numerals → year. Then assemble DD_MM_YYYY.',
    ],
    seal: 'KrTrwfCvpFZYXw==',
    aliasSeals: [
      'KrTpwfCtpFZYXw==',
      'KrTqwfCupFZYXw==',
      'KrT0yPuwpFM=',
      'KrP2xOSwr0tYXQ==',
      'KrTkoozQwiMnKPRqL7891AM=',
    ],
    solvedHeadline: '27.09.2025',
    solvedLines: ['THE DAY OF THE PROMISE.'],
    solvedNote: 'The day you proposed.',
    requires: [],
  },

  /* ==========================================================================
   * 05 — THE JOURNEY
   * ======================================================================= */
  {
    id: 'mem05',
    index: 5,
    label: 'MEMORY 05',
    title: 'THE JOURNEY',
    category: 'OSINT',
    mechanism: 'BASE64 / CONTEXTUAL CLUE',
    points: 250,
    opening: [
      'A journey was logged.',
      'The date survived the fragmentation.',
      'The destination did not — at least, not in a form you can read.',
    ],
    hints: [
      'You have a date in base64 and a destination reduced to three letters. Combine both, or the memory stays incomplete.',
      'There is a route table on this server, under /records/. It maps carrier codes to city names — and it tells you, in its own header, that the names are stored in an unusual way. It even includes a worked example.',
      'The base64 decodes to an ISO date (yyyy-mm-dd). The route table gives you the three-letter code for the destination and its reversed city name. Re-order the date to DD_MM_YYYY and combine: FLAG{CITY_DD_MM_YYYY}.',
    ],
    seal: 'WsKKtojM2TQvSoAMIL0/yQRLGhM=',
    aliasSeals: [
      'WsKKtojM2TQvSoAMIr0/ywRLGhM=',
      'WsKKtojM2TQvSoAMIb0/yARLGhM=',
      'WsaKtojMwzQ/SoAMIL0/yQRLGhM=',
      'Ws+W0fi0uVZYRYMIPbs=',
      'WsKKtojM2TQvSoMIPbsg1gRWGRE=',
      'WsKKtojM2TQvSoAMP78/1gRN',
    ],
    solvedHeadline: '14.02.2026',
    solvedLines: ['BANGALORE.'],
    solvedNote: "Apparently Valentine's Day was used for an adventure.",
    requires: [],
  },

  /* ==========================================================================
   * 06 — MI // SECURITY AUDIT
   * ======================================================================= */
  {
    id: 'mem06',
    index: 6,
    label: 'MEMORY 06',
    title: 'MI // SECURITY AUDIT',
    category: 'MISC',
    mechanism: 'WORDPLAY / A1Z26 / ROT13',
    points: 300,
    opening: [
      'A full audit was run on the subject.',
      'Four exploitable surfaces were found.',
      'Two of them are the ones she has never let you forget.',
    ],
    hints: [
      'Only the two CRITICAL findings go into the flag. Translate the technical names into the words she actually uses when she is teasing you.',
      'GLUTEAL ANOMALY is a numbers puzzle where A=1, B=2, C=3. DENTAL GEOMETRY is a letters puzzle where the alphabet is turned halfway round. The DECODER in the toolbar does both.',
      'GLUTEAL: 2 9 7 / 2 21 20 20, with A=1. DENTAL: ROT13 the cipher string on the panel. Order them by the PRIORITY field — 1 first, then 2.',
    ],
    seal: 'WsqD0YvVwjJKKeN3QMZIohYvbWAfJA==',
    aliasSeals: [
      'W9GLvoLF0kY+L/RsR61Pr3FbanAfOA==',
      'WsqD0YvVwjJKK/98L85fqXkwbWFrODyuACQ=',
      'W9GLvoLF0kY+L/RsR61MqHJbamwMTDu+ADg=',
    ],
    solvedHeadline: '✓ SECURITY AUDIT COMPLETE',
    solvedLines: [
      'KNOWN VULNERABILITIES:',
      '· FOOD',
      `· ${JOKES.bigButtName}`,
      `· ${JOKES.crookedTeethName}`,
      '· BEING TALLER THAN HER',
    ],
    solvedNote: 'SYSTEM CONCLUSION: "Subject is highly exploitable."',
    requires: [],
  },

  /* ==========================================================================
   * 07 — MEMORY CORE // IDENTITY OF SUBJECT   (final)
   * ======================================================================= */
  {
    id: 'mem07',
    index: 7,
    label: 'MEMORY 07',
    title: 'IDENTITY OF SUBJECT',
    category: 'FINAL',
    mechanism: 'MULTI-STAGE REASONING',
    points: 500,
    opening: [
      'MEMORY CORE: 100%.',
      'All personal memories recovered.',
      'But one record remains encrypted.',
    ],
    hints: [
      'Every date you have recovered so far belongs to the two of you. This last one belongs to you alone — and it has been in front of you since the very first line of this whole thing.',
      'The seal on this record is base64. Decode it. What comes out is a sentence and a date, and the date is written the wrong way round.',
      'Your codename is MI-07092003. Take those eight digits, split them DD_MM_YYYY, and that is the flag.',
    ],
    seal: 'KLTrwfCvpFZaWQ==',
    aliasSeals: [
      'KLTpwfCtpFZaWQ==',
      'KLTqwfCupFZaWQ==',
      'KLT0yPuwplU=',
      'KrP0wuSwr0taXQ==',
      'L6OXtJnU0ysoL+MYPb091Q==',
      'L6z93vuwplU=',
    ],
    solvedHeadline: '07.09.2003',
    solvedLines: ['THE DAY MY FAVOURITE PERSON WAS BORN.'],
    solvedNote: "That's you.",
    requires: ['mem01', 'mem02', 'mem03', 'mem04', 'mem05', 'mem06'],
    final: true,
  },
]

/* -------------------------------------------------------------------------- */

export const CHALLENGE_BY_ID: Record<ChallengeId, Challenge> = CHALLENGES.reduce(
  (acc, c) => {
    acc[c.id] = c
    return acc
  },
  {} as Record<ChallengeId, Challenge>,
)

/** The six memory fragments (07 is the sealed core, not a fragment). */
export const FRAGMENT_IDS: ChallengeId[] = ['mem01', 'mem02', 'mem03', 'mem04', 'mem05', 'mem06']
export const FINAL_ID: ChallengeId = 'mem07'
export const TOTAL_FRAGMENTS = FRAGMENT_IDS.length

/** Cached unsealed answer sets, so we only pay the decode once. */
const answerCache = new Map<ChallengeId, string[]>()

export function acceptedAnswers(id: ChallengeId): string[] {
  const hit = answerCache.get(id)
  if (hit) return hit
  const c = CHALLENGE_BY_ID[id]
  const list = [unseal(`${id}#0`, c.seal), ...c.aliasSeals.map((s, i) => unseal(`${id}#${i + 1}`, s))]
  answerCache.set(id, list)
  return list
}

/** The canonical answer, for display after a solve. Never used pre-solve. */
export function canonicalAnswer(id: ChallengeId): string {
  return acceptedAnswers(id)[0]
}
