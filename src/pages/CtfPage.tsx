import { useEffect, useMemo, useState, type ComponentType } from 'react'
import { Ambient } from '@/components/ui/Ambient'
import { Hud } from '@/components/Hud'
import { DecoderTool } from '@/components/DecoderTool'
import { MiaTerminal } from '@/components/MiaTerminal'
import { ChallengeCard, HUB_IDS } from '@/components/ChallengeCard'
import { Memory01Archive } from '@/challenges/Memory01Archive'
import { Memory02RainSensor } from '@/challenges/Memory02RainSensor'
import { Memory03Island } from '@/challenges/Memory03Island'
import { Memory04Promise } from '@/challenges/Memory04Promise'
import { Memory05Journey } from '@/challenges/Memory05Journey'
import { Memory06Audit } from '@/challenges/Memory06Audit'
import { Memory07Core } from '@/challenges/Memory07Core'
import { useGame } from '@/hooks/useGame'
import { CHALLENGE_BY_ID, TOTAL_FRAGMENTS, type ChallengeId } from '@/data/challenges'
import { NICKNAME, RECIPIENT_NAME } from '@/data/birthdayConfig'
import { sfx } from '@/utils/sound'

const VIEWS: Record<ChallengeId, ComponentType> = {
  mem01: Memory01Archive,
  mem02: Memory02RainSensor,
  mem03: Memory03Island,
  mem04: Memory04Promise,
  mem05: Memory05Journey,
  mem06: Memory06Audit,
  mem07: Memory07Core,
}

/** Phase 2 + 3 — the CTF itself. */
export function CtfPage() {
  const { isOpen, isSolved, solvedCount, progressPct, goReveal, state } = useGame()
  const [openId, setOpenId] = useState<ChallengeId | null>(null)
  const [briefing, setBriefing] = useState(false)
  const [filesOpen, setFilesOpen] = useState(false)

  // Never leave a locked record open (e.g. after a reset).
  useEffect(() => {
    if (openId && !isOpen(openId)) setOpenId(null)
  }, [openId, isOpen])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && openId) setOpenId(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [openId])

  const coreDue = solvedCount >= TOTAL_FRAGMENTS && !isSolved('mem07')
  const View = useMemo(() => (openId ? VIEWS[openId] : null), [openId])

  return (
    <div className={`ctf theme-ctf ${state.reduceMotion ? 'reduce-motion' : ''}`}>
      <Ambient circuit glow={false} grain scan vignette />

      <Hud />

      <div className="ctf__layout shell">
        <main className="ctf__main">
          {View ? (
            <div className="ctf__view rise">
              <div className="ctf__viewbar">
                <button
                  type="button"
                  className="btn btn-sm btn-ghost"
                  onClick={() => {
                    setOpenId(null)
                    sfx.key()
                  }}
                >
                  ← FRAGMENT LIST
                </button>
                <span className="mono faint">
                  {CHALLENGE_BY_ID[openId!].label} // {CHALLENGE_BY_ID[openId!].title}
                </span>
                <span className="mono faint ctf__esc">esc to close</span>
              </div>
              <View />
            </div>
          ) : (
            <div className="hub">
              <header className="hub__head">
                <div>
                  <p className="hub__kicker mono accent">MEMORY FRAGMENT INDEX</p>
                  <h1 className="hub__title">
                    RECOVER THE MEMORIES<span className="hub__titlecomma">,</span> {NICKNAME}
                  </h1>
                  <p className="hub__sub">
                    Six fragments were detected in this system. They are hidden, encoded or guarded. Nothing here needs
                    the internet, and nothing here needs prior knowledge — only you, {RECIPIENT_NAME}, and a browser
                    that shows you less than it received.
                  </p>
                </div>

                <div className="hub__progress" aria-hidden="true">
                  <svg viewBox="0 0 120 120" className="hub__ring">
                    <circle cx="60" cy="60" r="52" className="hub__ringbg" />
                    <circle
                      cx="60"
                      cy="60"
                      r="52"
                      className="hub__ringfg"
                      style={{ strokeDasharray: `${(progressPct / 100) * 326.7} 326.7` }}
                    />
                  </svg>
                  <span className="hub__ringtext mono">
                    <b>{progressPct}%</b>
                    <i>
                      {solvedCount}/{TOTAL_FRAGMENTS}
                    </i>
                  </span>
                </div>
              </header>

              {coreDue && (
                <button type="button" className="hub__corebanner rise" onClick={() => setOpenId('mem07')}>
                  <span className="mono">MEMORY CORE AT 100% — ONE RECORD IS STILL ENCRYPTED</span>
                  <span className="mono accent">OPEN MEMORY 07 →</span>
                </button>
              )}

              {state.revealUnlocked && (
                <button type="button" className="hub__corebanner hub__corebanner--done rise" onClick={goReveal}>
                  <span className="mono">ALL SEVEN RECORDS RECOVERED</span>
                  <span className="mono accent">GO TO THE ENDING →</span>
                </button>
              )}

              <section className="hub__briefing panel">
                <button
                  type="button"
                  className="hub__briefingtoggle mono"
                  onClick={() => {
                    setBriefing((b) => !b)
                    sfx.key()
                  }}
                  aria-expanded={briefing}
                >
                  <span aria-hidden="true">{briefing ? '▾' : '▸'}</span> SYSTEM BRIEFING
                  <span className="faint">flag format · where to start · ground rules</span>
                </button>
                {briefing && (
                  <div className="hub__briefingbody rise">
                    <div>
                      <h3 className="mono">FLAG FORMAT</h3>
                      <p className="mono">
                        <code>FLAG&#123;ANSWER_IN_UPPER_SNAKE_CASE&#125;</code>
                        <br />
                        spaces, slashes and dashes become underscores. dates go in <code>DD_MM_YYYY</code>.
                      </p>
                    </div>
                    <div>
                      <h3 className="mono">WHERE TO START</h3>
                      <p className="mono">
                        a browser only paints part of what it receives. the usual places all apply: view-source,
                        comments, data-* attributes, the console, and files sitting on this server that nothing links
                        to.
                      </p>
                      <p className="mono">
                        <a className="hub__link" href="/robots.txt" target="_blank" rel="noreferrer">
                          /robots.txt
                        </a>{' '}
                        is a reasonable first move. it is not empty.
                      </p>
                    </div>
                    <div>
                      <h3 className="mono">GROUND RULES</h3>
                      <p className="mono">
                        three hints on every record, all free, none of them scored. nothing requires the internet or
                        outside knowledge. every answer is something you already know — you just have to notice that
                        you know it.
                      </p>
                    </div>
                  </div>
                )}
              </section>

              <ul className="hub__list">
                {HUB_IDS.map((id, i) => (
                  <ChallengeCard
                    key={id}
                    id={id}
                    onOpen={setOpenId}
                    className={`rise d${Math.min(i + 1, 8)}`}
                  />
                ))}
              </ul>
            </div>
          )}
        </main>

        <aside className="ctf__aside" id="mia-panel">
          {/* MEMORY 03 embeds her full terminal, so don't render a second one. */}
          {openId !== 'mem03' && <MiaTerminal variant="aside" />}
          <DecoderTool />

          <section className={`panel sysfiles ${filesOpen ? 'is-open' : ''}`}>
            <button
              type="button"
              className="panel-head sysfiles__toggle"
              onClick={() => {
                setFilesOpen((o) => !o)
                sfx.key()
              }}
              aria-expanded={filesOpen}
            >
              <span aria-hidden="true">{filesOpen ? '▾' : '▸'}</span>
              <span>SYSTEM FILES</span>
              <span className="mono faint">{filesOpen ? 'recon surface' : 'collapsed · not required'}</span>
            </button>
            {filesOpen && (
            <div className="panel-body">
              <ul className="sysfiles__list mono">
                {[
                  { href: '/robots.txt', label: '/robots.txt' },
                  { href: '/archive/index.txt', label: '/archive/index.txt' },
                  { href: '/archive/manifest.json', label: '/archive/manifest.json' },
                  { href: '/archive/ilp-session-01.log', label: '/archive/ilp-session-01.log' },
                  { href: '/records/p-04.stamp', label: '/records/p-04.stamp' },
                  { href: '/records/route-table.json', label: '/records/route-table.json' },
                ].map((f) => (
                  <li key={f.href}>
                    <a href={f.href} target="_blank" rel="noreferrer">
                      <span aria-hidden="true">▸</span> {f.label}
                    </a>
                  </li>
                ))}
              </ul>
              <p className="sysfiles__note mono faint">
                listed here so nothing is a dead end. opening them is still on you.
              </p>
            </div>
            )}
          </section>
        </aside>
      </div>
    </div>
  )
}
