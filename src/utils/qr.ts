import QRCode from 'qrcode'
import { QR_CONFIG } from '@/data/birthdayConfig'

/**
 * qr.ts — QR generation tuned for physical reproduction (print + embroidery).
 *
 * Deliberate choices:
 *  - error correction level **H** (~30% damage tolerance) — stitching distorts.
 *  - margin of 8 modules — a generous quiet zone, never encroached on.
 *  - pure #000 on pure #FFF — no gradients, no greys, no tone-on-tone.
 *  - square modules, `shape-rendering: crispEdges` — no rounding, no dots,
 *    no anti-aliased edges for a digitiser to "smooth".
 *  - no logo, no overlay, no decorative distortion.
 */

export interface QrBundle {
  /** the value actually encoded */
  value: string
  /** whether SITE_URL was set, or we fell back to the current origin */
  usingFallback: boolean
  /** standalone, print-ready SVG */
  svg: string
  /** high-resolution PNG data URL, or null when the browser has no canvas */
  png: string | null
  /** why the PNG could not be produced, if it could not be */
  pngError?: string
  /** module count including quiet zone */
  size: number
}

const BASE_OPTS = {
  errorCorrectionLevel: QR_CONFIG.errorCorrectionLevel,
  margin: QR_CONFIG.margin,
  color: { dark: QR_CONFIG.dark, light: QR_CONFIG.light },
} as const

function extractPath(raw: string): { d: string; viewBox: string } | null {
  const d = raw.match(/\sd="([^"]+)"/)?.[1]
  const vb = raw.match(/\sviewBox="([^"]+)"/)?.[1]
  if (!d || !vb) return null
  return { d, viewBox: vb }
}

export async function buildQr(explicitValue?: string): Promise<QrBundle> {
  const configured = (explicitValue ?? QR_CONFIG.value ?? '').trim()
  const usingFallback = !configured
  const value = configured || (typeof window !== 'undefined' ? window.location.origin : 'https://example.com')

  const rawSvg = (await QRCode.toString(value, { ...BASE_OPTS, type: 'svg' })) as string

  // The PNG path needs a 2D canvas. Every real browser has one; if one is
  // somehow missing we still hand over a perfect SVG rather than failing.
  let png: string | null = null
  let pngError: string | undefined
  try {
    png = await QRCode.toDataURL(value, {
      ...BASE_OPTS,
      scale: QR_CONFIG.pngScale,
      rendererOpts: { quality: 1 },
    })
  } catch (e) {
    pngError = e instanceof Error ? e.message : 'canvas unavailable'
  }

  const parsed = extractPath(rawSvg)
  const viewBox = parsed?.viewBox ?? '0 0 41 41'
  const size = Number(viewBox.split(/\s+/)[2] ?? 41)

  // Rebuild the SVG ourselves so the exported file is exactly what we want a
  // printer or an embroidery digitiser to receive — no width/height in px-only
  // units, no styling surprises, crisp edges, and an explicit white plate.
  const svg = [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="${size}" height="${size}" shape-rendering="crispEdges">`,
    `  <title>MI // BIRTHDAY PROTOCOL</title>`,
    `  <desc>QR code, error correction level H, ${QR_CONFIG.margin}-module quiet zone, square modules. Encodes: ${escapeXml(value)}</desc>`,
    `  <rect x="0" y="0" width="${size}" height="${size}" fill="${QR_CONFIG.light}"/>`,
    `  <path d="${parsed?.d ?? ''}" stroke="${QR_CONFIG.dark}" stroke-width="1" fill="none"/>`,
    `</svg>`,
  ].join('\n')

  return { value, usingFallback, svg, png, pngError, size }
}

function escapeXml(s: string): string {
  return s.replace(/[<>&'"]/g, (c) => `&#${c.charCodeAt(0)};`)
}

/* ---------------------------------------------------------------- download -- */

export function downloadText(filename: string, text: string, mime = 'image/svg+xml;charset=utf-8') {
  const blob = new Blob([text], { type: mime })
  const url = URL.createObjectURL(blob)
  triggerDownload(url, filename)
  setTimeout(() => URL.revokeObjectURL(url), 4000)
}

export function downloadDataUrl(filename: string, dataUrl: string) {
  triggerDownload(dataUrl, filename)
}

function triggerDownload(href: string, filename: string) {
  const a = document.createElement('a')
  a.href = href
  a.download = filename
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  a.remove()
}
