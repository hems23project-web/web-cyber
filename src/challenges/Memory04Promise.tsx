import { ChallengeShell } from './ChallengeShell'
import { DataClue, DomComment } from '@/components/ui/DomComment'
import { assetUrl } from '@/utils/paths'

/**
 * MEMORY 04 // THE PROMISE
 * Technique: three shards in three numeral systems, split across three
 * surfaces — the painted panel, the markup, and a static file.
 *
 *   shard A  0x1B      hex        → day      (visible)
 *   shard B  MDk=      base64     → month    (in the markup only)
 *   shard C  MMXXV     roman      → year     (in /records/p-04.stamp)
 *
 * The word "proposal" is never used before this record is recovered.
 */

const SHARD_A = '0x1B'
const SHARD_B = 'MDk='

const COMMENT = [
  '',
  ' RECORD 04 :: three locks',
  ' ----------------------------------------------',
  ' shard A ... ' + SHARD_A + '   (hex)      ... on the panel',
  ' shard B ... ' + SHARD_B + '      (base64)   ... here, and only here',
  ' shard C ... roman numerals  ... filed separately, /records/p-04.stamp',
  '',
  ' assembly .. FLAG{ <DAY>_<MONTH>_<YEAR> }',
  '             day and month are two digits, year is four.',
  '',
  ' context ... not a birthday. not an ordinary anniversary.',
  '             a question was asked on this date.',
  ' ----------------------------------------------',
  '',
].join('\n')

export function Memory04Promise() {
  return (
    <ChallengeShell id="mem04">
      <DomComment text={COMMENT} />
      <DataClue
        attrs={{
          'data-record': 'p-04',
          'data-shard-a': SHARD_A,
          'data-shard-b': SHARD_B,
          'data-shard-c-location': '/records/p-04.stamp',
          'data-assembly': 'DD_MM_YYYY',
        }}
      />

      <div className="promise panel ticked">
        <div className="panel-head">
          <span>SEALED RECORD // P-04</span>
          <span className="mono faint">3 LOCKS</span>
        </div>

        <div className="panel-body">
          <div className="promise__date">
            <span className="promise__slot">
              <i className="mono">DD</i>
              <span className="redacted">{'█'.repeat(2)}</span>
            </span>
            <span className="promise__dot" aria-hidden="true">
              .
            </span>
            <span className="promise__slot">
              <i className="mono">MM</i>
              <span className="redacted">{'█'.repeat(2)}</span>
            </span>
            <span className="promise__dot" aria-hidden="true">
              .
            </span>
            <span className="promise__slot">
              <i className="mono">YYYY</i>
              <span className="redacted">{'█'.repeat(4)}</span>
            </span>
          </div>

          <div className="shards">
            <div className="shard shard--open">
              <span className="shard__k mono">SHARD A · DAY</span>
              <code className="shard__v mono">{SHARD_A}</code>
              <span className="shard__enc mono faint">hexadecimal · on this panel</span>
            </div>

            <div className="shard shard--hidden">
              <span className="shard__k mono">SHARD B · MONTH</span>
              <code className="shard__v mono">
                <span className="redacted">{'█'.repeat(4)}</span>
              </code>
              <span className="shard__enc mono faint">base64 · not in the pixels</span>
            </div>

            <div className="shard shard--file">
              <span className="shard__k mono">SHARD C · YEAR</span>
              <code className="shard__v mono">MMXXV</code>
              <span className="shard__enc mono faint">roman · filed separately</span>
            </div>
          </div>

          <a className="attachment mono" href={assetUrl('/records/p-04.stamp')} target="_blank" rel="noreferrer">
            <span className="attachment__icon" aria-hidden="true">
              ▤
            </span>
            <span className="attachment__name">p-04.stamp</span>
            <span className="attachment__meta faint">attachment · 1 file · shard C</span>
          </a>

          <div className="archive__diag mono faint">
            <span>assembly: DD_MM_YYYY</span>
            <span>locks: 3</span>
            <span>opened: 1</span>
          </div>
        </div>
      </div>

      <div className="challenge__technique mono">
        <span className="challenge__techlabel">RECON SURFACES FOR THIS RECORD</span>
        <ul>
          <li>this panel — shard A is printed on it</li>
          <li>the Elements panel — shard B is in the markup around this card, never rendered</li>
          <li>
            <code>/records/p-04.stamp</code> — shard C, in roman numerals
          </li>
        </ul>
      </div>
    </ChallengeShell>
  )
}
