/**
 * sound.ts — tiny WebAudio blips. No audio files, no network.
 * Off by default; toggled from the settings menu.
 */

let ctx: AudioContext | null = null
let enabled = false

function ac(): AudioContext | null {
  if (typeof window === 'undefined') return null
  try {
    if (!ctx) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!Ctor) return null
      ctx = new Ctor()
    }
    if (ctx.state === 'suspended') void ctx.resume()
    return ctx
  } catch {
    return null
  }
}

export const setSoundEnabled = (on: boolean) => {
  enabled = on
  if (on) ac()
}

export const isSoundEnabled = () => enabled

function blip(freq: number, dur: number, type: OscillatorType, gainPeak: number, delay = 0) {
  if (!enabled) return
  const a = ac()
  if (!a) return
  const t0 = a.currentTime + delay
  const osc = a.createOscillator()
  const gain = a.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t0)
  gain.gain.setValueAtTime(0.0001, t0)
  gain.gain.exponentialRampToValueAtTime(gainPeak, t0 + 0.012)
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
  osc.connect(gain).connect(a.destination)
  osc.start(t0)
  osc.stop(t0 + dur + 0.05)
}

export const sfx = {
  key: () => blip(1180, 0.035, 'square', 0.012),
  hover: () => blip(760, 0.03, 'sine', 0.008),
  open: () => blip(420, 0.09, 'triangle', 0.03),
  error: () => {
    blip(180, 0.16, 'sawtooth', 0.045)
    blip(120, 0.22, 'sawtooth', 0.04, 0.06)
  },
  correct: () => {
    blip(660, 0.12, 'triangle', 0.05)
    blip(880, 0.14, 'triangle', 0.05, 0.1)
    blip(1320, 0.3, 'sine', 0.045, 0.2)
  },
  unlock: () => {
    blip(320, 0.1, 'square', 0.03)
    blip(480, 0.1, 'square', 0.03, 0.09)
    blip(720, 0.24, 'triangle', 0.04, 0.18)
  },
  finale: () => {
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5]
    notes.forEach((n, i) => blip(n, 0.5, 'sine', 0.05, i * 0.13))
  },
  mia: () => blip(1560, 0.05, 'sine', 0.02),
}
