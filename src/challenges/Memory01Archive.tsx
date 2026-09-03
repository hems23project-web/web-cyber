import { ChallengeShell } from './ChallengeShell'
import { DataClue, DomComment } from '@/components/ui/DomComment'
import { PLACES } from '@/data/birthdayConfig'

/**
 * MEMORY 01 // WHERE IT BEGAN
 * Technique: HTML source & comments + a static archive file.
 *
 * The interface deliberately renders an incomplete record. The missing field
 * was transmitted — it just was never painted. The player finds it in:
 *   1. the comment at the top of index.html (view-source)
 *   2. the live DOM comment injected beside the panel (Elements)
 *   3. /archive/index.txt → /archive/ilp-session-01.log
 *
 * The answer is never written on this page.
 */

const COMMENT_CLUE = [
  '',
  ' ARCHIVE 01 :: render log',
  ' ----------------------------------------------',
  ' fragment ......... WHERE IT BEGAN',
  ' integrity ........ 61%',
  ' suppressed ....... 1 field (LOCATION)',
  '',
  ' note: the transmission was complete. the paint was not.',
  '',
  '   site_code ..... ILP',
  '   city_official . THIRUVANANTHAPURAM',
  '   city_common ... <the name everyone actually uses>',
  '   state ......... KERALA',
  '',
  '   assembly rule . FLAG{ <CITY>_<SITE_CODE> }',
  '                   CITY = the common name, not the official one',
  '',
  ' full record ..... /archive/ilp-session-01.log',
  ' archive index ... /archive/index.txt',
  ' ----------------------------------------------',
  '',
].join('\n')

export function Memory01Archive() {
  return (
    <ChallengeShell id="mem01">
      <DomComment text={COMMENT_CLUE} />

      <DataClue
        comment=" field-suppression: 1 // see /archive/ilp-session-01.log "
        attrs={{
          'data-archive': 'ilp-session-01',
          'data-integrity': '61%',
          'data-suppressed-fields': 'LOCATION',
          'data-region': 'KERALA',
          'data-site-code': PLACES.ilp,
        }}
      />

      <div className="archive panel ticked">
        <div className="panel-head">
          <span>ILP SESSION ARCHIVE</span>
          <span className="mono faint">REC-01</span>
        </div>

        <div className="panel-body">
          <dl className="kv archive__fields">
            <dt>PROGRAM</dt>
            <dd>ILP — INTEGRATED LEARNING PROGRAMME</dd>

            <dt>LOCATION</dt>
            <dd>
              <span className="redacted" aria-label="redacted">
                {'█'.repeat(12)}
              </span>
            </dd>

            <dt>STATUS</dt>
            <dd>ARCHIVED</dd>

            <dt>INTEGRITY</dt>
            <dd className="mono">
              61% <span className="faint">· 1 field suppressed during render</span>
            </dd>
          </dl>

          <div className="archive__note mono">
            <span className="archive__notetag">OPERATOR NOTE</span>
            <p>
              “The page shows you a redacted box. The box is a lie of omission, not a lie. Everything you need was
              already transmitted — you just have to look at what arrived instead of what was drawn.”
            </p>
          </div>

          <div className="archive__diag mono faint">
            <span>render pipeline: ok</span>
            <span>dom: complete</span>
            <span>source: not what you think</span>
          </div>
        </div>
      </div>

      <div className="challenge__technique mono">
        <span className="challenge__techlabel">RECON SURFACES FOR THIS RECORD</span>
        <ul>
          <li>view-source of the page you are on (the very top)</li>
          <li>the Elements panel — comments and data-* attributes near this card</li>
          <li>
            <code>/archive/index.txt</code> and <code>/archive/ilp-session-01.log</code>
          </li>
        </ul>
      </div>
    </ChallengeShell>
  )
}
