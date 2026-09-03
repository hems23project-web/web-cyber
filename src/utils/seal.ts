/**
 * seal.ts — keeps the real answers out of the shipped source.
 *
 * Every flag answer in this project is stored XOR-sealed + base64, keyed by the
 * challenge id. Nothing in the built bundle contains a searchable
 * `FLAG{...}` literal, and the accepted answers are never printed as plain
 * strings anywhere in `src/`.
 *
 * To change or add an answer, run:
 *
 *     node scripts/seal.mjs "SOME ANSWER" --id mem01
 *
 * and paste the result into `src/data/challenges.ts`.
 */

const SEAL_SALT = 'MI//BIRTHDAY-PROTOCOL//07092003'

/** Deterministic FNV-1a derived keystream, unique per sealed record id. */
function keyStream(id: string): number[] {
  const seed = `${SEAL_SALT}::${id}`
  const out: number[] = []
  let h = 0x811c9dc5
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 0x01000193) >>> 0
    out.push(h & 0xff)
  }
  // widen the stream so it never repeats within a short answer
  while (out.length < 64) {
    h ^= out[out.length % 32] + out.length
    h = Math.imul(h, 0x01000193) >>> 0
    out.push(h & 0xff)
  }
  return out
}

function b64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return bytes
}

function bytesToB64(bytes: Uint8Array): string {
  let bin = ''
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i])
  return btoa(bin)
}

/** Runtime: recover a sealed answer. */
export function unseal(id: string, payload: string): string {
  const bytes = b64ToBytes(payload)
  const ks = keyStream(id)
  let out = ''
  for (let i = 0; i < bytes.length; i++) {
    out += String.fromCharCode(bytes[i] ^ ks[i % ks.length])
  }
  return out
}

/** Build-time helper (used by scripts/seal.mjs). Not called in the app. */
export function seal(id: string, plain: string): string {
  const ks = keyStream(id)
  const bytes = new Uint8Array(plain.length)
  for (let i = 0; i < plain.length; i++) {
    bytes[i] = plain.charCodeAt(i) ^ ks[i % ks.length]
  }
  return bytesToB64(bytes)
}
