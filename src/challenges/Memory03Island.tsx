import { useMemo, useState } from 'react'
import { ChallengeShell } from './ChallengeShell'
import { MiaTerminal } from '@/components/MiaTerminal'
import { MEM03_CLUE } from '@/data/miaDialogue'
import { MIA } from '@/data/birthdayConfig'
import { useGame } from '@/hooks/useGame'
import { sfx } from '@/utils/sound'

/**
 * MEMORY 03 // THE ISLAND
 * Technique: AI + ASCII decimal + reversed base64.
 *
 * M.I.A. holds this one. CLUE A is on the panel; CLUE B has to be asked for,
 * either by talking to her or by pressing REQUEST CLUE (which does the same
 * thing and logs it in her terminal, so there is no dead end).
 */
export function Memory03Island() {
  const { chat, requestMem03Clue, isSolved } = useGame()
  const [forced, setForced] = useState(false)

  /** CLUE B unlocks itself the moment M.I.A. actually says it. */
  const miaSaidIt = useMemo(
    () => chat.some((m) => m.role === 'mia' && m.lines.some((l) => l.includes(MEM03_CLUE.reversedB64))),
    [chat],
  )
  const clueB = miaSaidIt || forced || isSolved('mem03')

  return (
    <ChallengeShell id="mem03">
      <div className="island">
        <div className="island__guard panel ticked">
          <div className="panel-head">
            <span>GUARDIAN // {MIA.name}</span>
            <span className="mono mia__state mia__state--online">ONLINE</span>
          </div>
          <div className="panel-body">
            <p className="island__lede">
              This memory is not locked — it is <em>held</em>. Something in this system woke up when you recovered the
              last one, and it is not letting go without a conversation.
            </p>

            <div className="clueblock">
              <span className="clueblock__k mono">CLUE A // the name</span>
              <span className="clueblock__enc mono faint">ASCII DECIMAL</span>
              <code className="clueblock__v mono">{MEM03_CLUE.ascii}</code>
              <span className="clueblock__note mono faint">
                decimal → character. 109 is a letter. So is 101.
              </span>
            </div>

            <div className={`clueblock ${clueB ? 'is-open' : 'is-sealed'}`}>
              <span className="clueblock__k mono">CLUE B // the kind of place</span>
              {clueB ? (
                <>
                  <span className="clueblock__enc mono faint">BASE64, FOLDED</span>
                  <code className="clueblock__v mono">{MEM03_CLUE.reversedB64}</code>
                  <span className="clueblock__note mono faint">
                    unfold it, then turn it around. and make it plural — there is more than one.
                  </span>
                </>
              ) : (
                <>
                  <span className="clueblock__enc mono faint">WITHHELD BY GUARDIAN</span>
                  <code className="clueblock__v mono">
                    <span className="redacted">{'█'.repeat(12)}</span>
                  </code>
                  <button
                    type="button"
                    className="btn btn-sm btn-primary clueblock__ask"
                    onClick={() => {
                      setForced(true)
                      requestMem03Clue()
                      sfx.mia()
                    }}
                  >
                    ▸ ASK {MIA.name} FOR IT
                  </button>
                </>
              )}
            </div>

            <p className="island__rule mono faint">
              two words. one flag. <code>FLAG&#123;WORD1_WORD2&#125;</code>
            </p>
          </div>
        </div>

        <MiaTerminal variant="full" showClueShortcut={!clueB} />
      </div>
    </ChallengeShell>
  )
}
