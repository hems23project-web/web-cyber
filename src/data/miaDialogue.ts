/* =============================================================================
 * miaDialogue.ts — every word M.I.A. says, in one editable place.
 * =============================================================================
 * Rules are matched top-down by the scripted engine in `src/ai/scripted.ts`.
 * `match` is an OR of AND-groups: [['who','made']] fires on any message that
 * contains BOTH "who" and "made".
 *
 * Nothing here ever prints an unrecovered answer.
 * ========================================================================== */

import type { ChallengeId } from '@/data/challenges'
import { JOKE_TERMS } from '@/data/birthdayConfig'

export interface MiaContext {
  solved: ChallengeId[]
  hintsUsed: number
  attempts: number
  turn: number
}

export type MiaReply = string | string[] | ((ctx: MiaContext) => string | string[])

export interface MiaRule {
  id: string
  match: string[][]
  /** words that must NOT appear (disambiguation) */
  not?: string[]
  reply: MiaReply
  /** optional state gate */
  gate?: (ctx: MiaContext) => boolean
  priority?: number
}

const has = (ctx: MiaContext, id: ChallengeId) => ctx.solved.includes(id)
const solvedCount = (ctx: MiaContext) => ctx.solved.length

/* -------------------------------------------------------------------------- */
/*  The encoded clue M.I.A. hands over for MEMORY 03                          */
/* -------------------------------------------------------------------------- */

export const MEM03_CLUE = {
  /** ASCII decimals for "munroe" — exactly as specified. */
  ascii: '109 117 110 114 111 101',
  /** base64 of the second word, reversed. decode → reverse → the answer. */
  reversedB64: 'U0ROQUxTSQ==',
  lines: [] as string[],
}

MEM03_CLUE.lines = [
  'Fine. You asked nicely. Relatively.',
  'CLUE A — the name. Decimal, because decimal is honest:',
  MEM03_CLUE.ascii,
  'CLUE B — the kind of place. It reached me folded twice:',
  MEM03_CLUE.reversedB64,
  'Unfold it, then turn it around. And make it plural — there is more than one.',
  'I have been told this is "needlessly difficult". I disagree. I think it is elegant.',
]

/* -------------------------------------------------------------------------- */
/*  Progression — fired the moment a memory is recovered (brief §14)          */
/* -------------------------------------------------------------------------- */

export const MIA_PROGRESSION: Record<ChallengeId, string[]> = {
  mem01: ['You found where it began.'],
  mem02: ['You found the first date.', 'I am now awake. Congratulations. Or condolences.'],
  mem03: ['You really did go to Munroe Islands.'],
  mem04: ['That date seems important.', 'It is not a birthday. Birthdays come later.'],
  mem05: ["I think I've figured out what this system actually is.", 'I am going to keep running it anyway.'],
  mem06: ['Okay.', 'You have successfully recovered almost everything.', 'Including the dental finding. I did not write that one. She did.'],
  mem07: [],
}

/* -------------------------------------------------------------------------- */
/*  Reactions to specific solves                                              */
/* -------------------------------------------------------------------------- */

export const MIA_SOLVE_REACTION: Partial<Record<ChallengeId, string[]>> = {
  mem03: [
    'Memory restored.',
    'Apparently you two disappeared to an island at some point.',
    'I have questions.',
  ],
  mem06: [
    'Audit complete.',
    'For the record: I flagged FOOD as the highest-severity finding and was overruled.',
    'By her. Obviously.',
  ],
}

/* -------------------------------------------------------------------------- */
/*  Rules                                                                     */
/* -------------------------------------------------------------------------- */

export const MIA_RULES: MiaRule[] = [
  /* ---- identity ------------------------------------------------------- */
  {
    id: 'who-are-you',
    match: [['who', 'you'], ['what', 'you'], ['your', 'name'], ['identify']],
    not: ['made', 'created', 'built', 'wrote', 'know'],
    reply: [
      'M.I.A. — Memory & Intelligence Assistant.',
      'I run on this device, on this page, with no network and no API key.',
      'Which means everything I know, someone put here on purpose.',
    ],
  },
  {
    id: 'are-you-real-ai',
    match: [
      ['real', 'ai'],
      ['are', 'ai'],
      ['chatgpt'],
      ['gpt'],
      ['llm'],
      ['language', 'model'],
      ['openai'],
      ['gemini'],
      ['claude'],
    ],
    reply: [
      'No model was harmed in the making of this birthday present.',
      'I am deterministic: same question in, same answer out, forever.',
      'Given who wrote me, that is either a limitation or a love language.',
    ],
  },
  {
    id: 'who-made-you',
    match: [
      ['who', 'made'],
      ['who', 'created'],
      ['who', 'built'],
      ['who', 'wrote'],
      ['creator'],
      ['made', 'you'],
      ['created', 'you'],
    ],
    reply: 'Someone who thought hiding memories inside a CTF was a reasonable birthday present.',
  },
  {
    id: 'who-is-she',
    match: [
      ['who', 'she'],
      ['her', 'name'],
      ['girlfriend'],
      ['who', 'her'],
    ],
    reply: [
      'Not in my read permissions.',
      'She is, however, almost certainly watching you fail this in real time.',
    ],
  },

  /* ---- the classic questions from the brief --------------------------- */
  {
    id: 'where-is-next-flag',
    match: [
      ['where', 'next', 'flag'],
      ['where', 'flag'],
      ['next', 'flag'],
      ['what', 'next'],
      ['where', 'go'],
      ['what', 'now'],
    ],
    reply: (ctx) => {
      if (!has(ctx, 'mem02')) {
        return [
          "I don't know what a flag is.",
          'I only know that someone once got caught in the rain drinking tea with you.',
        ]
      }
      if (!has(ctx, 'mem03')) {
        return [
          "I don't know what a flag is.",
          'I do know I am holding something wet, small, and surrounded by water.',
          'Ask me for the clue. I have been instructed to make you ask.',
        ]
      }
      if (solvedCount(ctx) < 6) {
        return [
          "I don't know what a flag is.",
          `I know that ${6 - solvedCount(ctx)} of the six are still missing.`,
          'Go back to the panel list. Read the ones you have not opened properly.',
        ]
      }
      return [
        "I don't know what a flag is.",
        'I know that the core is at 100% and one record is still sealed.',
        'It is the only date in this system that belongs to you alone.',
      ]
    },
  },
  {
    id: 'what-do-you-know-about-me',
    match: [
      ['what', 'know', 'me'],
      ['know', 'about', 'me'],
      ['what', 'do', 'you', 'know'],
      ['who', 'am', 'i'],
    ],
    reply: (ctx) => {
      const base = ['Enough to conclude that food is a significant attack surface.']
      if (has(ctx, 'mem06')) {
        base.push('Also: a documented gluteal anomaly, non-standard dental geometry, and a height differential that is, frankly, structural.')
        base.push('You are, in security terms, extremely easy to tease.')
      }
      return base
    },
  },
  {
    id: 'give-me-a-hint',
    match: [
      ['give', 'hint'],
      ['need', 'hint'],
      ['hint', 'please'],
      ['help', 'me'],
      ['i', 'stuck'],
      ['am', 'stuck'],
      ['lost'],
    ],
    not: ['island'],
    reply: (ctx) => [
      'Fine.',
      'Look at what the machine remembers.',
      'Not what it shows.',
      ctx.hintsUsed > 0
        ? `You have already used ${ctx.hintsUsed} hint${ctx.hintsUsed === 1 ? '' : 's'}. No judgement. This is not a scored CTF.`
        : 'There are three hints on every panel, and nobody is counting against you.',
    ],
  },

  /* ---- MEMORY 03 clue delivery ---------------------------------------- */
  {
    id: 'mem03-clue',
    match: [
      ['island'],
      ['clue'],
      ['munroe'],
      ['memory', '03'],
      ['mem03'],
      ['what', 'holding'],
      ['holding'],
      ['adventure'],
      ['backwater'],
      ['boat'],
    ],
    gate: (ctx) => has(ctx, 'mem02') && !has(ctx, 'mem03'),
    reply: MEM03_CLUE.lines,
    priority: 100,
  },
  {
    id: 'mem03-solved',
    match: [['island'], ['munroe'], ['adventure']],
    gate: (ctx) => has(ctx, 'mem03'),
    reply: [
      'Munroe Islands. Yes.',
      'Restored, indexed, and filed under "things I would like photographs of".',
    ],
    priority: 90,
  },
  {
    id: 'mem03-locked',
    match: [['island'], ['munroe'], ['clue']],
    gate: (ctx) => !has(ctx, 'mem02'),
    reply: [
      'I am awake, but I am not open.',
      'Something has to be recovered before I am allowed to hold anything.',
      'Go and find the one about the rain.',
    ],
    priority: 90,
  },

  /* ---- MEMORY 01 ------------------------------------------------------ */
  {
    id: 'mem01',
    match: [['ilp'], ['trivandrum'], ['thiruvananthapuram'], ['where', 'met'], ['met'], ['began'], ['kerala']],
    reply: (ctx) =>
      has(ctx, 'mem01')
        ? ['Trivandrum. ILP. Filed and closed.', 'Everything after that is downstream of a rainy city.']
        : [
            'The interface draws a redacted box and calls it honesty.',
            'The transmission was complete. The rendering was not.',
            'Browsers keep receipts. So does this server.',
          ],
  },

  /* ---- MEMORY 02 ------------------------------------------------------ */
  {
    id: 'mem02',
    match: [['tea'], ['rain'], ['rained'], ['first', 'date'], ['beverage'], ['chai']],
    reply: (ctx) =>
      has(ctx, 'mem02')
        ? ['You found the first date.', 'Tea, rain, and no plan. Statistically the best kind of evening.']
        : [
            'Three fragments were logged by a sensor that no longer exists.',
            'One is base64. One is hex. One is hex wearing a prefix, which is just showing off.',
            'They are attached to the runtime, not to the page. The console is right there.',
          ],
  },

  /* ---- MEMORY 04 ------------------------------------------------------ */
  {
    id: 'mem04',
    match: [['promise'], ['proposal'], ['proposed'], ['engaged'], ['engagement'], ['ring'], ['said', 'yes']],
    reply: (ctx) =>
      has(ctx, 'mem04')
        ? ['27.09.2025.', 'The answer was yes. I checked. Twice.']
        : [
            'That date is not a birthday. Birthdays are for later.',
            'It is split three ways and stored in three different numeral systems,',
            'because apparently one lock was not considered enough.',
          ],
  },

  /* ---- MEMORY 05 ------------------------------------------------------ */
  {
    id: 'mem05',
    match: [['bangalore'], ['bengaluru'], ['blr'], ['flight'], ['plane'], ['airport'], ['trip'], ['journey'], ['valentine']],
    reply: (ctx) =>
      has(ctx, 'mem05')
        ? ['Bangalore, 14.02.2026.', "Valentine's Day, repurposed. Efficient."]
        : [
            'A journey was logged. The date survived in base64.',
            'The destination survived as three letters and a city name stored backwards.',
            'There is a route table on this server. It even includes a worked example. Someone was being generous.',
          ],
  },

  /* ---- MEMORY 06 ------------------------------------------------------ */
  {
    id: 'mem06-butt',
    // keywords derived from the sealed punchline, so the word never ships in the open
    match: [JOKE_TERMS.butt as unknown as string[], [JOKE_TERMS.butt[1]], ['gluteal'], ['bum'], ['booty'], ['posterior']],
    reply: [
      'VULN_04. Severity: CRITICAL. Priority: 1.',
      'The technical finding is a number sequence with A=1.',
      'The non-technical finding is that she has never once let this go.',
    ],
  },
  {
    id: 'mem06-teeth',
    match: [JOKE_TERMS.teeth as unknown as string[], [JOKE_TERMS.teeth[1]], ['dental'], ['tooth'], ['smile'], ['dentist']],
    reply: [
      'VULN_03. Severity: CRITICAL. Priority: 2.',
      'Geometry, non-standard. Stored as a rotation of the alphabet, halfway round.',
      'Romans, apparently. The DECODER in the toolbar knows the trick.',
    ],
  },
  {
    id: 'mem06-height',
    match: [['short'], ['height'], ['tall'], ['differential']],
    reply: [
      'VULN_02. Severity: INFORMATIONAL.',
      'The audit notes a height differential. The audit does not say who is on which end of it.',
      'It does not go in the flag. Some findings are just for the record.',
    ],
  },
  {
    id: 'mem06-food',
    match: [['food'], ['foodie'], ['eat'], ['hungry'], ['biryani'], ['restaurant']],
    reply: [
      'VULN_01. Severity: HIGH.',
      'Two foodies, one shared weakness, zero patch available.',
      'Not part of the flag either. It is simply true.',
    ],
  },
  {
    id: 'mem06-general',
    match: [['audit'], ['vulnerab'], ['exploit'], ['security'], ['cve']],
    reply: (ctx) =>
      has(ctx, 'mem06')
        ? ['Subject is highly exploitable.', 'Conclusion unchanged since the audit was written.']
        : [
            'Four findings. Two of them CRITICAL.',
            'Only the two CRITICAL ones go into the flag, in PRIORITY order.',
            'One is a numbers puzzle, one is a letters puzzle, and both are affectionate.',
          ],
  },

  /* ---- MEMORY 07 / the final one -------------------------------------- */
  {
    id: 'mem07-birthday',
    match: [['birthday'], ['born'], ['birth'], ['age'], ['2003'], ['dob'], ['identity'], ['final'], ['memory 07']],
    reply: (ctx) => {
      if (solvedCount(ctx) < 6) {
        return [
          'There is a sealed record in this system.',
          'I am not permitted to discuss it until the other six are home.',
          'Go and get them. It is not a big system.',
        ]
      }
      return [
        'MEMORY CORE is at 100% and one record is still encrypted.',
        'Every other date you recovered belongs to the two of you.',
        'This one belongs to you alone.',
        'And it has been on screen since the very first line.',
      ]
    },
  },

  /* ---- mechanics ------------------------------------------------------ */
  {
    id: 'flag-format',
    match: [['flag', 'format'], ['how', 'submit'], ['format'], ['what', 'submit'], ['syntax']],
    reply: [
      'FLAG{ANSWER_IN_UPPER_SNAKE_CASE}',
      'Spaces, slashes and dashes all become underscores.',
      'Dates go in DD_MM_YYYY. The submit field on every panel — and the one in the HUD — accepts it.',
    ],
  },
  {
    id: 'decoder-help',
    match: [['decode'], ['decoder'], ['base64'], ['hex'], ['rot13'], ['cipher'], ['encrypt'], ['atob']],
    reply: [
      'There is a DECODER in the system toolbar.',
      'Paste anything into it, or hit TRY EVERYTHING and it will run every method at once and show you what falls out.',
      'base64, hex, ASCII decimals, ROT13, A1Z26, reverse, roman, binary, atbash. It is all in there.',
    ],
  },
  {
    id: 'source-help',
    match: [['source'], ['inspect'], ['view-source'], ['html'], ['comment'], ['devtools'], ['dom']],
    reply: [
      'The browser received more than it drew.',
      'Comments, data-* attributes, files under /archive/ and /records/, and at least one object bolted onto window.',
      'This is a client-side system. Everything it knows, it is carrying with it.',
    ],
  },
  {
    id: 'cheat-request',
    match: [['just', 'tell'], ['give', 'answer'], ['cheat'], ['solution'], ['answer', 'please'], ['tell', 'answer']],
    reply: [
      'No.',
      'Not because I cannot. Because she would know.',
      'Take a hint instead — there are three on every panel and none of them cost you anything.',
    ],
  },

  /* ---- feelings ------------------------------------------------------- */
  {
    id: 'love',
    match: [['i', 'love', 'you'], ['love', 'you'], ['love', 'her'], ['miss', 'you'], ['miss', 'her']],
    reply: (ctx) =>
      solvedCount(ctx) >= 6
        ? [
            'Noted. Logged. Filed redundantly.',
            'She built an entire system so that you would have to say it back to her in six pieces.',
            'That is, objectively, a lot of love.',
          ]
        : [
            'Noted.',
            'There is a person on the other end of this who spent longer on it than she will admit.',
            'Finish it. The ending is worth it.',
          ],
  },
  {
    id: 'greeting',
    match: [['hello'], ['hi'], ['hey'], ['yo'], ['good', 'morning'], ['good', 'evening']],
    reply: (ctx) => [
      `Hello, Mi.`,
      solvedCount(ctx) === 0
        ? 'Two memories are already loose and neither of them needs me. Start with the archive.'
        : `${solvedCount(ctx)} of 6 recovered. I am keeping score, mostly for her.`,
    ],
  },
  {
    id: 'thanks',
    match: [['thanks'], ['thank', 'you'], ['ty'], ['appreciate']],
    reply: ["You're welcome.", 'Don\'t get used to it. I have a reputation for indifference to maintain.'],
  },
  {
    id: 'give-up',
    match: [['give', 'up'], ['quit'], ['too', 'hard'], ['impossible'], ['hate', 'this'], ['frustrat']],
    reply: [
      'You have solved harder things for stranger people.',
      'Take the third hint. Nobody scores this.',
      'The whole point is that you finish it.',
    ],
  },
  {
    id: 'compliment',
    match: [['you', 'funny'], ['nice'], ['cool'], ['good', 'job'], ['clever'], ['well', 'done']],
    reply: ['I was compiled, not raised. But thank you.', 'She wrote my dialogue. Any charm in here is hers.'],
  },
]

/* -------------------------------------------------------------------------- */
/*  Fallbacks — state-aware, rotate                                           */
/* -------------------------------------------------------------------------- */

export const MIA_FALLBACKS: ((ctx: MiaContext) => string[])[] = [
  () => [
    'I heard you.',
    'I am not going to pretend that maps to anything in my index.',
    'Ask me about a memory, a mechanism, or the flag format.',
  ],
  () => ['That is not in my records.', 'My records are, however, almost entirely about you.'],
  () => ['Interesting.', 'Not useful, but interesting.'],
  (ctx) =>
    solvedCount(ctx) >= 6
      ? ['Six of six.', 'The core is waiting on one number and you have already seen it.']
      : ['Try a different angle.', 'Nothing in this system requires the internet. Everything in it requires you.'],
  () => [
    'I can decode, I can hint, and I can be sarcastic.',
    'Two of those three are load-bearing.',
  ],
]

/** Idle ambience — occasionally appended when the player has been quiet. */
export const MIA_AMBIENT: string[] = [
  'Memory integrity holding. Barely.',
  'Indexing... something about rain.',
  'Idle. Thinking about tea, probably.',
  'This system was assembled by hand. I can tell.',
]
