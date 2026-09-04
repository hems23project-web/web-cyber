# MI // BIRTHDAY PROTOCOL

An interactive memory CTF built as a birthday gift for **Mi (Mithun)**.

The whole thing rests on one rule: **every flag is a real memory.** There are no
generic CTF answers anywhere — no `FLAG{INSPECT_SOURCE}`, no throwaway strings.
The puzzles, the encodings and M.I.A. only exist to make him *discover* something
true about the two of you.

He starts on a soft, romantic landing page ("happy birthday"), gets pulled into a
birthday protocol briefing, then into a seven-memory CTF, and lands on a final
reveal that is very clearly about him.

Target solve time: **30–60 minutes** for someone who plays CTFs. Medium difficulty.

---

## 1. Do these four things before you give it to him

Nothing else is required — the site runs and looks finished without them — but
these are the personal touches.

### a) Drop in your photos

Put files with these **exact** names in [`public/photos/`](public/photos):

`ilp` · `tea-rain` · `temple-01` · `temple-02` · `munroe` · `talks` · `food` ·
`proposal` · `bangalore` · `birthday`

`.jpg`, `.jpeg`, `.png` or `.webp` all work (tried in that order). A missing file
renders a tasteful placeholder that names the file it's waiting for, so nothing
ever looks broken — but with real photos it lands completely differently.
Full table in [`public/photos/README.md`](public/photos/README.md).

> The filenames are fixed on purpose: one of them is itself a clue in MEMORY 02.

`public/photos/` is **not** gitignored — commit your photos so they deploy with
the site.

### b) Check the timeline

Section 12 of the config, `TIMELINE` — nine entries, each with a date, a label,
a line of copy and an optional photo. It's plain data; edit the words, reorder,
or change which photo goes with which entry.

One thing worth knowing: the proposal date is **27/09/2025** everywhere in this
build (that's what MEMORY 04 resolves to). If any timeline entry disagrees, fix
the timeline, not the flag.

### c) If you want a physical QR, make it offline

The site deliberately shows **no QR code** — the reveal stays purely about him.
If you ever want one, any external generator will do; the Nayuki demo
(nayuki.io/page/qr-code-generator-library) is the useful one because it lets you
set the version, i.e. the number of boxes, directly. Encode the deployed address
in UPPERCASE (`HTTPS://YOUR-SITE.NETLIFY.APP/`) — addresses are case-insensitive,
and uppercase shrinks the grid from 37×37 to 25×25 at error correction L, or
29×29 at M. Keep it black on white with a white border of at least four modules.

---

## 2. Run it

```bash
npm install
npm run dev        # http://localhost:5173
```

```bash
npm run build      # typecheck + production bundle into dist/
npm run preview    # serve the built site locally
npm run verify     # full end-to-end check (see §6)
npm run verify:fast  # same, skipping the rebuild
```

There is no backend, no API key, no network dependency. M.I.A. runs on a
deterministic scripted engine in the browser. The whole site works offline once
loaded.

### Deploying

The app is a **single static page** — navigation is internal state
(`landing → protocol → ctf → reveal`), not URLs. So any static host works with
zero rewrite rules: Netlify, Vercel, Cloudflare Pages, GitHub Pages, or
`dist/` dropped on any file server. Build with `npm run build`, publish `dist/`.

The build uses a **relative `base`** and every clue file, photo and favicon is
resolved through `assetUrl()` (`src/utils/paths.ts`), so the *same* `dist/` works
at a domain root **and** under a sub-path like `https://user.github.io/repo/`.
That matters more than it sounds: the puzzles point at `/archive/…` and
`/records/…`, and if those 404 then three of the seven memories become
unsolvable with no visible error. Don't hardcode a leading-slash URL for
anything the browser fetches — go through `assetUrl()`.

---

## 3. The flow

| Phase | What he sees |
| --- | --- |
| **Landing** | Soft, romantic, handcrafted. Birthday message, a typewritten letter, one button. Deliberately *not* hacker-y. |
| **Protocol** | The briefing boot sequence — the moment the tone shifts. |
| **CTF** | The HUD (memories recovered, AI core status, global flag submit, progress) plus the seven memory cards, M.I.A.'s terminal, the decoder toolbox and the system files. |
| **Reveal** | Earned only after all six memories + the final core. Photo gallery, the romantic timeline, the audit report and the birthday reveal. |

The HUD is persistent across the CTF phase. Progress is written to
`localStorage` under `mi-birthday-protocol:v1`, so **refreshing never loses
anything** — flags, hints used, M.I.A.'s state and the reveal unlock all survive.

A hidden **RESET GAME** lives in the HUD settings menu (with a confirmation) so
you can wipe state and play through it yourself.

Two navigation rules, both covered by the harness: **refreshing the same tab
resumes exactly where you were**, but **opening the link again in a new tab
always starts at the landing page** — the view restarts, the recovered memories
don't. And every phase except the landing offers a one-step back link
(`← the briefing`, `← the system`, `← the ending`) that never touches progress.

---

## 4. The seven memories

⚠️ **Spoilers.** This section is for you, not for him. Don't leave this tab open
on a shared screen.

| # | Memory | Answer | How it's found |
| --- | --- | --- | --- |
| 01 | ILP, Trivandrum | `FLAG{TRIVANDRUM_ILP}` | HTML source comments + `/archive/ilp-session-01.log` |
| 02 | Tea in the rain | `FLAG{TEA_IN_THE_RAIN}` | JS + base64/hex fragments; unlocks M.I.A. |
| 03 | Munroe Islands | `FLAG{MUNROE_ISLANDS}` | M.I.A. hands over ASCII decimals (`109 117 110 114 111 101`) plus a reversed base64 chunk |
| 04 | The promise | `FLAG{27_09_2025}` | Hex shard + base64 + roman numerals in `/records/p-04.stamp` |
| 05 | Bangalore | `FLAG{BANGALORE_14_02_2026}` | `MjAyNi0wMi0xNA==` + the reversed city in `/records/route-table.json` |
| 06 | The running joke | `FLAG{BIG_BUTT_CROOKED_TEETH}` | Wordplay on `VULN_03` / `VULN_04` in the audit report — A1Z26 and ROT13 |
| 07 | Final core | `FLAG{07_09_2003}` | Multi-stage, derived from codename `MI-07092003` and the landing page's `07.09.2003` |

Acceptance is forgiving: the checker upper-cases, strips the `FLAG{}` wrapper,
collapses any non-alphanumeric run to `_`, and trims. So `FLAG{27/09/2025}`,
`27.09.2025`, `27092025` and `27 SEPTEMBER 2025` all land. Aliases per memory
live in `ANSWERS` inside [`scripts/seal.mjs`](scripts/seal.mjs).

Wrong submissions always say *"INCORRECT. The memory remains locked."* — an error
never leaks a character of the answer. Correct ones say *"✓ MEMORY RECOVERED."*

### M.I.A.

She's a scripted, deterministic conversational engine
([`src/ai/`](src/ai), rules in [`src/data/miaDialogue.ts`](src/data/miaDialogue.ts)).
Each recovered memory unlocks new lines of her personality and new things she'll
talk about. Two hard rules she never breaks:

- she **never** dumps an answer for a memory he hasn't recovered;
- she never says the word "proposal" before MEMORY 04 is solved.

There's an optional local-model adapter behind the same interface, but nothing
requires it and nothing phones home.

### Hints

Three per memory, tracked, no penalty. Using all three costs nothing except that
the HUD remembers.

---

## 5. How the answers are hidden

A CTF where `grep` finds the flag isn't a CTF. So:

- every accepted answer is stored **sealed** — an XOR keystream derived from the
  salt `MI//BIRTHDAY-PROTOCOL//07092003`, base64'd
  ([`src/utils/seal.ts`](src/utils/seal.ts));
- `FLAG{…}` strings are only ever assembled at **runtime**, never written whole
  in source or in the bundle;
- the MEMORY 06 punchline words are sealed too — config, solved-lines copy and
  M.I.A.'s matcher keywords all derive them at runtime, so the joke isn't
  greppable in the shipped JS.

Regenerate the payloads if you change an answer:

```bash
node scripts/seal.mjs --all      # every accepted flag answer
node scripts/seal.mjs --jokes    # the two MEMORY 06 joke phrases
node scripts/seal.mjs --verify   # round-trip check
node scripts/seal.mjs "NEW ANSWER" --id mem03#0
```

**One honest caveat.** The site *tells the story* of your relationship, so the
prose in `MEMORIES` and `TIMELINE` legitimately contains words like "Munroe
Islands", "Trivandrum" and "Bangalore" — that's the gift, not a leak. What is
guaranteed is that no complete flag, and no answer in its accepted
`UPPER_SNAKE_CASE` form, appears anywhere in source or in the built bundle.
Don't send him the repo link; send him the deployed site.

---

## 6. Verification

```bash
npm run verify
```

A jsdom-driven end-to-end harness
([`scripts/verify.entry.tsx`](scripts/verify.entry.tsx)) boots the real app and
plays it: **316 assertions**, currently all passing. It covers

- the full solve path, memory by memory, including the multi-stage final core;
- hint tracking, wrong-answer messaging, persistence across a simulated refresh;
- M.I.A.'s progression and her never leaking an unrecovered answer;
- the static puzzle files (`/archive/*`, `/records/*`) resolving;
- the gallery + timeline falling back to placeholders when photos are missing;
- **leak scans** over every file that ships in `dist/` and over `src/`: no real
  flag, no snake-case answer, no joke words. The scan guards against coming back
  empty, because it once did — `dist/assets` was renamed to `dist/static`, the
  file list came back empty, and the checks passed without reading a single byte;
- zero unexpected console errors.

Run it after any copy or config edit. `verify:fast` skips the production rebuild
if you only touched app logic.

---

## 7. Where things live

```
src/
  data/
    birthdayConfig.ts   ← EVERYTHING personal. Dates, people, memories, all
                          copy, photos, timeline, reveal. Edit here.
    challenges.ts       ← the 7 memories: puzzles, hints, sealed answers
    miaDialogue.ts      ← M.I.A.'s conversational rules
  ai/                   ← scripted engine + optional local-model adapter
  challenges/           ← one component per memory
  components/           ← HUD, M.I.A. terminal, decoder toolbox, flag submit,
                          hints, settings
  pages/                ← landing, protocol, ctf, reveal
  utils/                ← seal, encoding, flags, format, sound
  styles/
public/
  photos/               ← your photos (fixed filenames)
  archive/, records/    ← the static files the puzzles point at
  assets/               ← anything else static you want to add
scripts/
  seal.mjs              ← regenerate sealed payloads
  verify.mjs / verify.entry.tsx / jsdom-env.ts  ← the harness
```

The decoder toolbox (base64, hex, ROT13, reverse, A1Z26, ASCII, binary, URL and
"TRY EVERYTHING") is on-page, so every puzzle is solvable without leaving the
site or opening a terminal.
