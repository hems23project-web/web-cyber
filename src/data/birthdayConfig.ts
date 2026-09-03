/* =============================================================================
 * birthdayConfig.ts  —  THE ONLY FILE YOU NEED TO EDIT
 * =============================================================================
 * Every personal fact, every date, every line of romantic copy, every photo
 * path and every AI message lives in this file (or in the two files it points
 * at: `challenges.ts` and `miaDialogue.ts`).
 *
 * Nothing personal is scattered through the components. Change it here,
 * save, done.
 * ========================================================================== */

import { unseal } from '@/utils/seal'

/* -----------------------------------------------------------------------------
 * 1. DEPLOYMENT
 * -------------------------------------------------------------------------- */

/**
 * Paste your final deployed URL here, e.g. "https://mi.hems.dev"
 * Leave it as "" and the QR panel will fall back to whatever origin the site
 * is currently being served from (and will tell you it is doing so).
 */
export const SITE_URL = ''

/* -----------------------------------------------------------------------------
 * 2. PEOPLE
 * -------------------------------------------------------------------------- */

export const RECIPIENT_NAME = 'MITHUN'
export const NICKNAME = 'MI'
export const CODENAME = 'MI'
export const SUBJECT_ID = 'MI-07092003'

/** How the site refers to you. Editable — e.g. your name, or "her", or nothing. */
export const AUTHOR_LABEL = 'HER'
export const AUTHOR_SIGNATURE = '— the one who hid all of this'

/** How long, in words. Shown in a couple of places. */
export const RELATIONSHIP_LABEL = 'ALMOST ONE YEAR'

/* -----------------------------------------------------------------------------
 * 3. DATES  (DD/MM/YYYY)
 * -------------------------------------------------------------------------- */

export const DATES = {
  /** Mi's birthday — the final flag. */
  hisBirthday: '07/09/2003',
  hisBirthdayISO: '2003-09-07',
  /** Your birthday. Referenced by the system, never used as a flag. */
  herBirthday: '23/12/2003',
  /** The day Mi proposed — FLAG 04. */
  proposal: '27/09/2025',
  /** The Bangalore trip — FLAG 05. */
  bangalore: '14/02/2026',
} as const

/** Display forms (dots instead of slashes) used across the UI. */
export const DISPLAY_DATES = {
  hisBirthday: '07.09.2003',
  herBirthday: '23.12.2003',
  proposal: '27.09.2025',
  bangalore: '14.02.2026',
} as const

/** Landing page hero line. */
export const HERO_DATE_LINE = '07.09.2003 → ∞'

/* -----------------------------------------------------------------------------
 * 4. THE MEMORIES  (the real ones — nothing here is invented)
 * -------------------------------------------------------------------------- */

export const MEMORIES = {
  met: 'We met during our ILP days in Trivandrum.',
  firstDate: 'Our first date was a tea date in the rain in Trivandrum.',
  temples: 'We loved going on temple dates in Trivandrum.',
  munroe: 'We went to Munroe Islands.',
  bikes: 'We enjoy going on bike rides.',
  food: 'We are both very foodie.',
} as const

/**
 * The two running jokes are SEALED for exactly the same reason the flags are:
 * if the punchline can be grepped out of the shipped bundle, MEMORY 06 is
 * spoiled before it is earned. Everything else in this file is plain text.
 *
 * To re-word them:
 *     1. edit the phrase in `scripts/seal.mjs` (the JOKES map)
 *     2. `node scripts/seal.mjs --jokes`
 *     3. paste the new payload below
 */
export const JOKES = {
  /** the flag word, e.g. what MEMORY 06 asks for */
  bigButtName: unseal('joke#buttName', 'WsqD0YvVwjI='),
  crookedTeethName: unseal('joke#teethName', 'W9GLvoLF0kY+L/RsRw=='),
  /** the sentence, used on the final page */
  bigButt: unseal('joke#buttPhrase', 'Verkmaj2/wgNStAYbeRqxlQOXFFl'),
  crookedTeeth: unseal('joke#teethPhrase', 'Verkmaj2/wgNStJKYOJmg1JbXEAuGBHF'),
  /** not a flag answer, so no reason to hide it */
  short: 'That I am short.',
} as const

/**
 * Keyword lists for M.I.A., derived from the sealed names at runtime so the
 * literal words never have to appear in the dialogue file either.
 */
export const JOKE_TERMS = {
  butt: JOKES.bigButtName.toLowerCase().split(/\s+/),
  teeth: JOKES.crookedTeethName.toLowerCase().split(/\s+/),
} as const

/** The affectionate "final report" on the reveal page. */
export const AUDIT_REPORT = [
  { id: 'VULN_01', name: 'FOOD', detail: MEMORIES.food },
  {
    id: 'VULN_02',
    name: JOKES.bigButtName,
    detail: `we joke about ${JOKES.bigButt} never once disputed.`,
  },
  {
    id: 'VULN_03',
    name: JOKES.crookedTeethName,
    detail: `we joke about ${JOKES.crookedTeeth} she calls it character.`,
  },
  {
    id: 'VULN_04',
    name: 'BEING TALLER THAN HER',
    detail: `${JOKES.short} a recurring finding, and an unrepentant one.`,
  },
] as const

/** City names, used by the clue files and the flag builder. */
export const PLACES = {
  trivandrum: 'TRIVANDRUM',
  trivandrumOfficial: 'THIRUVANANTHAPURAM',
  ilp: 'ILP',
  munroe: 'MUNROE ISLANDS',
  bangalore: 'BANGALORE',
  bangaloreIata: 'BLR',
} as const

/* -----------------------------------------------------------------------------
 * 5. PHOTOS
 * --------------------------------------------------------------------------
 * Drop your own files into `public/photos/` with these exact names.
 * Missing files render an elegant placeholder that names the file it wants.
 * Extensions tried in order: jpg, jpeg, png, webp.
 * -------------------------------------------------------------------------- */

export const PHOTO_EXTENSION_ORDER = ['jpg', 'jpeg', 'png', 'webp'] as const

export type PhotoKey =
  | 'ilp'
  | 'teaRain'
  | 'temple01'
  | 'temple02'
  | 'munroe'
  | 'bike'
  | 'food'
  | 'proposal'
  | 'bangalore'
  | 'birthday'

/** Base filename only — no extension. Extensions are resolved at runtime. */
export const PHOTOS: Record<PhotoKey, string> = {
  ilp: 'ilp',
  teaRain: 'tea-rain',
  temple01: 'temple-01',
  temple02: 'temple-02',
  munroe: 'munroe',
  bike: 'bike',
  food: 'food',
  proposal: 'proposal',
  bangalore: 'bangalore',
  birthday: 'birthday',
}

export const PHOTO_DIR = '/photos'

/* -----------------------------------------------------------------------------
 * 6. LANDING PAGE COPY  (phase 1 — beautiful, not hacker-y)
 * -------------------------------------------------------------------------- */

export const LANDING = {
  eyebrow: 'A SMALL THING, BUILT FOR ONE PERSON',
  titleLine1: 'HAPPY BIRTHDAY,',
  titleName: 'MI',
  heart: '❤️',
  dateLine: HERO_DATE_LINE,

  body: [
    'I made you something.',
    "It's probably more complicated than it needed to be.",
    'But then again...',
    'you are a CTF person.',
  ] as string[],

  cta: 'BEGIN THE ADVENTURE →',
  footnote: `press it. i dare you.  ·  ${RELATIONSHIP_LABEL.toLowerCase()} of evidence inside`,
} as const

/* -----------------------------------------------------------------------------
 * 7. BIRTHDAY PROTOCOL PAGE COPY  (phase 1 → 2 transition)
 * -------------------------------------------------------------------------- */

export const PROTOCOL = {
  title: 'BIRTHDAY PROTOCOL',
  subjectId: SUBJECT_ID,
  status: 'INITIALIZED',
  rows: [
    { k: 'SUBJECT', v: RECIPIENT_NAME },
    { k: 'CODENAME', v: CODENAME },
    { k: 'OBJECTIVE', v: 'Recover the memories.' },
  ] as { k: string; v: string }[],
  detected: '6 MEMORY FRAGMENTS DETECTED.',
  warningTitle: 'WARNING',
  warning: [
    'These memories have been fragmented across the system.',
    'Some are hidden.',
    'Some are encoded.',
    'Some are protected.',
    'One is being guarded by an AI.',
  ] as string[],
  enter: '[ ENTER SYSTEM ]',
} as const

/* -----------------------------------------------------------------------------
 * 8. HUD COPY  (phase 2 — persistent)
 * -------------------------------------------------------------------------- */

export const HUD = {
  title: 'MI // BIRTHDAY PROTOCOL',
  memoriesLabel: 'MEMORIES RECOVERED',
  systemLabel: 'SYSTEM STATUS',
  systemActive: 'ACTIVE',
  aiLabel: 'AI CORE',
  aiLocked: 'LOCKED',
  aiOnline: 'ONLINE',
  aiUnlocked: 'UNLOCKED',
  quickSubmit: 'SUBMIT FLAG',
} as const

/* -----------------------------------------------------------------------------
 * 9. FLAG / FEEDBACK COPY
 * -------------------------------------------------------------------------- */

export const FLAG_FEEDBACK = {
  correct: '✓ MEMORY RECOVERED.',
  incorrect: ['INCORRECT.', 'The memory remains locked.'],
  empty: 'Nothing to verify.',
  already: 'Already recovered. Go find the next one.',
  malformed: 'That is not shaped like a flag. Try FLAG{...}',
  tooEarly: 'That record is still sealed. Recover the others first.',
} as const

/* -----------------------------------------------------------------------------
 * 10. M.I.A. — AI CORE
 * -------------------------------------------------------------------------- */

export const MIA = {
  name: 'M.I.A.',
  expansion: 'MEMORY & INTELLIGENCE ASSISTANT',
  greeting: [
    'Hello, Mi.',
    'I have access to memories.',
    'Unfortunately, someone has decided that you should earn them.',
  ] as string[],
  /**
   * Optional browser-local model. Off by default: the CTF is 100% solvable
   * with the deterministic scripted engine and needs no API key, no download
   * and no network. Flip to true ONLY if you self-host a model endpoint.
   */
  useLocalModel: false,
  localModelEndpoint: '',
} as const

/* -----------------------------------------------------------------------------
 * 11. FINAL REVEAL COPY  (phase 4)
 * -------------------------------------------------------------------------- */

export const MIA_FINAL_MESSAGE = [
  'Final memory recovered.',
  DISPLAY_DATES.hisBirthday + '.',
  "That's you.",
  'Happy Birthday, Mi.',
] as const

export const REVEAL = {
  /** Rendered as stacked lines so the heading also reads correctly aloud. */
  headingLines: ['HAPPY BIRTHDAY', 'MI'],
  heart: '❤️',
  paragraphs: [
    [
      'You spent the last hour trying to hack your birthday present.',
      'The funny part?',
      "You weren't really hacking anything.",
      'You were just finding pieces of us.',
    ],
    [
      'Every flag was a memory.',
      'Every challenge was something I remembered.',
      'And every answer was something that belongs to you.',
    ],
  ] as string[][],

  sectionTimeline: 'THE RECORD, IN ORDER',
  sectionGallery: 'ATTACHED EVIDENCE',
  sectionVulnerabilities: 'SECURITY AUDIT // FINAL REPORT',

  auditConclusion: 'Subject is highly exploitable.',
  auditNote: 'and still the best thing that ever happened to me.',

  closingTitle: 'ONE LAST THING',
  closing: [
    'Happy birthday, Mi.',
    `Here's to ${RELATIONSHIP_LABEL.toLowerCase()}, and to every year after it.`,
    'I love you.',
  ] as string[],

  ctaReplay: 'REPLAY THE PROTOCOL',
  ctaQr: 'QR CODE',
} as const

/* -----------------------------------------------------------------------------
 * 12. ROMANTIC TIMELINE
 * --------------------------------------------------------------------------
 * NOTE ON ENTRY 07: your brief listed "28.07.2025" here but every other
 * section (personal info, FLAG 04, Memory 04) says the proposal was
 * 27/09/2025. I used 27.09.2025 so the site stays internally consistent.
 * If 28.07.2025 is a real, separate date, just change the line below.
 * -------------------------------------------------------------------------- */

export type TimelineEntry = {
  n: string
  code: string
  caption: string
  date?: string
  photo?: PhotoKey
  /** small extra line, optional */
  sub?: string
}

export const TIMELINE: TimelineEntry[] = [
  {
    n: '01',
    code: 'ILP',
    caption: 'We met during our ILP days in Trivandrum.',
    photo: 'ilp',
    sub: 'the beginning of everything',
  },
  {
    n: '02',
    code: 'TEA + RAIN',
    caption: 'Our first date.',
    photo: 'teaRain',
    sub: 'it rained, and neither of us minded',
  },
  {
    n: '03',
    code: 'TEMPLE.exe',
    caption: 'Our temple dates.',
    photo: 'temple01',
    sub: 'Trivandrum, again and again',
  },
  {
    n: '04',
    code: 'MUNROE',
    caption: 'One of our adventures.',
    photo: 'munroe',
    sub: 'we disappeared to an island',
  },
  {
    n: '05',
    code: 'TWO WHEELS',
    caption: 'Our bike rides.',
    photo: 'bike',
    sub: 'long roads, no destination',
  },
  {
    n: '06',
    code: 'FOOD.exe',
    caption: 'Two foodies, one shared weakness.',
    photo: 'food',
    sub: 'VULN_01, still unpatched',
  },
  {
    n: '07',
    code: DISPLAY_DATES.proposal,
    caption: 'The day you proposed.',
    photo: 'proposal',
    sub: 'the answer was yes',
  },
  {
    n: '08',
    code: DISPLAY_DATES.bangalore,
    caption: 'Bangalore.',
    photo: 'bangalore',
    sub: "Valentine's Day, used for an adventure",
  },
  {
    n: '09',
    code: DISPLAY_DATES.hisBirthday,
    caption: 'The day my favourite person was born.',
    photo: 'birthday',
    sub: 'the only date in this system that is entirely yours',
  },
]

/* -----------------------------------------------------------------------------
 * 13. QR CODE
 * --------------------------------------------------------------------------
 * Built for printing AND for embroidery: error correction H, high contrast,
 * large quiet zone, square modules, no gradient, no logo, no rounding.
 * -------------------------------------------------------------------------- */

export const QR_CONFIG = {
  /** What the QR encodes. Falls back to window.location.origin when empty. */
  value: SITE_URL,
  errorCorrectionLevel: 'H' as const,
  /** Quiet zone in modules. 8 is generous; embroidery wants generous. */
  margin: 8,
  /** PNG raster scale (px per module). 16 → a big, clean, printable bitmap. */
  pngScale: 16,
  dark: '#000000',
  light: '#FFFFFF',
  /** Keep modules perfectly square — no rounded corners, no dots. */
  squareModules: true,
  developerNote:
    'For embroidery, physically test the final stitched QR with multiple phones before production.',
  stitchNotes: [
    'Minimum stitched size: 30 × 30 mm. Below that, module pitch drops under what phone cameras resolve.',
    'Stitch dark modules in solid black on solid white. No greys, no tone-on-tone.',
    'Turn OFF error-correction "smoothing" / anti-aliasing in the digitiser, and disable any auto-underlay that softens edges.',
    'Keep the quiet zone empty — no border, no text, no stitching inside it.',
    'Photograph the finished stitch at arm\'s length in even light, then scan with at least three different phones.',
  ] as string[],
} as const

/* -----------------------------------------------------------------------------
 * 14. MISC UI STRINGS
 * -------------------------------------------------------------------------- */

export const UI = {
  decoderTitle: 'DECODER',
  decoderHint: 'Paste anything. "TRY EVERYTHING" runs every method and shows what comes out.',
  settings: 'SETTINGS',
  reset: 'RESET GAME',
  resetConfirm:
    'This wipes every recovered memory, every hint and the final reveal from this browser. There is no undo. Continue?',
  sound: 'SOUND',
  on: 'ON',
  off: 'OFF',
  back: '← BACK',
  continue: 'CONTINUE →',
} as const
