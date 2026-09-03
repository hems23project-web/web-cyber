import { useEffect, useMemo, useRef, useState } from 'react'
import { useGame } from '@/hooks/useGame'
import { mia } from '@/ai/mia'
import { MIA } from '@/data/birthdayConfig'
import { sfx } from '@/utils/sound'

interface MiaTerminalProps {
  /** 'aside' = compact sidebar panel, 'full' = the dedicated M.I.A. view */
  variant?: 'aside' | 'full'
  /** show the "request the memory 03 clue" shortcut */
  showClueShortcut?: boolean
}

const LOCKED_QUICK = ['What are you?']

/**
 * MiaTerminal — the M.I.A. interface.
 *
 * Runs entirely offline on the deterministic scripted engine. If a local model
 * endpoint is ever configured (MIA.useLocalModel), it is tried first and any
 * failure falls straight through to the script, so the CTF can never strand.
 */
export function MiaTerminal({ variant = 'aside', showClueShortcut = true }: MiaTerminalProps) {
  const { aiCore, chat, sendToMia, requestMem03Clue, clearChat, solved, solvedCount } = useGame()
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const logRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const locked = aiCore === 'LOCKED'

  useEffect(() => {
    const el = logRef.current
    if (!el) return
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
  }, [chat.length, busy])

  const quick = useMemo(() => {
    if (locked) return LOCKED_QUICK
    const list: string[] = []
    if (!solved.includes('mem03')) list.push('Give me the clue you are holding.')
    if (solvedCount < 6) list.push('Where is the next flag?')
    list.push('What do you know about me?')
    list.push('Who created you?')
    if (solvedCount >= 6) list.push('What is the sealed record?')
    return list.slice(0, 4)
  }, [locked, solved, solvedCount])

  const send = async (text: string) => {
    const t = text.trim()
    if (!t || busy || locked) return
    setBusy(true)
    setDraft('')
    await sendToMia(t)
    setBusy(false)
  }

  if (locked) {
    return (
      <section className={`panel mia mia--locked ${variant === 'full' ? 'mia--full' : ''}`}>
        <div className="panel-head">
          <span>{MIA.name} // AI CORE</span>
          <span className="mia__state mia__state--locked">LOCKED</span>
        </div>
        <div className="panel-body">
          {mia.lockedLines().map((l, i) => (
            <p key={i} className="mia__line mono faint">
              {l}
            </p>
          ))}
          <div className="mia__lockbar" aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
          </div>
          <p className="mia__hint mono">
            Recover <strong>MEMORY 02</strong> and she wakes up.
          </p>
        </div>
      </section>
    )
  }

  return (
    <section className={`panel mia ${variant === 'full' ? 'mia--full' : ''} ticked`} aria-labelledby="mia-h">
      <div className="panel-head">
        <span id="mia-h">
          {MIA.name} <span className="faint">// {MIA.expansion}</span>
        </span>
        <span className={`mia__state mia__state--${aiCore === 'UNLOCKED' ? 'unlocked' : 'online'}`}>
          {aiCore === 'UNLOCKED' ? 'UNLOCKED' : 'ONLINE'}
        </span>
      </div>

      <div className="mia__log" ref={logRef} role="log" aria-live="polite" aria-label="M.I.A. conversation">
        {chat.length === 0 && (
          <>
            {mia.bootLines().map((l, i) => (
              <p key={`b${i}`} className="mia__line mia__line--sys mono">
                {l}
              </p>
            ))}
            {mia.greeting().map((l, i) => (
              <p key={`g${i}`} className="mia__line mia__line--mia mono">
                <span className="mia__who">M.I.A.</span> {l}
              </p>
            ))}
          </>
        )}

        {chat.map((m) => (
          <div key={m.id} className={`mia__msg mia__msg--${m.role}`}>
            {m.lines.map((l, i) => (
              <p key={i} className={`mia__line mono mia__line--${m.role}`}>
                {m.role === 'mia' && <span className="mia__who">M.I.A.</span>}
                {m.role === 'player' && <span className="mia__who mia__who--you">YOU</span>}
                {l}
              </p>
            ))}
          </div>
        ))}

        {busy && (
          <p className="mia__line mono mia__line--typing">
            <span className="mia__who">M.I.A.</span>
            <span className="mia__dots" aria-label="thinking">
              <i>.</i>
              <i>.</i>
              <i>.</i>
            </span>
          </p>
        )}
      </div>

      <div className="mia__quick">
        {quick.map((q) => (
          <button key={q} type="button" className="chip mono chip--sm" onClick={() => void send(q)} disabled={busy}>
            {q}
          </button>
        ))}
        {showClueShortcut && !solved.includes('mem03') && (
          <button
            type="button"
            className="chip mono chip--sm chip--accent"
            disabled={busy}
            onClick={() => {
              requestMem03Clue()
              sfx.mia()
            }}
          >
            ▸ REQUEST CLUE
          </button>
        )}
      </div>

      <form
        className="mia__form"
        onSubmit={(e) => {
          e.preventDefault()
          void send(draft)
        }}
      >
        <span className="mia__prompt mono" aria-hidden="true">
          &gt;
        </span>
        <input
          ref={inputRef}
          className="mia__input mono"
          type="text"
          value={draft}
          spellCheck={false}
          autoComplete="off"
          placeholder={busy ? '…' : 'talk to M.I.A.'}
          aria-label="Message M.I.A."
          disabled={busy}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            // Explicit rather than relying on implicit form submission: a stray
            // Enter must never navigate or reload in the middle of a solve.
            if (e.key === 'Enter') {
              e.preventDefault()
              void send(draft)
            }
          }}
        />
        <button type="submit" className="btn btn-sm" disabled={busy || !draft.trim()}>
          SEND
        </button>
      </form>

      <div className="mia__foot mono">
        <span className="faint">engine: {mia.engineName}</span>
        <button
          type="button"
          className="mia__clear"
          onClick={() => {
            clearChat()
            sfx.key()
          }}
        >
          clear log
        </button>
      </div>
    </section>
  )
}
