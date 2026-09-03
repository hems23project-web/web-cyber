import { useEffect } from 'react'
import { GameProvider, useGame } from '@/hooks/useGame'
import { LandingPage } from '@/pages/LandingPage'
import { ProtocolPage } from '@/pages/ProtocolPage'
import { CtfPage } from '@/pages/CtfPage'
import { RevealPage } from '@/pages/RevealPage'

function Router() {
  const { phase, state, setPhase } = useGame()

  // Guard: never sit on the reveal without having earned it.
  useEffect(() => {
    if (phase === 'reveal' && !state.revealUnlocked) setPhase('ctf')
  }, [phase, state.revealUnlocked, setPhase])

  // Reduce-motion is a document-wide switch: every animation, transition and
  // typewriter in the app keys off `.reduce-motion` on <html>.
  useEffect(() => {
    document.documentElement.classList.toggle('reduce-motion', state.reduceMotion)
  }, [state.reduceMotion])

  const view =
    phase === 'landing' ? (
      <LandingPage />
    ) : phase === 'protocol' ? (
      <ProtocolPage />
    ) : phase === 'reveal' && state.revealUnlocked ? (
      <RevealPage />
    ) : (
      <CtfPage />
    )

  return (
    <div key={phase} className={`phase phase--${phase}`}>
      {view}
    </div>
  )
}

export default function App() {
  return (
    <GameProvider>
      <Router />
    </GameProvider>
  )
}
