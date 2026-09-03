/**
 * scripts/jsdom-env.ts — MUST be the first import in verify.entry.tsx.
 *
 * react-dom snapshots `canUseDOM` at module-evaluation time. If the jsdom
 * globals are not in place before react-dom is imported, React falls back to
 * its input-event polyfill path and crashes on controlled inputs. Importing
 * this module first guarantees the DOM exists before React is evaluated.
 */

import { JSDOM, VirtualConsole } from 'jsdom'

export const IGNORED_NOISE = [
  'Not implemented: HTMLCanvasElement.prototype.getContext', // the QR PNG path needs a real canvas
  'Not implemented: window.scrollTo',
  'Not implemented: window.confirm',
  'Error: Could not parse CSS stylesheet', // jsdom's CSS parser, not a real defect
]

export const consoleErrors: string[] = []

const vc = new VirtualConsole()
vc.on('jsdomError', (e: Error) => {
  const msg = e.message || String(e)
  if (IGNORED_NOISE.some((n) => msg.includes(n))) return
  consoleErrors.push(`jsdomError: ${msg}`)
})
vc.on('error', (...args: unknown[]) => {
  const msg = args.map(String).join(' ')
  if (IGNORED_NOISE.some((n) => msg.includes(n))) return
  consoleErrors.push(`console.error: ${msg}`)
})

export const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
  url: 'http://localhost:5173/',
  pretendToBeVisual: true,
  virtualConsole: vc,
})

export const w = dom.window as unknown as Record<string, unknown> & typeof dom.window
const g = globalThis as unknown as Record<string, unknown>

/** Node 22 defines several of these as getter-only globals, so use defineProperty. */
function define(name: string, value: unknown) {
  Object.defineProperty(g, name, { value, writable: true, configurable: true, enumerable: true })
}

define('window', w)
define('document', w.document)
define('navigator', w.navigator)
define('location', w.location)
define('history', w.history)
define('localStorage', w.localStorage)
define('HTMLElement', w.HTMLElement)
define('HTMLInputElement', w.HTMLInputElement)
define('HTMLAnchorElement', w.HTMLAnchorElement)
define('Element', w.Element)
define('Node', w.Node)
define('Event', w.Event)
define('MouseEvent', w.MouseEvent)
define('KeyboardEvent', w.KeyboardEvent)
define('CustomEvent', w.CustomEvent)
define('getComputedStyle', w.getComputedStyle)
define('requestAnimationFrame', w.requestAnimationFrame.bind(w))
define('cancelAnimationFrame', w.cancelAnimationFrame.bind(w))

class FakeIntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return []
  }
}
define('IntersectionObserver', FakeIntersectionObserver)
;(w as unknown as Record<string, unknown>).IntersectionObserver = FakeIntersectionObserver

if (!w.matchMedia) {
  w.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener() {},
    removeListener() {},
    addEventListener() {},
    removeEventListener() {},
    dispatchEvent: () => false,
  })) as unknown as typeof w.matchMedia
}

// Element.scrollTo is not implemented in jsdom; the M.I.A. log uses it.
;(w.Element.prototype as unknown as Record<string, unknown>).scrollTo = function () {}
w.confirm = (() => true) as unknown as typeof w.confirm

// jsdom hides the original stack behind its own wrapper — capture it directly.
w.addEventListener('error', (ev: Event) => {
  const e = ev as Event & { error?: Error }
  const stack = e.error?.stack
  if (stack) consoleErrors.push(`window.onerror:\n${stack.split('\n').slice(0, 12).join('\n')}`)
})

define('IS_REACT_ACT_ENVIRONMENT', true)
