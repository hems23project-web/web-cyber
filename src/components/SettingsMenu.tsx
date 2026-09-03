import { useEffect, useRef, useState } from 'react'
import { useGame } from '@/hooks/useGame'
import { UI } from '@/data/birthdayConfig'
import { sfx } from '@/utils/sound'

/**
 * SettingsMenu — the small, deliberately unobtrusive debug/settings popover.
 * Holds the hidden RESET GAME control plus sound and reduced-motion toggles.
 */
export function SettingsMenu() {
  const { state, toggleSound, toggleMotion, reset, solvedCount, hintsUsed } = useGame()
  const [open, setOpen] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) {
        setOpen(false)
        setConfirming(false)
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        setConfirming(false)
      }
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div className="settings" ref={wrapRef}>
      <button
        type="button"
        className="settings__btn"
        onClick={() => {
          setOpen((o) => !o)
          sfx.key()
        }}
        aria-label={UI.settings}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">
          <path
            d="M12 8.6a3.4 3.4 0 100 6.8 3.4 3.4 0 000-6.8zm8.3 3.4l1.5 1.2-1.5 2.6-1.9-.5a6.6 6.6 0 01-1.1.7l-.4 1.9h-3l-.4-1.9a6.6 6.6 0 01-1.1-.7l-1.9.5-1.5-2.6 1.5-1.2v-1.4L3.7 9.8l1.5-2.6 1.9.5c.3-.3.7-.5 1.1-.7l.4-1.9h3l.4 1.9c.4.2.8.4 1.1.7l1.9-.5 1.5 2.6-1.5 1.2v1.4z"
            fill="currentColor"
          />
        </svg>
      </button>

      {open && (
        <div className="settings__pop panel" role="dialog" aria-label={UI.settings}>
          <div className="settings__head mono">{UI.settings}</div>

          <div className="settings__row">
            <span className="mono">{UI.sound}</span>
            <button type="button" className="settings__toggle mono" onClick={toggleSound} aria-pressed={state.sound}>
              <i className={state.sound ? 'is-on' : ''} />
              {state.sound ? UI.on : UI.off}
            </button>
          </div>

          <div className="settings__row">
            <span className="mono">REDUCE MOTION</span>
            <button
              type="button"
              className="settings__toggle mono"
              onClick={toggleMotion}
              aria-pressed={state.reduceMotion}
            >
              <i className={state.reduceMotion ? 'is-on' : ''} />
              {state.reduceMotion ? UI.on : UI.off}
            </button>
          </div>

          <div className="settings__stats mono faint">
            <div>memories ····· {solvedCount}/6</div>
            <div>hints spent · {hintsUsed}</div>
            <div>storage ····· localStorage</div>
          </div>

          {confirming ? (
            <div className="settings__confirm">
              <p className="mono">{UI.resetConfirm}</p>
              <div className="settings__confirmrow">
                <button
                  type="button"
                  className="btn btn-sm btn-danger"
                  onClick={() => {
                    reset()
                    setOpen(false)
                    setConfirming(false)
                  }}
                >
                  YES, WIPE IT
                </button>
                <button type="button" className="btn btn-sm" onClick={() => setConfirming(false)}>
                  CANCEL
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              className="settings__reset mono"
              onClick={() => {
                setConfirming(true)
                sfx.key()
              }}
            >
              ⟲ {UI.reset}
            </button>
          )}

          <p className="settings__note mono faint">
            Hidden on purpose. Progress survives refreshes; this is the only way to undo it.
          </p>
        </div>
      )}
    </div>
  )
}
