import { useEffect, useState } from 'react'
import { buildQr, downloadDataUrl, downloadText, type QrBundle } from '@/utils/qr'
import { QR_CONFIG } from '@/data/birthdayConfig'
import { sfx } from '@/utils/sound'

/**
 * Is this page being served from a development/local origin?
 *
 * The QR falls back to `window.location.origin` when `SITE_URL` is empty. On a
 * real deployment that fallback is *correct*, so no warning is needed — and
 * showing one would leak build details onto a page that is meant to be a gift.
 * On localhost the fallback would encode a URL nobody else can open, which is
 * exactly the mistake the warning exists to prevent.
 */
export function isLocalOrigin(
  loc: { hostname: string; port: string } = typeof window === 'undefined'
    ? { hostname: 'localhost', port: '' }
    : window.location,
): boolean {
  const host = loc.hostname.toLowerCase().replace(/^\[|\]$/g, '')
  if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local')) return true
  if (host === '::1' || host === '127.0.0.1') return true
  // Private / link-local IPv4 ranges are never a public gift URL.
  if (/^(10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.)/.test(host)) return true
  // A non-standard port means a dev server or a sandbox preview.
  if (loc.port && loc.port !== '80' && loc.port !== '443') return true
  return false
}

/**
 * QrPanel — generate, preview and export the QR.
 *
 * Everything is produced in the browser from `SITE_URL` in
 * `src/data/birthdayConfig.ts`. When that's empty the current origin is used:
 * correct once deployed, and loudly flagged while you're still on localhost so
 * you can never hand a printed or embroidered QR to an address nobody can open.
 */
export function QrPanel() {
  const [bundle, setBundle] = useState<QrBundle | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [openNotes, setOpenNotes] = useState(true)

  useEffect(() => {
    let live = true
    buildQr()
      .then((b) => {
        if (live) {
          setBundle(b)
          setError(null)
        }
      })
      .catch((e: unknown) => {
        if (live) setError(e instanceof Error ? e.message : 'QR generation failed')
      })
    return () => {
      live = false
    }
  }, [])

  const svgName = 'mi-birthday-qr.svg'
  const pngName = 'mi-birthday-qr.png'

  return (
    <section className="panel qrpanel" aria-labelledby="qr-h">
      <div className="panel-head">
        <span id="qr-h">QR // PHYSICAL HANDOFF</span>
        <span className="mono faint">ECC {QR_CONFIG.errorCorrectionLevel}</span>
      </div>

      <div className="panel-body qrpanel__body">
        <div className="qrpanel__preview" aria-label="QR code preview">
          {error && <p className="qrpanel__error mono">⚠ {error}</p>}
          {!bundle && !error && <div className="qrpanel__loading mono faint">generating…</div>}
          {bundle && (
            <div
              className="qrpanel__svg"
              // The SVG is generated locally by the `qrcode` package from our
              // own config — no remote content, no user HTML.
              dangerouslySetInnerHTML={{ __html: bundle.svg }}
            />
          )}
        </div>

        <div className="qrpanel__side">
          <dl className="kv qrpanel__spec">
            <dt>ENCODES</dt>
            <dd className="mono qrpanel__value">{bundle?.value ?? '—'}</dd>
            <dt>SOURCE</dt>
            <dd className="mono">
              {bundle?.usingFallback && isLocalOrigin() ? (
                <span className="qrpanel__warn">
                  ⚠ SITE_URL is empty — using the current origin. Set it in{' '}
                  <code>src/data/birthdayConfig.ts</code> before you print or stitch anything.
                </span>
              ) : bundle?.usingFallback ? (
                <span className="qrpanel__ok">this live address — correct as deployed</span>
              ) : (
                <span className="qrpanel__ok">SITE_URL from birthdayConfig.ts</span>
              )}
            </dd>
            <dt>ERROR CORRECTION</dt>
            <dd className="mono">LEVEL H · ~30% damage tolerance</dd>
            <dt>QUIET ZONE</dt>
            <dd className="mono">{QR_CONFIG.margin} modules, all sides</dd>
            <dt>MODULES</dt>
            <dd className="mono">{bundle ? `${bundle.size} × ${bundle.size}` : '—'}</dd>
            <dt>PNG SCALE</dt>
            <dd className="mono">{QR_CONFIG.pngScale}px per module</dd>
            <dt>COLOURS</dt>
            <dd className="mono">
              <span className="qrpanel__swatch" style={{ background: QR_CONFIG.dark }} aria-hidden="true" />
              {QR_CONFIG.dark} on{' '}
              <span className="qrpanel__swatch qrpanel__swatch--light" style={{ background: QR_CONFIG.light }} aria-hidden="true" />
              {QR_CONFIG.light}
            </dd>
            <dt>GEOMETRY</dt>
            <dd className="mono">square modules · no gradient · no logo · crispEdges</dd>
          </dl>

          <div className="qrpanel__actions">
            <button
              type="button"
              className="btn btn-primary"
              disabled={!bundle}
              onClick={() => {
                if (!bundle) return
                downloadText(svgName, bundle.svg)
                sfx.open()
              }}
            >
              ↓ DOWNLOAD QR SVG
            </button>
            <button
              type="button"
              className="btn"
              disabled={!bundle?.png}
              title={bundle?.pngError ? `PNG unavailable: ${bundle.pngError}` : undefined}
              onClick={() => {
                if (!bundle?.png) return
                downloadDataUrl(pngName, bundle.png)
                sfx.open()
              }}
            >
              ↓ DOWNLOAD QR PNG
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              disabled={!bundle}
              onClick={async () => {
                if (!bundle) return
                try {
                  await navigator.clipboard.writeText(bundle.value)
                  setCopied(true)
                  sfx.key()
                  setTimeout(() => setCopied(false), 1400)
                } catch {
                  /* clipboard unavailable */
                }
              }}
            >
              {copied ? '✓ COPIED' : 'COPY URL'}
            </button>
          </div>

          <p className="qrpanel__devnote mono">
            <span className="qrpanel__devtag">DEVELOPER NOTE</span>
            {QR_CONFIG.developerNote}
          </p>

          <button
            type="button"
            className="qrpanel__notestoggle mono"
            onClick={() => {
              setOpenNotes((o) => !o)
              sfx.key()
            }}
            aria-expanded={openNotes}
          >
            <span aria-hidden="true">{openNotes ? '▾' : '▸'}</span> EMBROIDERY / PRINT CHECKLIST
          </button>
          {openNotes && (
            <ol className="qrpanel__notes">
              {QR_CONFIG.stitchNotes.map((n, i) => (
                <li key={i} className="mono">
                  <span className="qrpanel__notenum">{String(i + 1).padStart(2, '0')}</span>
                  {n}
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </section>
  )
}
