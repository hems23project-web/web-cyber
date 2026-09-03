import { useEffect, useState } from 'react'
import { aiCoreLabel, useGame } from '@/hooks/useGame'
import { HUD, SUBJECT_ID } from '@/data/birthdayConfig'
import { FlagSubmit } from './FlagSubmit'
import { SettingsMenu } from './SettingsMenu'
import { sfx } from '@/utils/sound'
import { BackLink } from '@/components/ui/BackLink'

/**
 * Hud — the small persistent readout that lives at the top of the CTF.
 * Everything it shows is derived from persisted state, so a refresh never
 * resets it.
 */
export function Hud() {
  const { solvedCount, totalCount, progressPct, aiCore, state, solved } = useGame()
  const [submitOpen, setSubmitOpen] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [pulse, setPulse] = useState(false)

  useEffect(() => {
    if (!state.startedAt) return
    const tick = () => setElapsed(Date.now() - (state.startedAt ?? Date.now()))
    tick()
    const t = window.setInterval(tick, 1000)
    return () => window.clearInterval(t)
  }, [state.startedAt])

  useEffect(() => {
    if (solved.length === 0) return
    setPulse(true)
    const t = setTimeout(() => setPulse(false), 900)
    return () => clearTimeout(t)
  }, [solved.length])

  const coreLabel = aiCoreLabel(aiCore)

  return (
    <header className={`hud ${pulse ? 'hud--pulse' : ''}`}>
      <div className="hud__bar">
        <BackLink inline />
        <div className="hud__id">
          <span className="hud__title mono">{HUD.title}</span>
          <span className="hud__sub mono faint">{SUBJECT_ID}</span>
        </div>

        <div className="hud__stats">
          <div className="hud__stat">
            <span className="hud__k mono">{HUD.memoriesLabel}</span>
            <span className="hud__v mono">
              {String(solvedCount).padStart(2, '0')} / {totalCount}
            </span>
            <span className="hud__meter" aria-hidden="true">
              <i style={{ width: `${progressPct}%` }} />
            </span>
          </div>

          <div className="hud__stat hud__stat--plain">
            <span className="hud__k mono">{HUD.systemLabel}</span>
            <span className="hud__v mono hud__v--ok">
              <i className="hud__dot" />
              {HUD.systemActive}
            </span>
          </div>

          <div className="hud__stat hud__stat--plain">
            <span className="hud__k mono">{HUD.aiLabel}</span>
            <span className={`hud__v mono hud__v--${aiCore.toLowerCase()}`}>
              <i className="hud__dot" />
              {coreLabel}
            </span>
          </div>

          <div className="hud__stat hud__stat--plain hud__stat--time">
            <span className="hud__k mono">ELAPSED</span>
            <span className="hud__v mono">{fmt(elapsed)}</span>
          </div>
        </div>

        <div className="hud__actions">
          <button
            type="button"
            className="hud__submitbtn mono"
            onClick={() => {
              setSubmitOpen((o) => !o)
              sfx.key()
            }}
            aria-expanded={submitOpen}
          >
            {submitOpen ? '✕ CLOSE' : '⌁ ' + HUD.quickSubmit}
          </button>
          <SettingsMenu />
        </div>
      </div>

      {submitOpen && (
        <div className="hud__drawer rise">
          <FlagSubmit label="GLOBAL SUBMIT // any flag, any time" compact />
          <p className="hud__drawernote mono faint">
            Not sure which record a flag belongs to? Submit it here — the system will route it.
          </p>
        </div>
      )}
    </header>
  )
}

function fmt(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000))
  const m = Math.floor(s / 60)
  return `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}
