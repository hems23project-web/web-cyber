import { PHOTO_EXTENSION_ORDER, PHOTOS, PHOTO_DIR, type PhotoKey } from '@/data/birthdayConfig'

/** Candidate URLs for a photo, in the order the loader tries them. */
export function photoCandidates(key: PhotoKey): string[] {
  const base = PHOTOS[key]
  return PHOTO_EXTENSION_ORDER.map((ext) => `${PHOTO_DIR}/${base}.${ext}`)
}

export const photoLabel = (key: PhotoKey) => `${PHOTO_DIR}/${PHOTOS[key]}.jpg`

/** Clamp a number into a range. */
export const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n))

/** Pad with leading zeroes. */
export const pad = (n: number, size = 2) => String(n).padStart(size, '0')

/** "07/09/2003" → "07.09.2003" */
export const dotDate = (d: string) => d.replace(/\//g, '.')

/** Split DD/MM/YYYY. */
export function splitDate(d: string): { dd: string; mm: string; yyyy: string } | null {
  const m = d.match(/^(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{4})$/)
  if (!m) return null
  return { dd: m[1].padStart(2, '0'), mm: m[2].padStart(2, '0'), yyyy: m[3] }
}

/** ISO yyyy-mm-dd → DD_MM_YYYY */
export function isoToDmy(iso: string): string {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  return m ? `${m[3]}_${m[2]}_${m[1]}` : iso
}

/** Deterministic pseudo-random in [0,1) from a string seed — for stable decoration. */
export function seededRandom(seed: string): () => number {
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return () => {
    h ^= h << 13
    h ^= h >>> 17
    h ^= h << 5
    return ((h >>> 0) % 100000) / 100000
  }
}

/** mm:ss elapsed formatter. */
export function formatElapsed(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000))
  return `${pad(Math.floor(total / 60))}:${pad(total % 60)}`
}

/** HH:MM:SS.mmm — for terminal timestamps. */
export function stamp(d: Date = new Date()): string {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

export const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))
