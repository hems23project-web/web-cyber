import { ChallengeShell } from './ChallengeShell'
import { DataClue } from '@/components/ui/DomComment'
import { PLACES } from '@/data/birthdayConfig'

/**
 * MEMORY 05 // THE JOURNEY
 * Technique: base64 date + a contextual clue that resolves a three-letter
 * carrier code through a static route table (whose city names are stored
 * reversed — with a worked example included so it needs no outside knowledge).
 *
 *   date ......... MjAyNi0wMi0xNA==  → 2026-02-14  → 14_02_2026
 *   destination .. BLR → route table → "EROLAGNAB" → reversed → the city
 *   assembly ..... FLAG{CITY_DD_MM_YYYY}
 */

const DEPARTURE_B64 = 'MjAyNi0wMi0xNA=='

export function Memory05Journey() {
  return (
    <ChallengeShell id="mem05">
      <DataClue
        attrs={{
          'data-manifest': 'journey-05',
          'data-departure-encoded': DEPARTURE_B64,
          'data-departure-encoding': 'base64 -> ISO yyyy-mm-dd',
          'data-carrier-code': PLACES.bangaloreIata,
          'data-route-table': '/records/route-table.json',
          'data-assembly': 'FLAG{CITY_DD_MM_YYYY}',
        }}
      />

      <div className="journey panel ticked">
        <div className="panel-head">
          <span>TRAVEL MANIFEST // JOURNEY-05</span>
          <span className="mono faint">1 LEG</span>
        </div>

        <div className="panel-body">
          <div className="journey__route" aria-hidden="true">
            <span className="journey__node">
              <b className="mono">TRV</b>
              <i className="mono faint">origin · you know this one</i>
            </span>
            <span className="journey__line">
              <svg viewBox="0 0 200 24" preserveAspectRatio="none">
                <path d="M2 18 C 60 2, 140 2, 198 18" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" />
                <path d="M186 12 l12 6 -12 6z" fill="currentColor" />
              </svg>
            </span>
            <span className="journey__node journey__node--end">
              <b className="mono">{PLACES.bangaloreIata}</b>
              <i className="mono faint">destination · name withheld</i>
            </span>
          </div>

          <dl className="kv journey__fields">
            <dt>DESTINATION</dt>
            <dd>
              <span className="redacted">{'█'.repeat(9)}</span>{' '}
              <span className="mono faint">carrier code {PLACES.bangaloreIata}</span>
            </dd>

            <dt>DEPARTURE</dt>
            <dd>
              <code className="journey__b64 mono">{DEPARTURE_B64}</code>
              <span className="mono faint"> · base64 · ISO yyyy-mm-dd</span>
            </dd>

            <dt>PURPOSE</dt>
            <dd className="mono">
              UNSTATED <span className="faint">· the world was buying flowers that week. neither of you were.</span>
            </dd>

            <dt>RETURN</dt>
            <dd className="mono faint">eventually</dd>
          </dl>

          <a className="attachment mono" href="/records/route-table.json" target="_blank" rel="noreferrer">
            <span className="attachment__icon" aria-hidden="true">
              ▤
            </span>
            <span className="attachment__name">route-table.json</span>
            <span className="attachment__meta faint">carrier route table · city names stored oddly · example included</span>
          </a>

          <div className="archive__diag mono faint">
            <span>assembly: FLAG&#123;CITY_DD_MM_YYYY&#125;</span>
            <span>date: encoded</span>
            <span>city: three letters</span>
          </div>
        </div>
      </div>

      <div className="challenge__technique mono">
        <span className="challenge__techlabel">RECON SURFACES FOR THIS RECORD</span>
        <ul>
          <li>base64 → the DECODER in the toolbar does it in one click</li>
          <li>
            <code>/records/route-table.json</code> — read its header before you read its rows
          </li>
          <li>the worked example in that file tells you the convention for free</li>
        </ul>
      </div>
    </ChallengeShell>
  )
}
