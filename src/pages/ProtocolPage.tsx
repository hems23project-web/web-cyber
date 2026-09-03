import { useState } from 'react'
import { Ambient } from '@/components/ui/Ambient'
import { useGame } from '@/hooks/useGame'
import { PROTOCOL, RECIPIENT_NAME } from '@/data/birthdayConfig'
import { useTypewriter } from '@/hooks/useTypewriter'
import { DotMatrix } from '@/components/ui/DotMatrix'
import { sfx } from '@/utils/sound'
import { BackLink } from '@/components/ui/BackLink'

/**
 * Phase 1 → 2. The birthday page hands over to the system.
 * Same warmth at the edges, but the typography and framing go technical.
 */
export function ProtocolPage() {
  const { enterSystem, state } = useGame()
  const [booted, setBooted] = useState(state.reduceMotion)

  const boot = [
    `> birthday-protocol --init`,
    `> mounting memory-core .............. ok`,
    `> scanning for fragments ............ ${PROTOCOL.detected}`,
    `> integrity check ................... DEGRADED`,
    `> guardian subsystem ................ 1 active`,
    `> status: ${PROTOCOL.status}`,
  ]

  const tw = useTypewriter(boot, {
    speed: 7,
    lineDelay: 150,
    instant: state.reduceMotion,
    onDone: () => setBooted(true),
  })

  return (
    <div className="protocol theme-ctf">
      <Ambient circuit={false} glow scan grain vignette />
      <BackLink />

      <main className="protocol__main shell shell-narrow">
        <div className="protocol__card panel ticked">
          <div className="protocol__boot mono" aria-live="polite">
            {(state.reduceMotion ? boot : tw.done).map((l, i) => (
              <div key={i} className="protocol__bootline">
                {l}
              </div>
            ))}
            {!state.reduceMotion && !tw.finished && <div className="protocol__bootline caret">{tw.current}</div>}
          </div>

          <h1 className="protocol__title">
            <DotMatrix text={PROTOCOL.title} duration={900} />
            <span className="protocol__id mono"> // {PROTOCOL.subjectId}</span>
          </h1>

          <dl className="kv protocol__rows">
            <dt>STATUS</dt>
            <dd className="mono accent">
              {PROTOCOL.status}
            </dd>
            {PROTOCOL.rows.map((r) => (
              <div key={r.k} className="protocol__row">
                <dt>{r.k}</dt>
                <dd className="mono">{r.v}</dd>
              </div>
            ))}
          </dl>

          <p className="protocol__detected mono rise d3">{PROTOCOL.detected}</p>

          <div className="protocol__warn rise d4">
            <span className="protocol__warnhead mono">{PROTOCOL.warningTitle}</span>
            {PROTOCOL.warning.map((w, i) => (
              <p key={i} className={`protocol__warnline mono rise d${i + 1}`}>
                {w}
              </p>
            ))}
          </div>

          <p className="protocol__signed rise d6">
            assembled by hand for <b>{RECIPIENT_NAME}</b>. nothing here was generated.
          </p>

          {booted && (
            <button
              type="button"
              className="btn btn-primary btn-lg protocol__enter rise d7"
              onClick={() => {
                sfx.unlock()
                enterSystem()
              }}
            >
              {PROTOCOL.enter}
            </button>
          )}
        </div>
      </main>
    </div>
  )
}
