import type { ReactNode } from 'react'
import { Ambient } from '@/components/ui/Ambient'
import { PhotoFrame } from '@/components/ui/PhotoFrame'
import { QrPanel } from '@/components/QrPanel'
import { useGame } from '@/hooks/useGame'
import { useInView } from '@/hooks/useInView'
import {
  AUTHOR_SIGNATURE,
  AUDIT_REPORT,
  DISPLAY_DATES,
  RECIPIENT_NAME,
  REVEAL,
  RELATIONSHIP_LABEL,
  TIMELINE,
  PHOTOS,
  type PhotoKey,
} from '@/data/birthdayConfig'
import { CHALLENGES, FRAGMENT_IDS, CHALLENGE_BY_ID, canonicalAnswer, type ChallengeId } from '@/data/challenges'
import { buildFlag } from '@/utils/flags'
import { sfx } from '@/utils/sound'

/** Phase 4 — the birthday letter. Warm, quiet, and entirely about him. */
export function RevealPage() {
  const { setPhase, reset, solvedCount, hintsUsed, state } = useGame()
  const started = state.startedAt
  const finished = state.finishedAt
  const minutes = started && finished ? Math.max(1, Math.round((finished - started) / 60000)) : null

  return (
    <div className={`reveal theme-light ${state.reduceMotion ? 'reduce-motion' : ''}`}>
      <Ambient circuit={false} glow grain={false} vignette={false} className="reveal__ambient" />
      <Hearts />

      {/* ------------------------------------------------------------ hero -- */}
      <section className="reveal__hero shell">
        <p className="reveal__kicker mono">MEMORY CORE · 100% · ALL RECORDS RECOVERED</p>
        <h1 className="reveal__title display">
          {REVEAL.headingLines.slice(0, -1).map((line) => (
            <span key={line} className="reveal__titletop">
              {line}
            </span>
          ))}{' '}
          <span className="reveal__title3">
            {REVEAL.headingLines[REVEAL.headingLines.length - 1]}{' '}
            <span className="reveal__heart" aria-hidden="true">
              {REVEAL.heart}
            </span>
          </span>
        </h1>
        <p className="reveal__dateline mono">{DISPLAY_DATES.hisBirthday} → ∞</p>

        <div className="reveal__paras">
          {REVEAL.paragraphs.map((para, i) => (
            <RevealBlock key={i} delay={i}>
              {para.map((line, j) => (
                <p key={j} className={`reveal__para ${line.endsWith('?') ? 'reveal__para--q' : ''}`}>
                  {line}
                </p>
              ))}
            </RevealBlock>
          ))}
        </div>

        {minutes !== null && (
          <p className="reveal__stat mono">
            you spent <b>{minutes}</b> minute{minutes === 1 ? '' : 's'} on this · {solvedCount}/6 fragments ·{' '}
            {hintsUsed} hint{hintsUsed === 1 ? '' : 's'} used · and every single one of them was worth it
          </p>
        )}
      </section>

      {/* -------------------------------------------------------- timeline -- */}
      <section className="reveal__section shell" id="timeline">
        <SectionHeading label={REVEAL.sectionTimeline} sub="nine entries. none of them invented." />

        <ol className="timeline">
          {TIMELINE.map((t, i) => (
            <TimelineRow key={t.n} entry={t} index={i} />
          ))}
        </ol>
      </section>

      {/* --------------------------------------------------------- gallery -- */}
      <section className="reveal__section shell" id="gallery">
        <SectionHeading
          label={REVEAL.sectionGallery}
          sub={REVEAL.gallerySub}
        />
        <div className="gallery">
          {(Object.keys(PHOTOS) as PhotoKey[]).map((key, i) => (
            <RevealBlock key={key} delay={i % 5} className="gallery__cell">
              <PhotoFrame
                photo={key}
                alt={`Memory — ${key}`}
                tag={`EVIDENCE ${String(i + 1).padStart(2, '0')}`}
                aspect="4 / 3"
                interactive
              />
            </RevealBlock>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------------ audit -- */}
      <section className="reveal__section shell" id="audit">
        <SectionHeading label={REVEAL.sectionVulnerabilities} sub="unpatched. permanently." />

        <RevealBlock className="auditreport panel">
          <ul className="auditreport__list mono">
            {AUDIT_REPORT.map((row) => (
              <li key={row.id}>
                <span className="auditreport__id">{row.id}</span>
                <span className="auditreport__name">{row.name}</span>
                <span className="auditreport__detail">{row.detail}</span>
              </li>
            ))}
          </ul>
          <p className="auditreport__conclusion">
            <span className="mono">SYSTEM CONCLUSION:</span> “{REVEAL.auditConclusion}”
          </p>
          <p className="auditreport__note">{REVEAL.auditNote}</p>
        </RevealBlock>
      </section>

      {/* -------------------------------------------------------- recovered -- */}
      <section className="reveal__section shell" id="recovered">
        <SectionHeading label="WHAT YOU ACTUALLY RECOVERED" sub="seven flags. not one of them was about hacking." />
        <ol className="recoveredlist">
          {[...FRAGMENT_IDS, 'mem07' as const].map((id, i) => (
            <RecoveredRow key={id} id={id} index={i} />
          ))}
        </ol>
        <p className="recoveredlist__note">
          and the one that was never a flag at all — <b>{DISPLAY_DATES.herBirthday}</b>, mine, which you have known
          for {RELATIONSHIP_LABEL.toLowerCase()} and have never once forgotten.
        </p>
      </section>

      {/* -------------------------------------------------------------- qr -- */}
      <section className="reveal__section shell reveal__section--dark" id="qr">
        <SectionHeading label="QR // FOR THE PHYSICAL PART" sub="print it, stitch it, hide it somewhere" />
        <QrPanel />
      </section>

      {/* --------------------------------------------------------- closing -- */}
      <section className="reveal__closing shell">
        <RevealBlock>
          <h2 className="reveal__closingtitle display">{REVEAL.closingTitle}</h2>
          {REVEAL.closing.map((line, i) => (
            <p key={i} className={`reveal__closingline ${i === REVEAL.closing.length - 1 ? 'reveal__closingline--big' : ''}`}>
              {line}
            </p>
          ))}
          <p className="reveal__sig mono">{AUTHOR_SIGNATURE}</p>
        </RevealBlock>

        <div className="reveal__actions">
          <button
            type="button"
            className="btn"
            onClick={() => {
              sfx.open()
              setPhase('ctf')
            }}
          >
            ← BACK INTO THE SYSTEM
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => {
              if (window.confirm('Start the whole thing over? This wipes every recovered memory in this browser.')) {
                reset()
              }
            }}
          >
            ⟲ {REVEAL.ctaReplay}
          </button>
        </div>

        <p className="reveal__foot mono faint">
          built by hand for {RECIPIENT_NAME} · {CHALLENGES.length} records · 0 flags that were ever really about flags
        </p>
      </section>
    </div>
  )
}

/* -------------------------------------------------------------------------- */

function SectionHeading({ label, sub }: { label: string; sub?: string }) {
  const { ref, inView } = useInView<HTMLDivElement>()
  return (
    <div className={`sectionhead ${inView ? 'is-in' : ''}`} ref={ref}>
      <h2 className="sectionhead__label mono">{label}</h2>
      {sub && <p className="sectionhead__sub">{sub}</p>}
      <span className="sectionhead__rule" aria-hidden="true" />
    </div>
  )
}

function RevealBlock({
  children,
  delay = 0,
  className = '',
}: {
  children: ReactNode
  delay?: number
  className?: string
}) {
  const { ref, inView } = useInView<HTMLDivElement>()
  return (
    <div ref={ref} className={`revealblock ${inView ? 'is-in' : ''} ${className}`} style={{ transitionDelay: `${delay * 90}ms` }}>
      {children}
    </div>
  )
}

function TimelineRow({ entry, index }: { entry: (typeof TIMELINE)[number]; index: number }) {
  const { ref, inView } = useInView<HTMLLIElement>({ threshold: 0.12 })
  const flip = index % 2 === 1
  return (
    <li className={`trow ${inView ? 'is-in' : ''} ${flip ? 'trow--flip' : ''}`} ref={ref}>
      <div className="trow__marker" aria-hidden="true">
        <span className="trow__n mono">{entry.n}</span>
        <i className="trow__dot" />
      </div>
      <div className="trow__media">
        {entry.photo ? (
          <PhotoFrame photo={entry.photo} alt={entry.caption} tag={entry.code} aspect="16 / 10" />
        ) : (
          <span className="trow__spacer" aria-hidden="true" />
        )}
      </div>
      <div className="trow__body">
        <h3 className="trow__code display">{entry.code}</h3>
        <p className="trow__caption">{entry.caption}</p>
        {entry.sub && <p className="trow__sub mono">{entry.sub}</p>}
      </div>
    </li>
  )
}

function RecoveredRow({ id, index }: { id: ChallengeId; index: number }) {
  const { ref, inView } = useInView<HTMLLIElement>({ threshold: 0.2 })
  const c = CHALLENGE_BY_ID[id]
  return (
    <li
      ref={ref}
      className={`recoveredlist__item mono ${inView ? 'is-in' : ''}`}
      style={{ transitionDelay: `${(index % 4) * 90}ms` }}
    >
      <span className="recoveredlist__n">{String(c.index).padStart(2, '0')}</span>
      <span className="recoveredlist__t">{c.solvedHeadline || c.title}</span>
      <span className="recoveredlist__f">{buildFlag(canonicalAnswer(id))}</span>
    </li>
  )
}

/** A few slow-drifting hearts. Restrained — this is not a greeting card. */
function Hearts() {
  return (
    <div className="hearts" aria-hidden="true">
      {HEART_SPOTS.map((h, i) => (
        <span
          key={i}
          style={{
            left: `${h.x}%`,
            fontSize: `${h.size}px`,
            animationDuration: `${h.dur}s`,
            animationDelay: `-${h.delay}s`,
            opacity: h.o,
          }}
        >
          ❤
        </span>
      ))}
    </div>
  )
}

const HEART_SPOTS = [
  { x: 8, size: 12, dur: 26, delay: 0, o: 0.16 },
  { x: 19, size: 8, dur: 34, delay: 6, o: 0.12 },
  { x: 33, size: 14, dur: 30, delay: 12, o: 0.14 },
  { x: 47, size: 9, dur: 38, delay: 3, o: 0.1 },
  { x: 61, size: 13, dur: 28, delay: 9, o: 0.15 },
  { x: 74, size: 8, dur: 36, delay: 15, o: 0.11 },
  { x: 88, size: 12, dur: 32, delay: 5, o: 0.13 },
]
