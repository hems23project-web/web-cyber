/**
 * encoding.ts — every cipher the CTF uses, plus a decoder used by the in-app
 * DECODER tool. All client-side, no dependencies, no network.
 *
 * Adding a method here automatically makes it available in the DECODER panel
 * and in "TRY EVERYTHING" mode.
 */

export interface DecodeResult {
  method: string
  output: string
  ok: boolean
}

/* ---------------------------------------------------------------- base64 -- */

export function fromBase64(input: string): string {
  const clean = input.replace(/\s+/g, '')
  if (!clean) return ''
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(clean)) throw new Error('not base64')
  const bin = atob(clean)
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0))
  try {
    return new TextDecoder('utf-8', { fatal: false }).decode(bytes)
  } catch {
    return bin
  }
}

export function toBase64(input: string): string {
  const bytes = new TextEncoder().encode(input)
  let bin = ''
  bytes.forEach((b) => (bin += String.fromCharCode(b)))
  return btoa(bin)
}

/* -------------------------------------------------------------------- hex -- */

export function fromHex(input: string): string {
  let clean = input
    .replace(/0x/gi, ' ')
    .replace(/#/g, ' ')
    .replace(/[,;|]/g, ' ')
    .replace(/\s+/g, '')
  if (!clean) return ''
  if (!/^[0-9a-fA-F]+$/.test(clean)) throw new Error('not hexadecimal')
  if (clean.length % 2 !== 0) clean = '0' + clean
  let out = ''
  for (let i = 0; i < clean.length; i += 2) {
    const code = parseInt(clean.slice(i, i + 2), 16)
    out += String.fromCharCode(code)
  }
  return out
}

export function toHex(input: string, spaced = true): string {
  const parts = Array.from(input).map((c) => c.charCodeAt(0).toString(16).padStart(2, '0').toUpperCase())
  return spaced ? parts.join(' ') : parts.join('')
}

/* ------------------------------------------------------- ascii / decimal -- */

export function fromAsciiDecimal(input: string): string {
  const nums = input.match(/\d+/g)
  if (!nums) return ''
  return nums
    .map((n) => parseInt(n, 10))
    .map((v) => (v === 10 || v === 13 ? '\n' : v >= 32 && v <= 126 ? String.fromCharCode(v) : ''))
    .join('')
}

export function toAsciiDecimal(input: string): string {
  return Array.from(input)
    .map((c) => c.charCodeAt(0))
    .join(' ')
}

/* ----------------------------------------------------------------- binary -- */

export function fromBinary(input: string): string {
  const bits = input.replace(/[^01]/g, '')
  if (!bits || bits.length % 8 !== 0) throw new Error('not 8-bit binary')
  let out = ''
  for (let i = 0; i < bits.length; i += 8) out += String.fromCharCode(parseInt(bits.slice(i, i + 8), 2))
  return out
}

/* ------------------------------------------------------------- rot / caesar */

export function rotN(input: string, n: number): string {
  const shift = ((n % 26) + 26) % 26
  return input.replace(/[a-zA-Z]/g, (ch) => {
    const base = ch <= 'Z' ? 65 : 97
    return String.fromCharCode(((ch.charCodeAt(0) - base + shift) % 26) + base)
  })
}

export const rot13 = (input: string) => rotN(input, 13)

export const atbash = (input: string) =>
  input.replace(/[a-zA-Z]/g, (ch) => {
    const base = ch <= 'Z' ? 65 : 97
    return String.fromCharCode(base + 25 - (ch.charCodeAt(0) - base))
  })

/* ---------------------------------------------------------------- reverse -- */

export const reverse = (input: string) => Array.from(input).reverse().join('')

/* ------------------------------------------------------------------ a1z26 -- */

export function fromA1Z26(input: string): string {
  // "/" (or "|" or a blank line) separates words; anything else is a letter gap.
  const groups = input
    .split(/[/|]+|\n+/)
    .map((g) => g.trim())
    .filter(Boolean)
  if (!groups.length) return ''
  return groups
    .map((g) => {
      const nums = g.match(/\d+/g)
      if (!nums) return ''
      return nums
        .map((n) => parseInt(n, 10))
        .map((v) => (v >= 1 && v <= 26 ? String.fromCharCode(64 + v) : '·'))
        .join('')
    })
    .join(' ')
}

export function toA1Z26(input: string): string {
  return input
    .toUpperCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) =>
      Array.from(w)
        .map((c) => (/[A-Z]/.test(c) ? String(c.charCodeAt(0) - 64) : ''))
        .filter(Boolean)
        .join(' '),
    )
    .join(' / ')
}

/* ------------------------------------------------------------------ roman -- */

const ROMAN_VALUES: [string, number][] = [
  ['M', 1000],
  ['CM', 900],
  ['D', 500],
  ['CD', 400],
  ['C', 100],
  ['XC', 90],
  ['L', 50],
  ['XL', 40],
  ['X', 10],
  ['IX', 9],
  ['V', 5],
  ['IV', 4],
  ['I', 1],
]

export function fromRoman(input: string): number | null {
  const s = input.trim().toUpperCase().replace(/[^MDCLXVI]/g, '')
  if (!s) return null
  let total = 0
  let i = 0
  while (i < s.length) {
    const two = s.slice(i, i + 2)
    const one = s.slice(i, i + 1)
    const hitTwo = ROMAN_VALUES.find(([k]) => k === two)
    const hitOne = ROMAN_VALUES.find(([k]) => k === one)
    if (hitTwo) {
      total += hitTwo[1]
      i += 2
    } else if (hitOne) {
      total += hitOne[1]
      i += 1
    } else {
      return null
    }
  }
  return total
}

/* -------------------------------------------------------------------- url -- */

export function fromUrl(input: string): string {
  try {
    return decodeURIComponent(input)
  } catch {
    throw new Error('not url-encoded')
  }
}

/* -------------------------------------------------------------- printable -- */

export function isPrintable(s: string): boolean {
  if (!s) return false
  const printable = Array.from(s).filter((c) => {
    const code = c.codePointAt(0) ?? 0
    return code === 9 || code === 10 || code === 13 || (code >= 32 && code !== 127)
  }).length
  return printable / s.length > 0.9
}

/* --------------------------------------------------------------- registry -- */

export interface DecoderMethod {
  id: string
  label: string
  run: (input: string) => string
  note?: string
  /** Brute-force methods always "succeed", so they are excluded from TRY EVERYTHING. */
  brute?: boolean
}

export const DECODERS: DecoderMethod[] = [
  { id: 'base64', label: 'BASE64', run: fromBase64 },
  { id: 'hex', label: 'HEX', run: fromHex, note: 'handles 52 41 49 4E and 0x46 0x49' },
  { id: 'ascii', label: 'ASCII DEC', run: fromAsciiDecimal, note: 'handles 109 117 110' },
  { id: 'rot13', label: 'ROT13', run: rot13 },
  {
    id: 'a1z26',
    label: 'A1Z26',
    run: fromA1Z26,
    note: 'A=1 B=2 C=3 …  separate words with /',
  },
  { id: 'reverse', label: 'REVERSE', run: reverse },
  { id: 'atbash', label: 'ATBASH', run: atbash },
  { id: 'binary', label: 'BINARY', run: fromBinary },
  { id: 'roman', label: 'ROMAN → DEC', run: (i) => (fromRoman(i) === null ? '' : String(fromRoman(i))) },
  { id: 'url', label: 'URL DECODE', run: fromUrl },
  { id: 'b64rev', label: 'BASE64 → REVERSE', run: (i) => reverse(fromBase64(i)) },
  { id: 'b64b64', label: 'BASE64 ×2', run: (i) => fromBase64(fromBase64(i)) },
  { id: 'hexb64', label: 'HEX → BASE64', run: (i) => fromBase64(fromHex(i)) },
  { id: 'revb64', label: 'REVERSE → BASE64', run: (i) => fromBase64(reverse(i)) },
  {
    id: 'caesar',
    label: 'CAESAR (all shifts)',
    brute: true,
    run: (i) =>
      /[a-zA-Z]/.test(i)
        ? Array.from({ length: 25 }, (_, k) => `+${String(k + 1).padStart(2, '0')}  ${rotN(i, k + 1)}`).join('\n')
        : '',
  },
]

/** Run one decoder safely. */
export function tryDecode(method: DecoderMethod, input: string): DecodeResult {
  try {
    const output = method.run(input)
    return { method: method.label, output, ok: Boolean(output) && isPrintable(output) }
  } catch {
    return { method: method.label, output: '', ok: false }
  }
}

/** Run every decoder, keep the plausible results, best first. */
export function decodeAll(input: string): DecodeResult[] {
  const trimmed = input.trim()
  if (!trimmed) return []
  const seen = new Set<string>()
  const out: DecodeResult[] = []
  for (const m of DECODERS) {
    if (m.brute) continue
    const r = tryDecode(m, trimmed)
    if (!r.ok) continue
    const key = r.output.trim()
    if (!key || key === trimmed.trim() || seen.has(key)) continue
    seen.add(key)
    out.push(r)
  }
  return out
}
