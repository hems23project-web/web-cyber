import { useState } from 'react'
import { ChallengeShell } from './ChallengeShell'
import { DataClue } from '@/components/ui/DomComment'
import { sfx } from '@/utils/sound'

/**
 * MEMORY 06 // MI — SECURITY AUDIT
 * Technique: wordplay + A1Z26 + ROT13.
 *
 * The two CRITICAL findings have to be translated out of audit-speak and into
 * the words she actually uses. Neither phrase appears anywhere on this page in
 * plain text:
 *
 *   VULN_04  "2 9 7 / 2 21 20 20"   A1Z26   → priority 1
 *   VULN_03  "PEBBXRQ GRRGU"         ROT13   → priority 2
 *
 * Everything here is affectionate teasing. That is a hard rule, not a vibe.
 */

type Severity = 'CRITICAL' | 'HIGH' | 'INFORMATIONAL'

interface Finding {
  id: string
  name: string
  severity: Severity
  priority: number | null
  payload?: string
  encoding?: string
  finding: string
  note: string
  inFlag: boolean
}

const FINDINGS: Finding[] = [
  {
    id: 'VULN_01',
    name: 'FOOD',
    severity: 'HIGH',
    priority: null,
    finding: 'Two foodies, one shared weakness. No patch is available and none has been requested.',
    note: 'Documented repeatedly. Never disputed. Not part of the flag — it is simply true.',
    inFlag: false,
  },
  {
    id: 'VULN_02',
    name: 'HEIGHT DIFFERENTIAL',
    severity: 'INFORMATIONAL',
    priority: null,
    finding: 'A measurable difference in vertical extent between the two subjects.',
    note: 'The audit declines to record which subject is on which end of it. She does not decline. Often. Loudly. In public. Not part of the flag.',
    inFlag: false,
  },
  {
    id: 'VULN_03',
    name: 'DENTAL GEOMETRY',
    severity: 'CRITICAL',
    priority: 2,
    payload: 'PEBBXRQ GRRGU',
    encoding: 'alphabetic rotation',
    finding: 'Structural deviation from the standard alignment specification.',
    note: 'She calls it character. The audit calls it an attack surface. She is right and so is the audit.',
    inFlag: true,
  },
  {
    id: 'VULN_04',
    name: 'GLUTEAL ANOMALY',
    severity: 'CRITICAL',
    priority: 1,
    payload: '2 9 7 / 2 21 20 20',
    encoding: 'numeral substitution · A=1',
    finding: 'Posterior mass exceeds the published specification.',
    note: 'Repeatedly documented. Never disputed. Occasionally denied by the subject, unconvincingly.',
    inFlag: true,
  },
]

export function Memory06Audit() {
  const [open, setOpen] = useState<string | null>('VULN_04')

  return (
    <ChallengeShell id="mem06">
      <DataClue
        attrs={{
          'data-audit': 'subject-mi',
          'data-findings': '4',
          'data-critical': '2',
          'data-flag-order': 'by PRIORITY ascending',
          'data-vuln03-encoding': 'alphabetic rotation',
          'data-vuln04-encoding': 'numeral substitution, A=1',
        }}
      />

      <div className="audit panel ticked">
        <div className="panel-head">
          <span>MI // SECURITY AUDIT</span>
          <span className="mono faint">SUBJECT · MI</span>
        </div>

        <div className="panel-body">
          <div className="audit__summary mono">
            <div>
              <span className="faint">KNOWN VULNERABILITIES</span>
              <b>4</b>
            </div>
            <div>
              <span className="faint">CRITICAL</span>
              <b className="accent">2</b>
            </div>
            <div>
              <span className="faint">PATCHES APPLIED</span>
              <b>0</b>
            </div>
            <div>
              <span className="faint">WILLINGNESS TO PATCH</span>
              <b>0</b>
            </div>
          </div>

          <ul className="audit__list">
            {FINDINGS.map((f) => {
              const expanded = open === f.id
              return (
                <li key={f.id} className={`finding finding--${f.severity.toLowerCase()} ${expanded ? 'is-open' : ''}`}>
                  <button
                    type="button"
                    className="finding__head"
                    onClick={() => {
                      setOpen(expanded ? null : f.id)
                      sfx.key()
                    }}
                    aria-expanded={expanded}
                  >
                    <span className="finding__id mono">{f.id}</span>
                    <span className="finding__name mono">{f.name}</span>
                    <span className={`finding__sev mono sev--${f.severity.toLowerCase()}`}>{f.severity}</span>
                    {f.priority !== null && <span className="finding__prio mono">PRIORITY {f.priority}</span>}
                    <span className="finding__chev mono" aria-hidden="true">
                      {expanded ? '▾' : '▸'}
                    </span>
                  </button>

                  {expanded && (
                    <div className="finding__body rise">
                      <p className="finding__text">{f.finding}</p>

                      {f.payload && (
                        <div className="clueblock is-open">
                          <span className="clueblock__k mono">PAYLOAD</span>
                          <span className="clueblock__enc mono faint">{f.encoding}</span>
                          <code className="clueblock__v mono">{f.payload}</code>
                          <span className="clueblock__note mono faint">
                            {f.encoding === 'alphabetic rotation'
                              ? 'the alphabet, turned halfway round. the DECODER knows the trick.'
                              : 'A=1, B=2, C=3 … and the / separates the two words.'}
                          </span>
                        </div>
                      )}

                      <p className="finding__note mono faint">{f.note}</p>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>

          <div className="audit__rule mono">
            <span className="audit__rulelabel">FLAG CONSTRUCTION</span>
            <p>
              the two <b className="accent">CRITICAL</b> findings only, in <b>PRIORITY</b> order, translated into the
              words she actually uses.
            </p>
            <code className="audit__rulefmt">FLAG&#123;PRIORITY_1_PRIORITY_2&#125;</code>
          </div>
        </div>
      </div>

      <div className="challenge__technique mono">
        <span className="challenge__techlabel">RECON SURFACES FOR THIS RECORD</span>
        <ul>
          <li>open each finding — the two CRITICAL ones carry payloads</li>
          <li>the DECODER in the toolbar handles both encodings (and TRY EVERYTHING if you are unsure)</li>
          <li>translate audit-speak into teasing. that is the whole puzzle.</li>
        </ul>
      </div>
    </ChallengeShell>
  )
}
