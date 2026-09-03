import { useEffect } from 'react'
import { ChallengeShell } from './ChallengeShell'
import { DataClue, DomComment } from '@/components/ui/DomComment'
import { PHOTOS } from '@/data/birthdayConfig'

/**
 * MEMORY 02 // THE FIRST DATE
 * Technique: JavaScript runtime object + encoded HTML attributes + three
 * different ciphers (base64, spaced hex, 0x-prefixed hex).
 *
 * The three fragments resolve to a drink, a weather condition and an ordinal;
 * the assembly rule (hidden in the markup and on `window`) joins two of them.
 *
 * Nothing on the painted page contains the words.
 */

const FRAGMENT_A = 'VEVB' // base64
const FRAGMENT_B = '52 41 49 4E' // hex
const FRAGMENT_C = '0x46 0x49 0x52 0x53 0x54' // hex, 0x-prefixed
const RULE = 'FLAG{A_IN_THE_B}'

const COMMENT = [
  '',
  ' ARCHIVE 02 :: sensor fragment',
  ' ----------------------------------------------',
  ' sensor ......... TVM-RAIN-01',
  ' occasion ....... the first one',
  '',
  ' three fragments survived, in three different disguises.',
  ' they are attached to the runtime, not to the paint:',
  '',
  '     > window.__ARCHIVE_02__',
  '',
  ' they are also sitting in the data-* attributes of the',
  ' hidden element directly below this comment.',
  '',
  ' assembly rule .. ' + RULE,
  '   A = fragment A, decoded',
  '   B = fragment B, decoded',
  '   fragment C tells you which one this was.',
  ' ----------------------------------------------',
  '',
].join('\n')

export function Memory02RainSensor() {
  /* Bolt the fragment object onto window so the DevTools console is a real
     recon surface here — exactly like a live CTF target would be. */
  useEffect(() => {
    const w = window as unknown as Record<string, unknown>
    w.__ARCHIVE_02__ = {
      sensor: 'TVM-RAIN-01',
      occasion: 'the first one',
      note: 'three fragments, three disguises. decode each, then apply .rule',
      fragments: {
        a: FRAGMENT_A,
        b: FRAGMENT_B,
        c: FRAGMENT_C,
      },
      rule: RULE,
      // small helper so a console-only player can still verify their read
      hint: 'atob(fragments.a) for the first one. the DECODER in the toolbar does all three.',
    }
    return () => {
      delete w.__ARCHIVE_02__
    }
  }, [])

  return (
    <ChallengeShell id="mem02">
      <DomComment text={COMMENT} />
      <DataClue
        attrs={{
          'data-sensor': 'TVM-RAIN-01',
          'data-fragment-a': FRAGMENT_A,
          'data-fragment-b': FRAGMENT_B,
          'data-fragment-c': FRAGMENT_C,
          'data-assembly': RULE,
          'data-runtime': 'window.__ARCHIVE_02__',
        }}
      />

      <div className="sensor panel ticked rainbox">
        <div className="rainbox__rain" aria-hidden="true">
          {Array.from({ length: 9 }, (_, i) => (
            <i key={i} style={{ left: `${6 + i * 11}%`, animationDelay: `${-i * 0.42}s`, animationDuration: `${2.2 + (i % 4) * 0.5}s` }} />
          ))}
        </div>

        <div className="panel-head">
          <span>SENSOR LOG // TVM-RAIN-01</span>
          <span className="mono faint">REC-02</span>
        </div>

        <div className="panel-body">
          <div className="sensor__readout mono">
            <div>
              <span className="faint">17:42</span> precip=<b>YES</b> humidity=<b>94%</b>
            </div>
            <div>
              <span className="faint">18:06</span> precip=<b>YES</b> visibility=<b>LOW</b>
            </div>
            <div>
              <span className="faint">18:31</span> precip=<b>YES</b> subjects=<b>2</b> leaving=<b>NO</b>
            </div>
          </div>

          <div className="sensor__fragments">
            {[
              { k: 'A', enc: 'BASE64', v: FRAGMENT_A },
              { k: 'B', enc: 'HEX PAIRS', v: FRAGMENT_B },
              { k: 'C', enc: 'HEX // 0x', v: FRAGMENT_C },
            ].map((f) => (
              <div className="fragmentcard" key={f.k}>
                <span className="fragmentcard__k mono">FRAGMENT {f.k}</span>
                <span className="fragmentcard__enc mono faint">{f.enc}</span>
                <span className="fragmentcard__v mono">{f.v}</span>
              </div>
            ))}
          </div>

          <div className="sensor__media mono">
            <span className="faint">MEDIA ATTACHMENT</span>
            <code>
              {PHOTOS.teaRain}.jpg <span className="faint">// withheld until recovery</span>
            </code>
          </div>

          <div className="archive__diag mono faint">
            <span>fragments: 3 of 3 recovered from the sensor</span>
            <span>decoded: 0 of 3</span>
            <span>console: available</span>
          </div>
        </div>
      </div>

      <div className="challenge__technique mono">
        <span className="challenge__techlabel">RECON SURFACES FOR THIS RECORD</span>
        <ul>
          <li>
            the DevTools console — <code>window.__ARCHIVE_02__</code>
          </li>
          <li>the Elements panel — three <code>data-fragment-*</code> attributes on a hidden node</li>
          <li>the DECODER in the toolbar (it does base64 and hex in one click)</li>
        </ul>
      </div>
    </ChallengeShell>
  )
}
