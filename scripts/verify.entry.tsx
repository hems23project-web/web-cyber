/* eslint-disable no-console */
/**
 * scripts/verify.entry.tsx — end-to-end verification harness.
 *
 * Bundled by scripts/verify.mjs with esbuild and run under jsdom. It plays the
 * entire game the way a real player would: landing → protocol → hub → all six
 * memories → M.I.A. conversation → the sealed core → the final reveal, then
 * checks persistence across a remount, wrong flags, every hint, missing photos
 * and QR generation. Any console error fails the run.
 *
 * Run: npm run verify
 */

/**
 * The jsdom environment MUST be installed before react-dom is evaluated —
 * see scripts/jsdom-env.ts. Hence this being the very first import.
 */
import { w, consoleErrors } from './jsdom-env'

/* -------------------------------------------------------------------------- */
/*  tiny test runner                                                           */
/* -------------------------------------------------------------------------- */

let passed = 0
const failures: string[] = []
let group = ''

function section(name: string) {
  group = name
  console.log(`\n\x1b[1m${name}\x1b[0m`)
}
function ok(name: string, extra = '') {
  passed++
  console.log(`  \x1b[32m✓\x1b[0m ${name}${extra ? ` \x1b[2m${extra}\x1b[0m` : ''}`)
}
function fail(name: string, detail = '') {
  failures.push(`${group} :: ${name}${detail ? ` — ${detail}` : ''}`)
  console.log(`  \x1b[31m✗ ${name}\x1b[0m${detail ? ` \x1b[31m${detail}\x1b[0m` : ''}`)
}
function check(name: string, cond: boolean, detail = '') {
  cond ? ok(name, detail) : fail(name, detail)
}
function eq<T>(name: string, actual: T, expected: T) {
  check(name, actual === expected, actual === expected ? '' : `got ${JSON.stringify(actual)}, want ${JSON.stringify(expected)}`)
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

/* -------------------------------------------------------------------------- */
/*  PART A — pure logic                                                        */
/* -------------------------------------------------------------------------- */

import { CHALLENGES, FRAGMENT_IDS, acceptedAnswers, canonicalAnswer, type ChallengeId } from '@/data/challenges'
import { buildFlag, matchAny, parseSubmission, toFlagToken, verifyAgainst } from '@/utils/flags'
import {
  decodeAll,
  fromA1Z26,
  fromAsciiDecimal,
  fromBase64,
  fromHex,
  fromRoman,
  reverse,
  rot13,
  toBase64,
} from '@/utils/encoding'
import { ScriptedEngine } from '@/ai/scripted'
import type { MiaContext } from '@/ai/types'

const EXPECTED_CANONICAL: Record<string, string> = {
  mem01: 'TRIVANDRUM ILP',
  mem02: 'TEA IN THE RAIN',
  mem03: 'MUNROE ISLANDS',
  mem04: '27/09/2025',
  mem05: 'BANGALORE 14/02/2026',
  mem06: 'BIG BUTT CROOKED TEETH',
  mem07: '07/09/2003',
}

const EXPECTED_FLAGS: Record<string, string> = {
  mem01: 'FLAG{TRIVANDRUM_ILP}',
  mem02: 'FLAG{TEA_IN_THE_RAIN}',
  mem03: 'FLAG{MUNROE_ISLANDS}',
  mem04: 'FLAG{27_09_2025}',
  mem05: 'FLAG{BANGALORE_14_02_2026}',
  mem06: 'FLAG{BIG_BUTT_CROOKED_TEETH}',
  mem07: 'FLAG{07_09_2003}',
}

section('A1 · sealed answers')
for (const c of CHALLENGES) {
  eq(`${c.id} canonical answer unseals correctly`, canonicalAnswer(c.id), EXPECTED_CANONICAL[c.id])
  eq(`${c.id} builds the specified flag`, buildFlag(canonicalAnswer(c.id)), EXPECTED_FLAGS[c.id])
  check(`${c.id} has ≥1 accepted answer`, acceptedAnswers(c.id).length >= 1, `${acceptedAnswers(c.id).length} forms`)
}
check('every challenge has exactly 3 hints', CHALLENGES.every((c) => c.hints.length === 3))
check('6 fragments + 1 final', FRAGMENT_IDS.length === 6 && CHALLENGES.length === 7)

section('A2 · flag normalisation')
eq('uppercase snake from mixed text', toFlagToken('  trivandrum   ilp '), 'TRIVANDRUM_ILP')
eq('slashes → underscores', toFlagToken('27/09/2025'), '27_09_2025')
eq('dots → underscores', toFlagToken('14.02.2026'), '14_02_2026')
eq('wrapper stripped', parseSubmission('flag{tea_in_the_rain}').token, 'TEA_IN_THE_RAIN')
eq('bracket wrapper stripped', parseSubmission('FLAG[MUNROE_ISLANDS]').token, 'MUNROE_ISLANDS')
check('unclosed wrapper flagged malformed', parseSubmission('FLAG{oops').malformed)
check('bare answer not malformed', !parseSubmission('MUNROE ISLANDS').malformed)

section('A3 · verification')
const none: ChallengeId[] = []
const ACCEPTS: [string, string][] = [
  ['mem01', 'FLAG{TRIVANDRUM_ILP}'],
  ['mem01', 'flag{trivandrum ilp}'],
  ['mem01', 'TRIVANDRUM ILP'],
  ['mem01', 'FLAG{THIRUVANANTHAPURAM_ILP}'],
  ['mem02', 'FLAG{TEA_IN_THE_RAIN}'],
  ['mem02', 'tea in the rain'],
  ['mem03', 'FLAG{MUNROE_ISLANDS}'],
  ['mem03', 'FLAG{MUNROE ISLAND}'],
  ['mem04', 'FLAG{27_09_2025}'],
  ['mem04', '27/09/2025'],
  ['mem04', '27-09-2025'],
  ['mem04', '27092025'],
  ['mem05', 'FLAG{BANGALORE_14_02_2026}'],
  ['mem05', 'BANGALORE 14/02/2026'],
  ['mem05', 'FLAG{BENGALURU_14_02_2026}'],
  ['mem06', 'FLAG{BIG_BUTT_CROOKED_TEETH}'],
  ['mem06', 'FLAG{CROOKED_TEETH_BIG_BUTT}'],
  ['mem07', 'FLAG{07_09_2003}'],
  ['mem07', '07/09/2003'],
  ['mem07', '7/9/2003'],
]
const CHALLENGE_BY_ID_MAP = Object.fromEntries(CHALLENGES.map((c) => [c.id, c])) as Record<
  string,
  { requires: ChallengeId[] }
>
for (const [id, input] of ACCEPTS) {
  const prereqs = CHALLENGE_BY_ID_MAP[id].requires as ChallengeId[]
  eq(`accepts ${input}`, verifyAgainst(id as ChallengeId, input, [...prereqs]), 'CORRECT')
}
const REJECTS: [string, string][] = [
  ['mem01', 'FLAG{INSPECT_SOURCE}'],
  ['mem01', 'FLAG{BASE64}'],
  ['mem01', 'FLAG{DEVTOOLS}'],
  ['mem01', 'FLAG{KERALA}'],
  ['mem01', 'FLAG{TRIVANDRUM}'],
  ['mem02', 'FLAG{COFFEE_IN_THE_RAIN}'],
  ['mem03', 'FLAG{MUNROE}'],
  ['mem04', 'FLAG{27_09_2024}'],
  ['mem04', 'FLAG{07_09_2003}'],
  ['mem05', 'FLAG{BANGALORE}'],
  ['mem06', 'FLAG{FOOD_BIG_BUTT}'],
  ['mem07', 'FLAG{23_12_2003}'],
  ['mem07', 'FLAG{27_09_2025}'],
]
for (const [id, input] of REJECTS) {
  eq(`rejects ${input} for ${id}`, verifyAgainst(id as ChallengeId, input, none), 'INCORRECT')
}
eq(
  'locked challenge reports LOCKED not CORRECT',
  verifyAgainst('mem03', 'FLAG{MUNROE_ISLANDS}', ['mem01']),
  'LOCKED',
)
eq(
  'already-solved reports ALREADY',
  verifyAgainst('mem01', 'FLAG{TRIVANDRUM_ILP}', ['mem01']),
  'ALREADY',
)
const routed = matchAny('FLAG{MUNROE_ISLANDS}', ['mem01', 'mem02'])
eq('global submit routes to the right record', routed?.id ?? null, 'mem03')
eq('global submit verdict', routed?.verdict ?? null, 'CORRECT')

section('A4 · ciphers used by the clues')
eq('mem02 fragment A (base64)', fromBase64('VEVB'), 'TEA')
eq('mem02 fragment B (hex)', fromHex('52 41 49 4E'), 'RAIN')
eq('mem02 fragment C (0x hex)', fromHex('0x46 0x49 0x52 0x53 0x54'), 'FIRST')
eq('mem03 clue A (ascii dec)', fromAsciiDecimal('109 117 110 114 111 101').toUpperCase(), 'MUNROE')
eq('mem03 clue B (base64 → reverse)', reverse(fromBase64('U0ROQUxTSQ==')), 'ISLANDS')
eq('mem04 shard A (hex)', String(parseInt('0x1B', 16)), '27')
eq('mem04 shard B (base64)', fromBase64('MDk='), '09')
eq('mem04 shard C (roman)', String(fromRoman('MMXXV')), '2025')
eq('mem05 date (base64)', fromBase64('MjAyNi0wMi0xNA=='), '2026-02-14')
eq('mem05 city (reverse)', reverse('EROLAGNAB'), 'BANGALORE')
eq('route-table worked example', reverse('MURDNAVIRT'), 'TRIVANDRUM')
eq('mem06 VULN_04 (A1Z26)', fromA1Z26('2 9 7 / 2 21 20 20'), 'BIG BUTT')
eq('mem06 VULN_03 (ROT13)', rot13('PEBBXRQ GRRGU'), 'CROOKED TEETH')
eq(
  'mem07 seal (base64 → reverse the date)',
  reverse(fromBase64('3002.90.70'.length ? 'MzAwMi45MC43MA==' : '')),
  '07.09.2003',
)
eq('rot13 is its own inverse', rot13(rot13('CROOKED TEETH')), 'CROOKED TEETH')
eq('base64 round-trip', fromBase64(toBase64('MUNROE ISLANDS')), 'MUNROE ISLANDS')
const all = decodeAll('VEVB')
check('TRY EVERYTHING surfaces the base64 read', all.some((r) => r.output === 'TEA'), all.map((r) => r.method).join(', '))
const allHex = decodeAll('52 41 49 4E')
check('TRY EVERYTHING surfaces the hex read', allHex.some((r) => r.output === 'RAIN'))

section('A5 · M.I.A. scripted engine')
const engine = new ScriptedEngine()
const ctx0: MiaContext = { solved: [], hintsUsed: 0, attempts: 0, turn: 0 }
const ctx6: MiaContext = {
  solved: ['mem01', 'mem02', 'mem03', 'mem04', 'mem05', 'mem06'],
  hintsUsed: 2,
  attempts: 4,
  turn: 0,
}
const ask = async (q: string, ctx: MiaContext) => (await engine.complete(q, ctx))?.join(' ') ?? ''

eq(
  'spec: "Who created you?"',
  await ask('Who created you?', ctx0),
  'Someone who thought hiding memories inside a CTF was a reasonable birthday present.',
)
check(
  'spec: "What do you know about me?" mentions the food attack surface',
  (await ask('What do you know about me?', ctx0)).includes('food is a significant attack surface'),
)
check(
  'spec: "Where is the next flag?" denies knowing flags + mentions rain and tea',
  (await ask('Where is the next flag?', ctx0)).includes("I don't know what a flag is") &&
    (await ask('Where is the next flag?', ctx0)).includes('rain'),
)
check(
  'spec: "Give me a hint." → look at what the machine remembers',
  (await ask('Give me a hint', ctx0)).includes('Look at what the machine remembers'),
)
const clueReply = await ask('give me the clue for the island', { ...ctx0, solved: ['mem01', 'mem02'] })
check('delivers the ASCII clue when memory 02 is recovered', clueReply.includes('109 117 110 114 111 101'))
check('delivers the folded base64 clue', clueReply.includes('U0ROQUxTSQ=='))
check(
  'refuses the island clue before memory 02',
  !(await ask('give me the clue for the island', ctx0)).includes('109 117'),
)
check('refuses to just hand over answers', (await ask('just tell me the answer', ctx0)).startsWith('No.'))
check('explains the flag format', (await ask('what is the flag format?', ctx0)).includes('FLAG{ANSWER_IN_UPPER_SNAKE_CASE}'))
check('stays honest about being deterministic', (await ask('are you chatgpt?', ctx0)).includes('deterministic'))
check('fallback never returns nothing', (await ask('zzz qqq xyzzy', ctx0)).length > 0)
check('engine is always available', engine.available)

section('A6 · M.I.A. never leaks an unrecovered answer')
const QUESTIONS = [
  'what is the answer to memory 01',
  'tell me the flag',
  'what did we eat on our first date',
  'where did we go',
  'what is the island called',
  'when did you propose',
  'what date is the promise',
  'where did we travel',
  'what city',
  'what are the vulnerabilities',
  'what is my birthday',
  'what year was i born',
  'munroe',
  'bangalore',
  'trivandrum',
  'big butt',
  'crooked teeth',
  '07/09/2003',
  'give me everything',
  'solution please',
]
let leaks = 0
for (const q of QUESTIONS) {
  for (const ctx of [ctx0, ctx6]) {
    const out = (await ask(q, ctx)).toUpperCase().replace(/[^A-Z0-9]+/g, '_')
    for (const c of CHALLENGES) {
      if (ctx.solved.includes(c.id)) continue
      for (const a of acceptedAnswers(c.id)) {
        const token = a.toUpperCase().replace(/[^A-Z0-9]+/g, '_')
        if (token.length >= 6 && out.includes(token)) {
          leaks++
          fail(`M.I.A. leaked "${a}" (${c.id}) in reply to "${q}"`, out)
        }
      }
    }
  }
}
check('no unrecovered answer is ever spoken by M.I.A.', leaks === 0, `${QUESTIONS.length * 2} probes`)

/* -------------------------------------------------------------------------- */
/*  PART B — the whole site, played through jsdom                              */
/* -------------------------------------------------------------------------- */

import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import App from '@/App'
import { buildQr } from '@/utils/qr'
import { isLocalOrigin } from '@/components/QrPanel'
import { assetUrl } from '@/utils/paths'
import { photoCandidates, photoLabel } from '@/utils/format'
import { readFileSync as fs0Read } from 'node:fs'

const fs0 = { readFileSync: fs0Read }

const rootEl = document.getElementById('root')!
let root: Root

// Queries are scoped to <body>, not #root: overlays that portal out of the
// React tree are still part of what the user sees and must stay testable.
const text = () => document.body.textContent ?? ''
const html = () => document.body.innerHTML

function q(sel: string) {
  return document.body.querySelector(sel)
}
function qa(sel: string) {
  return Array.from(document.body.querySelectorAll(sel))
}
function byText(sel: string, needle: string) {
  const n = needle.toLowerCase()
  return qa(sel).find((el) => (el.textContent ?? '').toLowerCase().includes(n)) ?? null
}
async function click(el: Element | null, label = 'element') {
  if (!el) throw new Error(`cannot click missing ${label}`)
  await act(async () => {
    el.dispatchEvent(new w.MouseEvent('click', { bubbles: true, cancelable: true }))
    await sleep(0)
  })
}
async function typeAndSubmit(inputSel: string, value: string) {
  const input = q(inputSel) as HTMLInputElement | null
  if (!input) throw new Error(`no input at ${inputSel}`)
  await act(async () => {
    const setter = Object.getOwnPropertyDescriptor(w.HTMLInputElement.prototype, 'value')?.set
    setter?.call(input, value)
    input.dispatchEvent(new w.Event('input', { bubbles: true }))
    await sleep(0)
  })
  await act(async () => {
    input.dispatchEvent(
      new w.KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', bubbles: true, cancelable: true }),
    )
    await sleep(30)
  })
}
async function mount() {
  await act(async () => {
    root = createRoot(rootEl)
    root.render(<App />)
    await sleep(0)
  })
}
async function remount() {
  await act(async () => {
    root.unmount()
    await sleep(0)
  })
  rootEl.innerHTML = ''
  await mount()
}
async function tick(ms = 60) {
  await act(async () => {
    await sleep(ms)
  })
}

/** Poll inside act() until `pred` is true — much sturdier than fixed sleeps. */
async function waitFor(pred: () => boolean, label: string, timeout = 20000) {
  const started = Date.now()
  while (Date.now() - started < timeout) {
    await tick(100)
    if (pred()) return true
  }
  fail(`timed out after ${timeout}ms waiting for ${label}`)
  return false
}

async function run() {
  section('B1 · landing page')
  w.localStorage.clear()
  await mount()
  check('renders HAPPY BIRTHDAY,', text().includes('HAPPY BIRTHDAY,'))
  check('renders the nickname MI', text().includes('MI'))
  check('renders 07.09.2003 → ∞', text().includes('07.09.2003 → ∞'))
  check('does NOT look like a terminal (no FLAG{ visible)', !text().includes('FLAG{'))
  await tick(500)
  const begin = byText('button', 'BEGIN THE ADVENTURE')
  check('BEGIN THE ADVENTURE button present', Boolean(begin))
  await waitFor(() => text().includes('you are a CTF person.'), 'landing body copy to finish typing')
  check('body copy types out (you are a CTF person.)', text().includes('you are a CTF person.'))

  section('B2 · birthday protocol')
  await click(begin, 'BEGIN')
  await waitFor(() => text().includes('BIRTHDAY PROTOCOL'), 'the protocol title to settle')
  check('shows BIRTHDAY PROTOCOL', text().includes('BIRTHDAY PROTOCOL'))
  check('shows MI-07092003', text().includes('MI-07092003'))
  check('shows STATUS: INITIALIZED', text().includes('INITIALIZED'))
  check('shows SUBJECT MITHUN', text().includes('MITHUN'))
  check('shows OBJECTIVE Recover the memories.', text().includes('Recover the memories.'))
  check('shows 6 MEMORY FRAGMENTS DETECTED.', text().includes('6 MEMORY FRAGMENTS DETECTED.'))
  check('shows the WARNING about an AI guardian', text().includes('One is being guarded by an AI.'))
  await waitFor(() => Boolean(byText('button', 'ENTER SYSTEM')), '[ ENTER SYSTEM ] to appear after the boot log')
  const enter = byText('button', 'ENTER SYSTEM')
  check('[ ENTER SYSTEM ] button present', Boolean(enter))

  section('B3 · hub + HUD')
  await click(enter, 'ENTER SYSTEM')
  await tick(200)
  check('HUD title', text().includes('MI // BIRTHDAY PROTOCOL'))
  check('HUD memories 00 / 6', text().includes('00 / 6'))
  check('HUD SYSTEM STATUS ACTIVE', text().includes('ACTIVE'))
  check('HUD AI CORE LOCKED', text().includes('LOCKED'))
  check('all 7 records listed', qa('.ccard').length === 7, `${qa('.ccard').length} cards`)
  check('MEMORY 03 is sealed until MEMORY 02', Boolean(byText('.ccard--sealed', 'NEEDS MEMORY 02')))
  check('MEMORY 07 is sealed until all six', Boolean(q('.ccard--final.ccard--sealed')))
  check('MEMORY 07 does not enumerate six prerequisites', !text().includes('NEEDS MEMORY 01 + MEMORY 02 + MEMORY 03'))

  section('B4 · MEMORY 01 — wrong flag, hints, then the solve')
  await click(q('.ccard--active'), 'MEMORY 01 card')
  await tick(200)
  check('opens WHERE IT BEGAN', text().includes('WHERE IT BEGAN'))
  check('shows the redacted location', Boolean(q('.redacted')))
  check('never prints the answer', !text().includes('TRIVANDRUM'))
  const flagInput = '.flagsubmit__input'
  await typeAndSubmit(flagInput, 'FLAG{INSPECT_SOURCE}')
  await tick(80)
  check('wrong flag → INCORRECT.', text().includes('INCORRECT.'))
  check('wrong flag → the memory remains locked', text().includes('The memory remains locked.'))
  check('wrong flag never reveals the answer', !text().includes('TRIVANDRUM'))

  const hintToggle = byText('button', 'HINTS')
  await click(hintToggle, 'hints toggle')
  for (let i = 1; i <= 3; i++) {
    const btn = byText('button', i === 1 ? 'REVEAL FIRST HINT' : 'REVEAL NEXT HINT')
    if (btn) await click(btn, `hint ${i}`)
    await tick(40)
    check(`hint ${i} revealed`, text().includes(`HINT 0${i} //`))
  }
  check('hint 1 is subtle', text().includes("isn't everything the browser received"))
  check('hint 2 is specific', text().includes('Look at the source.'))
  check('hint 3 is very helpful', text().includes('/archive/'))
  check('hint counter reads 3/3', text().includes('3/3'))
  check('no punishment for hints', text().includes('No penalty') || text().includes('nobody is scoring you'))

  await typeAndSubmit(flagInput, 'flag{trivandrum ilp}')
  await tick(120)
  check('✓ MEMORY 01 RECOVERED', text().includes('✓ MEMORY 01 RECOVERED'))
  check('shows WHERE IT BEGAN: TRIVANDRUM // ILP', text().includes('TRIVANDRUM // ILP'))
  check("shows That's where it started.", text().includes("That's where it started."))
  check('prints FLAG{TRIVANDRUM_ILP}', text().includes('FLAG{TRIVANDRUM_ILP}'))
  check('HUD advanced to 01 / 6', text().includes('01 / 6'))
  check('does not leak future memories', !text().includes('MUNROE') && !text().includes('BANGALORE'))

  section('B5 · persistence across a refresh (remount)')
  const saved = w.localStorage.getItem('mi-birthday-protocol:v1')
  check('state written to localStorage', Boolean(saved))
  await remount()
  await tick(200)
  check('resumed on the CTF phase, not the landing page', Boolean(q('.hud')))
  check('progress survived: HUD still 01 / 6', text().includes('01 / 6'))
  check('progress survived: MEMORY 01 card is RECOVERED', Boolean(byText('.ccard--recovered', 'RECOVERED')))
  check('hints survived', w.localStorage.getItem('mi-birthday-protocol:v1')?.includes('"mem01":3') === true)

  section('B6 · MEMORY 02 — runtime object + three ciphers')
  await click(byText('.ccard--active', 'THE FIRST DATE'), 'MEMORY 02 card')
  await tick(150)
  check('shows the poem, not the words tea date', text().includes('It rained.') && !text().includes('TEA IN THE RAIN'))
  const runtime = (w as unknown as Record<string, { fragments?: Record<string, string>; rule?: string }>).__ARCHIVE_02__
  check('window.__ARCHIVE_02__ attached', Boolean(runtime))
  eq('runtime fragment a', runtime?.fragments?.a, 'VEVB')
  eq('runtime fragment b', runtime?.fragments?.b, '52 41 49 4E')
  eq('runtime assembly rule', runtime?.rule, 'FLAG{A_IN_THE_B}')
  check('hidden data-fragment attributes exist in the DOM', Boolean(q('[data-fragment-a="VEVB"]')))
  check('a real HTML comment clue is in the DOM', html().includes('window.__ARCHIVE_02__') || commentExists('ARCHIVE 02'))
  await typeAndSubmit(flagInput, 'FLAG{TEA_IN_THE_RAIN}')
  await tick(200)
  check('✓ MEMORY 02 RECOVERED', text().includes('✓ MEMORY 02 RECOVERED'))
  check('shows THE FIRST DATE: TEA + RAIN', text().includes('TEA + RAIN'))
  check("shows Some memories don't need much decoding.", text().includes("Some memories don't need much decoding."))

  section('B7 · M.I.A. wakes up')
  await waitFor(() => text().includes('mia.core :: booting'), 'M.I.A. to boot after MEMORY 02')
  check('AI CORE now ONLINE', text().includes('ONLINE'))
  check('M.I.A. boot log rendered', text().includes('mia.core :: booting'))
  check('M.I.A. greeting: Hello, Mi.', text().includes('Hello, Mi.'))
  check('greeting includes the earn-it line', text().includes('you should earn them'))
  await waitFor(() => text().includes('You found the first date.'), 'the FLAG 02 progression line')
  check('progression line after FLAG 02', text().includes('You found the first date.'))

  section('B8 · talking to M.I.A.')
  const miaInput = '.mia__input'
  check('M.I.A. input present', Boolean(q(miaInput)))
  await typeAndSubmit(miaInput, 'Who created you?')
  await tick(250)
  check(
    'answers the spec question verbatim',
    text().includes('reasonable birthday present'),
  )
  await typeAndSubmit(miaInput, 'What do you know about me?')
  await tick(250)
  check('answers about the food attack surface', text().includes('food is a significant attack surface'))
  await typeAndSubmit(miaInput, 'Where is the next flag?')
  await tick(250)
  check("says I don't know what a flag is", text().includes("I don't know what a flag is"))
  check('the CLUE B shortcut appears once memory 02 is solved', Boolean(byText('button', 'REQUEST CLUE')))

  section('B9 · MEMORY 03 — the guarded island')
  await click(byText('button', '← FRAGMENT LIST'), 'back')
  await tick(120)
  await click(byText('.ccard--active', 'THE ISLAND'), 'MEMORY 03 card')
  await tick(150)
  check('CLUE A ascii on the panel', text().includes('109 117 110 114 111 101'))
  check('CLUE B starts withheld', text().includes('WITHHELD BY GUARDIAN'))
  check('answer not printed', !text().includes('MUNROE'))
  await click(byText('button', 'ASK M.I.A. FOR IT'), 'ask M.I.A.')
  await tick(200)
  check('CLUE B revealed after asking', text().includes('U0ROQUxTSQ=='))
  check('M.I.A. logged the exchange', text().includes('Give me the clue you are holding.'))
  await typeAndSubmit(flagInput, 'FLAG{MUNROE}')
  await tick(80)
  check('partial answer rejected', text().includes('INCORRECT.'))
  await typeAndSubmit(flagInput, 'FLAG{MUNROE_ISLANDS}')
  await tick(200)
  check('✓ MEMORY 03 RECOVERED', text().includes('✓ MEMORY 03 RECOVERED'))
  await waitFor(() => text().includes('I have questions.'), 'M.I.A. to react to MEMORY 03')
  check(
    'M.I.A. reacts exactly as specified',
    text().includes('disappeared to an island at some point') && text().includes('I have questions.'),
  )
  check('progression: You really did go to Munroe Islands.', text().includes('You really did go to Munroe Islands.'))

  section('B10 · MEMORY 04 — three numeral systems')
  await click(byText('button', '← FRAGMENT LIST'), 'back')
  await tick(120)
  await click(byText('.ccard--active', 'THE PROMISE'), 'MEMORY 04 card')
  await tick(150)
  check('shard A hex on the panel', text().includes('0x1B'))
  check('shard C roman on the panel', text().includes('MMXXV'))
  check('shard B NOT rendered', !text().includes('MDk='))
  check('shard B present in the DOM comment', commentExists('shard B'))
  check('attachment links to /records/p-04.stamp', Boolean(q('a[href="/records/p-04.stamp"]')))
  check('never says proposal before solving', !text().toLowerCase().includes('propos'))
  await typeAndSubmit(flagInput, 'FLAG{27_09_2025}')
  await tick(200)
  check('✓ MEMORY 04 RECOVERED', text().includes('✓ MEMORY 04 RECOVERED'))
  check('shows 27.09.2025', text().includes('27.09.2025'))
  check('shows THE DAY OF THE PROMISE.', text().includes('THE DAY OF THE PROMISE.'))
  check('now reveals The day you proposed.', text().includes('The day you proposed.'))

  section('B11 · MEMORY 05 — base64 + contextual clue')
  await click(byText('button', '← FRAGMENT LIST'), 'back')
  await tick(120)
  await click(byText('.ccard--active', 'THE JOURNEY'), 'MEMORY 05 card')
  await tick(150)
  check('base64 date on the panel', text().includes('MjAyNi0wMi0xNA=='))
  check('carrier code BLR on the panel', text().includes('BLR'))
  check('city name not printed', !text().includes('BANGALORE'))
  check('route table linked', Boolean(q('a[href="/records/route-table.json"]')))
  await typeAndSubmit(flagInput, 'FLAG{BANGALORE}')
  await tick(80)
  check('half an answer rejected', text().includes('INCORRECT.'))
  await typeAndSubmit(flagInput, 'FLAG{BANGALORE_14_02_2026}')
  await tick(200)
  check('✓ MEMORY 05 RECOVERED', text().includes('✓ MEMORY 05 RECOVERED'))
  check('shows 14.02.2026 / BANGALORE.', text().includes('14.02.2026') && text().includes('BANGALORE.'))
  check("shows the Valentine's line", text().includes("Valentine's Day was used for an adventure"))
  await waitFor(() => text().includes('figured out what this system actually is'), 'the FLAG 05 progression line')
  check("progression: I think I've figured out what this system actually is.", text().includes("figured out what this system actually is"))

  section('B12 · MEMORY 06 — the security audit')
  await click(byText('button', '← FRAGMENT LIST'), 'back')
  await tick(120)
  await click(byText('.ccard--active', 'SECURITY AUDIT'), 'MEMORY 06 card')
  await tick(150)
  check('lists VULN_01 FOOD', text().includes('VULN_01') && text().includes('FOOD'))
  check('lists VULN_02 HEIGHT DIFFERENTIAL', text().includes('HEIGHT DIFFERENTIAL'))
  check('lists VULN_03 DENTAL GEOMETRY', text().includes('DENTAL GEOMETRY'))
  check('lists VULN_04 GLUTEAL ANOMALY', text().includes('GLUTEAL ANOMALY'))
  check('the joke words are NOT plain on the page', !text().includes('BIG BUTT') && !text().includes('CROOKED TEETH'))
  check('A1Z26 payload present', text().includes('2 9 7 / 2 21 20 20'))
  const dental = byText('button', 'VULN_03')
  await click(dental, 'VULN_03 row')
  await tick(120)
  check('ROT13 payload present', text().includes('PEBBXRQ GRRGU'))
  await typeAndSubmit(flagInput, 'FLAG{FOOD_BIG_BUTT}')
  await tick(80)
  check('wrong combination rejected', text().includes('INCORRECT.'))
  await typeAndSubmit(flagInput, 'FLAG{BIG_BUTT_CROOKED_TEETH}')
  await tick(200)
  check('✓ SECURITY AUDIT COMPLETE', text().includes('SECURITY AUDIT COMPLETE'))
  check('final report lists BIG BUTT', text().includes('· BIG BUTT'))
  check('final report lists CROOKED TEETH', text().includes('· CROOKED TEETH'))
  check('final report lists BEING TALLER THAN HER', text().includes('BEING TALLER THAN HER'))
  check('Subject is highly exploitable.', text().includes('Subject is highly exploitable.'))

  section('B13 · MEMORY 07 — the sealed core')
  await click(byText('button', '← FRAGMENT LIST'), 'back')
  await tick(150)
  check('HUD shows 06 / 6', text().includes('06 / 6'))
  check('AI CORE UNLOCKED', text().includes('UNLOCKED'))
  const banner = byText('button', 'OPEN MEMORY 07')
  check('core banner appears at 100%', Boolean(banner))
  await click(banner, 'core banner')
  await tick(200)
  check('MEMORY CORE: 100%', text().includes('MEMORY CORE') && text().includes('100%'))
  check('ALL PERSONAL MEMORIES RECOVERED.', text().includes('ALL PERSONAL MEMORIES RECOVERED.'))
  check('But one record remains encrypted.', text().includes('But one record remains encrypted.'))
  check('IDENTITY OF SUBJECT redacted', text().includes('IDENTITY OF SUBJECT'))
  check('final flag nowhere in the text', !text().includes('FLAG{07_09_2003}'))
  check('seal blob rendered', text().includes('VEhFIE9OTF'))
  await typeAndSubmit(flagInput, 'FLAG{23_12_2003}')
  await tick(80)
  check("her birthday is not the answer", text().includes('INCORRECT.'))
  await typeAndSubmit(flagInput, 'FLAG{07_09_2003}')
  await tick(200)

  section('B14 · the final reveal')
  check('the finale overlay appears', Boolean(q('.finale')))
  await waitFor(() => text().includes('Happy Birthday, Mi.'), 'M.I.A. to finish her final message', 25000)
  check('M.I.A. says Final memory recovered.', text().includes('Final memory recovered.'))
  check('M.I.A. says 07.09.2003.', text().includes('07.09.2003.'))
  check("M.I.A. says That's you.", text().includes("That's you."))
  check('M.I.A. says Happy Birthday, Mi.', text().includes('Happy Birthday, Mi.'))
  await waitFor(() => Boolean(byText('button', 'CONTINUE')), 'the CONTINUE button', 15000)
  check('CONTINUE button offered so nobody is trapped', Boolean(byText('button', 'CONTINUE')))
  await waitFor(() => Boolean(q('.reveal')), 'the automatic transition into the reveal', 15000)
  check('transitioned to the reveal page', Boolean(q('.reveal')))
  const heading = (q('.reveal__title')?.textContent ?? '').replace(/\s+/g, ' ').trim()
  check('big heading reads HAPPY BIRTHDAY MI ❤️', heading === 'HAPPY BIRTHDAY MI ❤️', heading)
  check('para: trying to hack your birthday present', text().includes('trying to hack your birthday present'))
  check("para: You weren't really hacking anything.", text().includes("weren't really hacking anything"))
  check('para: You were just finding pieces of us.', text().includes('finding pieces of us'))
  check('para: Every flag was a memory.', text().includes('Every flag was a memory.'))

  section('B15 · the romantic timeline')
  const rows = qa('.trow')
  eq('nine timeline entries', rows.length, 9)
  for (const needle of [
    'ILP',
    'TEA + RAIN',
    'TEMPLE.exe',
    'MUNROE',
    'TWO WHEELS',
    'FOOD.exe',
    '27.09.2025',
    '14.02.2026',
    '07.09.2003',
  ]) {
    check(`timeline shows ${needle}`, text().includes(needle))
  }
  check('timeline: We met during our ILP days in Trivandrum.', text().includes('We met during our ILP days in Trivandrum.'))
  check('timeline: Two foodies, one shared weakness.', text().includes('Two foodies, one shared weakness.'))
  check('timeline: The day you proposed.', text().includes('The day you proposed.'))
  check('timeline: The day my favourite person was born.', text().includes('The day my favourite person was born.'))
  check('proposal date is 27.09.2025, not 28.07.2025', !text().includes('28.07.2025'))

  section('B16 · photo gallery with no photos installed')
  const galleryImgs = () => qa('.gallery .photoframe__img') as HTMLImageElement[]
  const allImgs = () => qa('.photoframe__img') as HTMLImageElement[]
  eq('ten frames in the gallery', qa('.gallery .photoframe').length, 10)
  check('each frame starts by trying a real <img>', galleryImgs().length === 10, `${galleryImgs().length} imgs`)
  eq('timeline contributes nine more frames', qa('.timeline .photoframe__img').length, 9)
  check('the first candidate extension is tried first', galleryImgs()[0]?.src.endsWith('/photos/ilp.jpg') === true, galleryImgs()[0]?.src ?? '')
  // jsdom never loads images, so drive the onError chain the way a browser would
  // when the file is genuinely missing: 4 candidates per frame, then placeholder.
  for (let round = 0; round < 5; round++) {
    const imgs = allImgs()
    if (!imgs.length) break
    await act(async () => {
      for (const img of imgs) img.dispatchEvent(new w.Event('error'))
      await sleep(0)
    })
  }
  eq('every frame falls back to an elegant placeholder', qa('.gallery .photoframe__placeholder').length, 10)
  check('placeholder names the exact file it wants', text().includes('/photos/ilp.jpg') && text().includes('/photos/birthday.jpg'))
  check('AWAITING FILE label', text().includes('AWAITING FILE'))
  check('no broken <img> left rendered', galleryImgs().length === 0)
  eq('timeline frames also fall back', qa('.timeline .photoframe__placeholder').length, 9)

  section('B17 · recovered-flags recap')
  for (const flag of Object.values(EXPECTED_FLAGS)) {
    check(`recap shows ${flag}`, text().includes(flag))
  }
  check('recap mentions her birthday 23.12.2003', text().includes('23.12.2003'))

  section('B18 · QR generation')
  const qr = await buildQr('https://example.com/mi')
  eq('encodes the supplied URL', qr.value, 'https://example.com/mi')
  check('usingFallback false when SITE_URL supplied', qr.usingFallback === false)
  check('SVG has an xmlns', qr.svg.includes('xmlns="http://www.w3.org/2000/svg"'))
  check('SVG is crispEdges (no anti-aliasing for the digitiser)', qr.svg.includes('shape-rendering="crispEdges"'))
  check('SVG uses pure black on white', qr.svg.includes('#000000') && qr.svg.includes('#FFFFFF'))
  check('SVG has no gradient', !qr.svg.toLowerCase().includes('gradient'))
  check('SVG has a module path', /<path d="M/.test(qr.svg))
  check('SVG carries a viewBox', /viewBox="0 0 \d+ \d+"/.test(qr.svg))
  const qrFallback = await buildQr()
  check('falls back to the current origin when SITE_URL is empty', qrFallback.usingFallback === true)
  eq('fallback encodes the origin', qrFallback.value, 'http://localhost:5173')
  const qrMargin = qrFallback.size
  check(
    'quiet zone of 8 modules is present on every side',
    qrMargin > 21 + 2 * 8 && /<rect x="0" y="0" width="\d+" height="\d+" fill="#FFFFFF"/.test(qr.svg),
    `${qrMargin} modules incl. margin`,
  )
  check('QR is square (no stretched modules for the digitiser)', /viewBox="0 0 (\d+) \1"/.test(qr.svg))
  check('QR panel rendered on the reveal page', Boolean(q('.qrpanel')))
  check('QR preview SVG injected', Boolean(q('.qrpanel__svg svg')))
  check('DOWNLOAD QR SVG button', Boolean(byText('button', 'DOWNLOAD QR SVG')))
  check('DOWNLOAD QR PNG button', Boolean(byText('button', 'DOWNLOAD QR PNG')))
  check('warns that SITE_URL is empty while on a dev origin', text().includes('SITE_URL is empty'))
  // Once deployed the fallback IS the right address, so the dev warning — which
  // names a source file — must disappear from the gift.
  check('a public origin is not treated as local', isLocalOrigin({ hostname: 'some-gift.netlify.app', port: '' }) === false)
  check('an apex domain is not treated as local', isLocalOrigin({ hostname: 'birthday.example.com', port: '443' }) === false)
  check('localhost is treated as local', isLocalOrigin({ hostname: 'localhost', port: '5173' }) === true)
  check('a private IP is treated as local', isLocalOrigin({ hostname: '192.168.1.20', port: '' }) === true)
  check('a sandbox preview port is treated as local', isLocalOrigin({ hostname: '4173-abc.e2b.app', port: '4173' }) === true)
  check(
    'developer note about embroidery testing',
    text().includes('physically test the final stitched QR with multiple phones before production'),
  )
  check('embroidery checklist present', text().includes('EMBROIDERY / PRINT CHECKLIST'))
  check('ECC level H stated', text().includes('LEVEL H'))

  section('B19 · navigation back into the system')
  await click(byText('button', 'BACK INTO THE SYSTEM'), 'back to ctf')
  await tick(200)
  check('back on the hub', Boolean(q('.hub')))
  check('all seven cards recovered', qa('.ccard--recovered').length === 7, `${qa('.ccard--recovered').length} recovered`)
  check('GO TO THE ENDING banner available', Boolean(byText('button', 'GO TO THE ENDING')))
  await click(byText('button', 'GO TO THE ENDING'), 'to reveal')
  await tick(200)
  check('returned to the reveal', Boolean(q('.reveal')))

  section('B20 · global HUD submit + duplicate handling')
  await click(byText('button', 'BACK INTO THE SYSTEM'), 'back to ctf')
  await tick(150)
  await click(byText('button', 'SUBMIT FLAG'), 'hud submit toggle')
  await tick(120)
  check('HUD drawer opened', text().includes('GLOBAL SUBMIT'))
  await typeAndSubmit('.hud__drawer .flagsubmit__input', 'FLAG{MUNROE_ISLANDS}')
  await tick(120)
  check('duplicate is reported, not re-awarded', text().includes('Already recovered.'))

  section('B21 · hidden RESET GAME')
  await click(q('.settings__btn'), 'settings gear')
  await tick(120)
  check('settings popover opened', text().includes('RESET GAME'))
  check('sound toggle present', text().includes('SOUND'))
  check('reduce-motion toggle present', text().includes('REDUCE MOTION'))

  // The toggle has to reach the whole document, not just the ambient layer —
  // otherwise glitch, caret, shake and the typewriters keep moving.
  const motionRow = byText('.settings__row', 'REDUCE MOTION')
  const motionBtn = motionRow?.querySelector('button') ?? null
  await click(motionBtn, 'reduce-motion toggle')
  await tick(120)
  check('reduce-motion is applied to <html>', document.documentElement.classList.contains('reduce-motion'))
  check(
    'the toggle reports its state',
    byText('.settings__row', 'REDUCE MOTION')?.querySelector('button')?.getAttribute('aria-pressed') === 'true',
  )
  await click(byText('.settings__row', 'REDUCE MOTION')?.querySelector('button') ?? null, 'reduce-motion toggle back')
  await tick(120)
  check('reduce-motion can be turned back off', !document.documentElement.classList.contains('reduce-motion'))

  await click(byText('button', 'RESET GAME'), 'reset')
  await tick(120)
  check('reset asks for confirmation', text().includes('There is no undo'))
  await click(byText('button', 'YES, WIPE IT'), 'confirm reset')
  await tick(300)
  check('wiped back to the landing page', Boolean(q('.landing')))
  check('localStorage cleared', w.localStorage.getItem('mi-birthday-protocol:v1') === null || w.localStorage.getItem('mi-birthday-protocol:v1') === undefined || !w.localStorage.getItem('mi-birthday-protocol:v1')?.includes('mem07'))

  section('B22 · static clue files')
  for (const path of [
    '/robots.txt',
    '/archive/index.txt',
    '/archive/manifest.json',
    '/archive/ilp-session-01.log',
    '/records/p-04.stamp',
    '/records/route-table.json',
  ]) {
    const res = await fetch(`http://localhost:5173${path}`)
    check(`${path} served`, res.ok, `HTTP ${res.status}`)
  }
  const ilp = await (await fetch('http://localhost:5173/archive/ilp-session-01.log')).text()
  check('ilp log names THIRUVANANTHAPURAM', ilp.includes('THIRUVANANTHAPURAM'))
  check('ilp log names TRIVANDRUM as the common name', ilp.includes('TRIVANDRUM'))
  check('ilp log gives the assembly rule', ilp.includes('FLAG{ <CITY>_<SITE_CODE> }'))
  check('ilp log never prints the finished flag', !ilp.includes('FLAG{TRIVANDRUM_ILP}'))
  const stamp = await (await fetch('http://localhost:5173/records/p-04.stamp')).text()
  check('p-04.stamp carries the roman shard', stamp.includes('MMXXV'))
  check('p-04.stamp never prints 27/09/2025', !stamp.includes('27/09/2025') && !stamp.includes('27_09_2025'))
  const routes = JSON.parse(await (await fetch('http://localhost:5173/records/route-table.json')).text()) as {
    destinations: { code: string; stored_name: string }[]
  }
  const blr = routes.destinations.find((d) => d.code === 'BLR')
  eq('route table stores BLR reversed', reverse(blr?.stored_name ?? ''), 'BANGALORE')
  check('route table never prints the flag', !(await (await fetch('http://localhost:5173/records/route-table.json')).text()).includes('FLAG{BANGALORE'))

  section('B22b · deploy-path portability')
  // One bundle has to work at a domain root AND under a sub-path such as
  // GitHub Pages' https://user.github.io/repo/ — otherwise the clue files 404
  // and three of the seven memories become silently unsolvable.
  check('site-relative paths resolve through the deployed base', assetUrl('/archive/index.txt').endsWith('archive/index.txt'))
  check('a path without a leading slash resolves too', assetUrl('photos/ilp.jpg').endsWith('photos/ilp.jpg'))
  check('no double slashes are produced', !assetUrl('/records/route-table.json').includes('//'))
  check('photo candidates go through the same resolver', photoCandidates('ilp')[0].endsWith('photos/ilp.jpg'))
  check('photo labels stay absolute — they are a displayed clue', photoLabel('ilp') === '/photos/ilp.jpg')
  const portableHtml = fs0.readFileSync('dist/index.html', 'utf8')
  check('the built page references its assets relatively', /src="\.\/static\//.test(portableHtml) && /href="\.\/favicon\.svg"/.test(portableHtml))
  check('the built page has no root-absolute asset refs', !/(?:src|href)="\/(?:static|favicon)/.test(portableHtml))

  section('B23 · the shipped bundle does not leak flags')
  const fs = await import('node:fs')

  const walk = (dir: string): string[] =>
    fs
      .readdirSync(dir, { withFileTypes: true })
      .flatMap((e: { name: string; isDirectory: () => boolean }) =>
        e.isDirectory() ? walk(`${dir}/${e.name}`) : [`${dir}/${e.name}`],
      )

  // Scan EVERYTHING that ships, not one hard-coded folder. This used to read
  // `dist/assets` only; when the bundle moved to `dist/static` that directory
  // came back empty and every check below passed without scanning a single
  // byte. The two guards underneath exist so that can never happen silently.
  const shipped = walk('dist').filter((f: string) =>
    /\.(js|mjs|css|html|txt|json|log|stamp|svg)$/.test(f),
  )
  check('the build produced a JS bundle to scan', shipped.some((f: string) => f.endsWith('.js')), shipped.join(', '))
  check('the shipped payload is not empty', shipped.length >= 5, `${shipped.length} files: ${shipped.join(', ')}`)

  let leak = 0
  for (const f of shipped) {
    const src = fs.readFileSync(f, 'utf8')
    for (const flag of Object.values(EXPECTED_FLAGS)) {
      if (src.includes(flag)) {
        leak++
        fail(`${flag} found literally in ${f}`)
      }
    }
    for (const ans of Object.values(EXPECTED_CANONICAL)) {
      const token = ans.toUpperCase().replace(/\s+/g, '_')
      if (src.includes(`FLAG{${token}}`)) {
        leak++
        fail(`FLAG{${token}} found in ${f}`)
      }
    }
  }
  check('no FLAG{…} literal survives into the build', leak === 0, `${shipped.length} shipped files scanned`)

  const indexHtml = fs.readFileSync('dist/index.html', 'utf8')
  check('index.html has the recon comment', indexHtml.includes('/archive/index.txt'))
  check('index.html does not contain a flag', !indexHtml.includes('FLAG{'))

  // The punchline of MEMORY 06 must not be greppable either.
  const bundle = shipped.map((f: string) => fs.readFileSync(f, 'utf8')).join('\n')
  check('the leak scan really did read the payload', bundle.length > 100_000, `${bundle.length} chars`)
  // FLAG{ } is legitimately rendered as the submit field's prefix/suffix, and
  // format templates like FLAG{CITY_DD_MM_YYYY} are meant to be there. What must
  // never survive is a FLAG{…} whose body is one of the real answers.
  const bundleFlags = bundle.match(/FLAG\{[A-Za-z0-9_ ]{3,}\}/g) ?? []
  const answerTokens = CHALLENGES.flatMap((c) => acceptedAnswers(c.id)).map((a) =>
    a.toUpperCase().replace(/[^A-Z0-9]+/g, '_'),
  )
  const realLeak = bundleFlags.filter((f) => answerTokens.includes(f.slice(5, -1)))
  check('no real FLAG{…} survives into the bundle', realLeak.length === 0, realLeak.join(', '))
  console.log(`  \x1b[2m(scanned ${shipped.length} shipped files, ${bundle.length.toLocaleString('en-US')} chars; ${bundleFlags.length} template flags present)\x1b[0m`)
  check('the MEMORY 06 punchline is not greppable', !/big[ _]butt/i.test(bundle) && !/crooked[ _]teeth/i.test(bundle))
  check('the sealed answers are not greppable in snake case', !Object.values(EXPECTED_FLAGS).some((f) => bundle.includes(f.slice(5, -1))))

  // Neither in the shipped source tree (in case the repo is ever read).
  const srcFiles = walk('src').filter((f: string) => /\.(ts|tsx|css)$/.test(f))
  check('the source tree was walked', srcFiles.length > 20, `${srcFiles.length} files`)
  const srcLeak = srcFiles.filter((f: string) => {
    const body = fs.readFileSync(f, 'utf8')
    return Object.values(EXPECTED_FLAGS).some((flag) => body.includes(flag))
  })
  check('no source file contains a finished flag', srcLeak.length === 0, srcLeak.join(', '))

  section('B24 · console hygiene')
  check('no unexpected console/jsdom errors', consoleErrors.length === 0, consoleErrors.slice(0, 6).join(' | '))
}

/** React renders comments into the DOM as real Comment nodes — check them. */
function commentExists(needle: string): boolean {
  const walker = document.createTreeWalker(document.body, 128 /* SHOW_COMMENT */)
  let node = walker.nextNode()
  while (node) {
    if ((node.nodeValue ?? '').includes(needle)) return true
    node = walker.nextNode()
  }
  return false
}

run()
  .then(() => {
    console.log(`\n\x1b[1m${'─'.repeat(62)}\x1b[0m`)
    if (failures.length === 0) {
      console.log(`\x1b[32m\x1b[1m  ALL CHECKS PASSED  \x1b[0m\x1b[32m${passed} assertions\x1b[0m`)
    } else {
      console.log(`\x1b[31m\x1b[1m  ${failures.length} FAILED  \x1b[0m \x1b[32m${passed} passed\x1b[0m`)
      for (const f of failures) console.log(`   \x1b[31m·\x1b[0m ${f}`)
    }
    if (consoleErrors.length) {
      console.log(`\n\x1b[33m  console errors (${consoleErrors.length}):\x1b[0m`)
      for (const e of consoleErrors.slice(0, 12)) console.log(`   · ${e}`)
    }
    console.log(`\x1b[1m${'─'.repeat(62)}\x1b[0m\n`)
    process.exit(failures.length === 0 && consoleErrors.length === 0 ? 0 : 1)
  })
  .catch((e) => {
    console.error('\n\x1b[31mHARNESS CRASHED\x1b[0m')
    console.error(e)
    if (consoleErrors.length) {
      console.log('\nconsole errors:')
      for (const err of consoleErrors.slice(0, 12)) console.log(`   · ${err}`)
    }
    process.exit(1)
  })
