#!/usr/bin/env node
/**
 * scripts/seal.mjs — generate sealed answer payloads.
 *
 *   node scripts/seal.mjs --all      # every flag answer the app accepts
 *   node scripts/seal.mjs --jokes    # the two running joke phrases (MEMORY 06)
 *   node scripts/seal.mjs --verify   # round-trip check
 *   node scripts/seal.mjs "SOME ANSWER" --id mem01
 *
 * Keep this in sync with src/utils/seal.ts (same salt, same keystream).
 */

const SEAL_SALT = 'MI//BIRTHDAY-PROTOCOL//07092003'

function keyStream(id) {
  const seed = `${SEAL_SALT}::${id}`
  const out = []
  let h = 0x811c9dc5
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 0x01000193) >>> 0
    out.push(h & 0xff)
  }
  while (out.length < 64) {
    h ^= out[out.length % 32] + out.length
    h = Math.imul(h, 0x01000193) >>> 0
    out.push(h & 0xff)
  }
  return out
}

function seal(id, plain) {
  const ks = keyStream(id)
  const bytes = Buffer.from(
    Array.from(plain, (_, i) => plain.charCodeAt(i) ^ ks[i % ks.length]),
  )
  return bytes.toString('base64')
}

function unseal(id, payload) {
  const bytes = Buffer.from(payload, 'base64')
  const ks = keyStream(id)
  return Array.from(bytes, (b, i) => String.fromCharCode(b ^ ks[i % ks.length])).join('')
}

/** Every answer the app accepts (canonical first, then forgiving aliases). */
const ANSWERS = {
  mem01: ['TRIVANDRUM ILP', 'THIRUVANANTHAPURAM ILP', 'ILP TRIVANDRUM', 'TVM ILP'],
  mem02: ['TEA IN THE RAIN', 'TEA IN RAIN', 'TEA RAIN', 'TEA DATE IN THE RAIN'],
  mem03: ['MUNROE ISLANDS', 'MUNROE ISLAND', 'MUNRO ISLANDS', 'MUNROE ISLANDS KOLLAM'],
  mem04: ['27/09/2025', '27-09-2025', '27.09.2025', '27092025', '2025-09-27', '27 SEPTEMBER 2025'],
  mem05: [
    'BANGALORE 14/02/2026',
    'BANGALORE 14-02-2026',
    'BANGALORE 14.02.2026',
    'BENGALURU 14/02/2026',
    'BLR 14/02/2026',
    'BANGALORE 2026-02-14',
    'BANGALORE 14022026',
  ],
  mem06: [
    'BIG BUTT CROOKED TEETH',
    'CROOKED TEETH BIG BUTT',
    'BIG BUTT AND CROOKED TEETH',
    'CROOKED TEETH AND BIG BUTT',
  ],
  mem07: ['07/09/2003', '07-09-2003', '07.09.2003', '07092003', '2003-09-07', '7 SEPTEMBER 2003', '7/9/2003'],
}

/**
 * The running jokes are sealed too: grepping the bundle for the punchline would
 * spoil MEMORY 06 before it is earned.
 */
const JOKES = {
  'joke#buttName': 'BIG BUTT',
  'joke#teethName': 'CROOKED TEETH',
  'joke#buttPhrase': 'Mi having a big butt.',
  'joke#teethPhrase': 'Mi having crooked teeth.',
}

const args = process.argv.slice(2)
const mode = args[0]

function report(id, plain) {
  const payload = seal(id, plain)
  const good = unseal(id, payload) === plain
  console.log(`    ${id.padEnd(20)} ${JSON.stringify(payload).padEnd(34)} // ${good ? 'ok' : 'MISMATCH'}`)
}

if (mode === '--all') {
  for (const [id, list] of Object.entries(ANSWERS)) {
    console.log(`\n  ${id}:`)
    list.forEach((plain, i) => report(`${id}#${i}`, plain))
  }
  console.log('\n  jokes:')
  for (const [id, plain] of Object.entries(JOKES)) report(id, plain)
} else if (mode === '--jokes') {
  for (const [id, plain] of Object.entries(JOKES)) report(id, plain)
} else if (mode === '--verify') {
  let bad = 0
  const check = (id, plain) => {
    if (unseal(id, seal(id, plain)) !== plain) bad++
  }
  for (const [id, list] of Object.entries(ANSWERS)) list.forEach((plain, i) => check(`${id}#${i}`, plain))
  for (const [id, plain] of Object.entries(JOKES)) check(id, plain)
  console.log(bad === 0 ? 'all seals round-trip cleanly' : `${bad} seal mismatches`)
  process.exit(bad === 0 ? 0 : 1)
} else {
  const idx = args.indexOf('--id')
  const id = idx >= 0 ? args[idx + 1] : 'mem00#0'
  const plain = args.filter((a, i) => !(a === '--id' || i === idx + 1)).join(' ')
  if (!plain) {
    console.error('usage: node scripts/seal.mjs "ANSWER TEXT" --id mem01#0')
    console.error('       node scripts/seal.mjs --all | --jokes | --verify')
    process.exit(1)
  }
  console.log(seal(id, plain))
}
