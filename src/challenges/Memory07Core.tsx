import { useState } from 'react'
import { ChallengeShell } from './ChallengeShell'
import { FinalSequence } from './FinalSequence'
import { useGame } from '@/hooks/useGame'
import { CHALLENGES, FRAGMENT_IDS, CHALLENGE_BY_ID, canonicalAnswer } from '@/data/challenges'
import { buildFlag } from '@/utils/flags'
import { SUBJECT_ID } from '@/data/birthdayConfig'
import { DataClue, DomComment } from '@/components/ui/DomComment'

/**
 * MEMORY 07 // IDENTITY OF SUBJECT  —  the final record.
 *
 * Multi-stage: recognise that one date in this system belongs to Mi alone →
 * break the base64 seal → discover the date is written backwards → reverse it
 * → confirm against the codename MI-07092003 → assemble DD_MM_YYYY.
 *
 * The flag itself appears nowhere in the source.
 */

const SEALED_BLOB =
  'VEhFIE9OTFkgREFURSBJTiBUSElTIFNZU1RFTSBUSEFUIEJFTE9OR1MgVE8gWU9VIEFMT05FOiAzMDAyLjkwLjcwICAoaXQgaXMgd3JpdHRlbiB0aGUgd3Jvbmcgd2F5IHJvdW5kKQ=='

const BLOB_LINES = SEALED_BLOB.match(/.{1,56}/g) ?? [SEALED_BLOB]

const COMMENT = [
  '',
  ' RECORD 07 :: sealed',
  ' ----------------------------------------------',
  ' the core is at 100%. six of six came home.',
  ' one record was never fragmented, because it was never shared:',
  ' it belongs to one person only.',
  '',
  ' seal .......... base64, single stage, then one small trick',
  ' the trick ..... what comes out is written the wrong way round',
  ' confirmation .. you have been carrying your own id all session:',
  '                 ' + SUBJECT_ID,
  '',
  ' assembly ...... FLAG{ DD_MM_YYYY }',
  ' ----------------------------------------------',
  '',
].join('\n')

export function Memory07Core() {
  const { isSolved } = useGame()
  const [broken, setBroken] = useState(false)
  const solved = isSolved('mem07')
  const core = CHALLENGES.find((c) => c.id === 'mem07')!

  return (
    <>
      <ChallengeShell id="mem07">
        <DomComment text={COMMENT} />
        <DataClue
          attrs={{
            'data-record': 'mem07',
            'data-state': 'SEALED',
            'data-seal-encoding': 'base64',
            'data-subject-id': SUBJECT_ID,
            'data-assembly': 'DD_MM_YYYY',
          }}
        />

        <div className="core">
          <div className="core__meter panel ticked">
            <div className="panel-head">
              <span>MEMORY CORE</span>
              <span className="mono core__pct">100%</span>
            </div>
            <div className="panel-body">
              <div className="core__bar" aria-hidden="true">
                <i style={{ width: '100%' }} />
              </div>
              <p className="core__all mono">ALL PERSONAL MEMORIES RECOVERED.</p>

              <ul className="core__list">
                {FRAGMENT_IDS.map((id) => (
                  <li key={id} className="core__item mono">
                    <span className="core__tick">✓</span>
                    <span className="core__idx">{CHALLENGE_BY_ID[id].label}</span>
                    <span className="core__title">{CHALLENGE_BY_ID[id].title}</span>
                    <span className="core__flag faint">{buildFlag(canonicalAnswer(id))}</span>
                  </li>
                ))}
              </ul>

              <p className="core__but">But one record remains encrypted.</p>
            </div>
          </div>

          <div className="core__sealed panel ticked">
            <div className="panel-head">
              <span>{core.label} // SEALED RECORD</span>
              <span className="mono faint accent">ENCRYPTED</span>
            </div>

            <div className="panel-body">
              <dl className="kv">
                <dt>IDENTITY OF SUBJECT</dt>
                <dd>
                  <span className="redacted">{'█'.repeat(12)}</span>
                </dd>
                <dt>SUBJECT</dt>
                <dd className="mono">MITHUN</dd>
                <dt>CODENAME</dt>
                <dd className="mono accent">{SUBJECT_ID}</dd>
                <dt>DOB</dt>
                <dd className="mono">
                  [SEALED] <span className="faint">· base64 · one small trick inside</span>
                </dd>
              </dl>

              <div className={`core__blob ${broken || solved ? 'is-broken' : ''}`}>
                <span className="core__bloblabel mono">SEAL</span>
                <pre className="mono">
                  {BLOB_LINES.map((l, i) => (
                    <span key={i} className="core__blobline">
                      {l}
                    </span>
                  ))}
                </pre>
              </div>

              <div className="core__actions">
                <button
                  type="button"
                  className="btn btn-sm"
                  onClick={() => setBroken((b) => !b)}
                  aria-pressed={broken}
                >
                  {broken ? '▾ HIDE SEAL ANALYSIS' : '▸ ATTEMPT SEAL ANALYSIS'}
                </button>
              </div>

              {(broken || solved) && (
                <div className="core__analysis rise mono">
                  <div>
                    <span className="faint">stage 1</span> the seal is standard base64. the DECODER does it in one
                    click.
                  </div>
                  <div>
                    <span className="faint">stage 2</span> what comes out is a sentence and a date — and the date is
                    written the wrong way round.
                  </div>
                  <div>
                    <span className="faint">stage 3</span> turn it around. you have seen those eight digits since the
                    first screen. they are in your codename.
                  </div>
                  <div>
                    <span className="faint">stage 4</span> split them DD_MM_YYYY.
                  </div>
                  <div className="core__analysisnote">
                    every other date you recovered belongs to the two of you.
                    <br />
                    this one belongs to you alone.
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </ChallengeShell>

      {solved && <FinalSequence />}
    </>
  )
}
