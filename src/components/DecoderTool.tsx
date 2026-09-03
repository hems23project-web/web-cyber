import { useMemo, useState } from 'react'
import { DECODERS, decodeAll, tryDecode, toBase64, toHex, toAsciiDecimal, toA1Z26, rot13, reverse, type DecodeResult } from '@/utils/encoding'
import { sfx } from '@/utils/sound'

type Direction = 'decode' | 'encode'

interface EncoderMethod {
  id: string
  label: string
  run: (input: string) => string
}

const ENCODERS: EncoderMethod[] = [
  { id: 'b64', label: 'BASE64', run: toBase64 },
  { id: 'hex', label: 'HEX', run: (i) => toHex(i) },
  { id: 'ascii', label: 'ASCII DEC', run: toAsciiDecimal },
  { id: 'a1z26', label: 'A1Z26', run: toA1Z26 },
  { id: 'rot13', label: 'ROT13', run: rot13 },
  { id: 'reverse', label: 'REVERSE', run: reverse },
]

/**
 * DecoderTool — the in-system toolkit.
 *
 * Everything the CTF hides is decodable here, offline, with no prior knowledge:
 * base64, hex (spaced or 0x-prefixed), ASCII decimals, ROT13, A1Z26, reverse,
 * roman numerals, binary, atbash and a few two-stage combinations.
 * "TRY EVERYTHING" runs the whole table at once and shows what falls out.
 */
export function DecoderTool() {
  const [input, setInput] = useState('')
  const [direction, setDirection] = useState<Direction>('decode')
  const [method, setMethod] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  const results: DecodeResult[] = useMemo(() => {
    const text = input.trim()
    if (!text) return []
    if (direction === 'encode') {
      return ENCODERS.filter((e) => !method || method === e.id).map((e) => {
        try {
          return { method: e.label, output: e.run(text), ok: true }
        } catch {
          return { method: e.label, output: '', ok: false }
        }
      }).filter((r) => r.ok)
    }
    if (method === 'ALL') return decodeAll(text)
    const m = DECODERS.find((d) => d.id === method)
    if (!m) return decodeAll(text)
    const r = tryDecode(m, text)
    return r.ok ? [r] : [{ ...r, output: '— no valid input for this method —', ok: false }]
  }, [input, direction, method])

  const copy = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(key)
      sfx.key()
      setTimeout(() => setCopied((c) => (c === key ? null : c)), 1200)
    } catch {
      /* clipboard blocked — the text is selectable anyway */
    }
  }

  return (
    <section className="panel decoder ticked" aria-labelledby="decoder-h">
      <div className="panel-head">
        <span id="decoder-h">DECODER // TOOLBAR</span>
        <span className="decoder__dir" role="group" aria-label="Direction">
          {(['decode', 'encode'] as Direction[]).map((d) => (
            <button
              key={d}
              type="button"
              className={`decoder__dirbtn mono ${direction === d ? 'is-on' : ''}`}
              onClick={() => {
                setDirection(d)
                setMethod(null)
                sfx.key()
              }}
            >
              {d}
            </button>
          ))}
        </span>
      </div>

      <div className="panel-body decoder__body">
        <textarea
          className="decoder__in mono"
          rows={3}
          spellCheck={false}
          value={input}
          placeholder={direction === 'decode' ? 'paste a fragment…  e.g.  52 41 49 4E' : 'type plain text…'}
          onChange={(e) => setInput(e.target.value)}
          aria-label="Decoder input"
        />

        <div className="decoder__chips">
          <button
            type="button"
            className={`chip mono ${method === 'ALL' && direction === 'decode' ? 'is-on' : ''}`}
            onClick={() => {
              setDirection('decode')
              setMethod('ALL')
              sfx.open()
            }}
            title="Run every method and show all plausible results"
          >
            TRY EVERYTHING
          </button>
          {(direction === 'decode' ? DECODERS : ENCODERS).map((m) => (
            <button
              key={m.id}
              type="button"
              className={`chip mono ${method === m.id ? 'is-on' : ''}`}
              onClick={() => {
                setMethod((cur) => (cur === m.id ? null : m.id))
                sfx.key()
              }}
              title={'note' in m ? (m.note as string | undefined) : undefined}
            >
              {m.label}
            </button>
          ))}
        </div>

        <div className="decoder__out" aria-live="polite">
          {results.length === 0 && input.trim() && (
            <p className="decoder__empty mono faint">nothing legible came out of that.</p>
          )}
          {results.map((r, i) => (
            <div key={`${r.method}-${i}`} className={`decoder__row ${r.ok ? '' : 'is-bad'}`}>
              <span className="decoder__method mono">{r.method}</span>
              <pre className="decoder__value mono" onDoubleClick={() => copy(r.output, `${r.method}-${i}`)}>
                {r.output}
              </pre>
              <button
                type="button"
                className="decoder__copy mono"
                onClick={() => copy(r.output, `${r.method}-${i}`)}
                aria-label={`Copy ${r.method} result`}
              >
                {copied === `${r.method}-${i}` ? 'COPIED' : 'COPY'}
              </button>
            </div>
          ))}
          {!input.trim() && (
            <p className="decoder__empty mono faint">
              Paste anything. “TRY EVERYTHING” runs every method at once and shows what comes out.
            </p>
          )}
        </div>
      </div>
    </section>
  )
}
