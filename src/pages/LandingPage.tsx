import { useEffect, useState } from 'react'
import { Ambient } from '@/components/ui/Ambient'
import { HexStream } from '@/components/ui/HexStream'
import { GlitchText } from '@/components/ui/GlitchText'
import { useGame } from '@/hooks/useGame'
import { LANDING, RELATIONSHIP_LABEL } from '@/data/birthdayConfig'
import { useTypewriter } from '@/hooks/useTypewriter'
import { sfx } from '@/utils/sound'

/**
 * Phase 1 — the landing page.
 * Reads as a premium birthday site first. The technical layer is there but
 * quiet: faint circuit traces, drifting hex motes, a build stamp, and one
 * HTML comment for whoever thinks to look.
 */
export function LandingPage() {
  const { begin, state } = useGame()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 260)
    return () => clearTimeout(t)
  }, [])

  const tw = useTypewriter([...LANDING.body], {
    speed: 20,
    lineDelay: 340,
    startDelay: 620,
    instant: state.reduceMotion,
  })

  const resuming = state.solved.length > 0

  return (
    <div className="landing theme-warm">
      <Ambient circuit glow grain rain vignette />
      <HexStream seed="landing" count={26} className="landing__hex" />

      <main className="landing__main shell">
        <p className="landing__eyebrow mono rise d1">{LANDING.eyebrow}</p>

        <h1 className="landing__title">
          <span className="landing__line1 display rise d2">{LANDING.titleLine1}</span>
          <span className="landing__line2 rise d3">
            <GlitchText text={LANDING.titleName} as="span" className="landing__name display" auto every={9000} />
            <span className="landing__heart" aria-hidden="true">
              {LANDING.heart}
            </span>
          </span>
        </h1>

        <p className="landing__date mono sweep d4">{LANDING.dateLine}</p>

        <div className="landing__rule" aria-hidden="true">
          <span />
          <i />
          <span />
        </div>

        <div className="landing__body" aria-live="polite">
          {(state.reduceMotion ? [...LANDING.body] : tw.done).map((line, i) => (
            <p key={i} className={`landing__para rise ${line.includes('CTF') ? 'landing__para--accent' : ''}`}>
              {line}
            </p>
          ))}
          {!state.reduceMotion && !tw.finished && tw.current && <p className="landing__para caret">{tw.current}</p>}
        </div>

        {ready && (
          <div className="landing__cta rise d6">
            <button type="button" className="btn btn-primary btn-lg landing__btn" onClick={begin}>
              {LANDING.cta}
            </button>
            <p className="landing__foot mono">{LANDING.footnote}</p>
          </div>
        )}

        {resuming && (
          <p className="landing__resume mono rise d7">
            <i className="landing__resumedot" aria-hidden="true" />
            progress found in this browser — {state.solved.length}/6 memories already recovered. the adventure picks up
            where you left it.
          </p>
        )}
      </main>

      <footer className="landing__footbar mono">
        <span>{RELATIONSHIP_LABEL}</span>
        <span className="landing__bin" aria-hidden="true">
          01001000 01000010 01000100
        </span>
        <span>build 07092003</span>
      </footer>

      {/* for the person who looks: this is the whole invitation */}
      <button
        type="button"
        className="landing__skip mono"
        onClick={() => {
          sfx.key()
          begin()
        }}
        aria-label="Skip to the protocol"
        title="skip"
      >
        ⏎
      </button>
    </div>
  )
}
