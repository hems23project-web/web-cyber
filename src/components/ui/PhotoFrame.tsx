import { useEffect, useState } from 'react'
import type { PhotoKey } from '@/data/birthdayConfig'
import { photoCandidates, photoLabel } from '@/utils/format'

interface PhotoFrameProps {
  photo: PhotoKey
  alt: string
  caption?: string
  /** CSS aspect-ratio, e.g. "4 / 3" */
  aspect?: string
  className?: string
  /** small mono tag rendered in the corner, e.g. "EVIDENCE 04" */
  tag?: string
  /** dim + desaturate until hovered (used in the gallery grid) */
  interactive?: boolean
}

/**
 * PhotoFrame — shows a personal photo if one exists, otherwise an elegant
 * placeholder that names the exact file it is waiting for.
 *
 * Nothing here invents imagery. Tries jpg → jpeg → png → webp for the
 * configured base filename, so `munroe.png` works as well as `munroe.jpg`.
 * See public/photos/README.md.
 */
export function PhotoFrame({
  photo,
  alt,
  caption,
  aspect = '4 / 3',
  className = '',
  tag,
  interactive = false,
}: PhotoFrameProps) {
  const candidates = photoCandidates(photo)
  const [idx, setIdx] = useState(0)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    setIdx(0)
    setLoaded(false)
  }, [photo])

  const exhausted = idx >= candidates.length
  const src = exhausted ? null : candidates[idx]

  return (
    <figure className={`photoframe ${interactive ? 'photoframe--interactive' : ''} ${className}`}>
      <div className="photoframe__media" style={{ aspectRatio: aspect }}>
        {src ? (
          <img
            src={src}
            alt={alt}
            loading="lazy"
            decoding="async"
            className={`photoframe__img ${loaded ? 'is-loaded' : ''}`}
            onLoad={() => setLoaded(true)}
            onError={() => {
              setLoaded(false)
              setIdx((i) => i + 1)
            }}
          />
        ) : (
          <div className="photoframe__placeholder" role="img" aria-label={`Photo placeholder for ${photoLabel(photo)}`}>
            <svg viewBox="0 0 64 48" className="photoframe__glyph" aria-hidden="true">
              <rect x="1.5" y="1.5" width="61" height="45" rx="2" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" opacity=".5" />
              <path d="M8 38l13-15 9 10 8-9 12 14z" fill="none" stroke="currentColor" strokeWidth="1.2" opacity=".65" />
              <circle cx="45" cy="14" r="4.5" fill="none" stroke="currentColor" strokeWidth="1.2" opacity=".65" />
            </svg>
            <span className="photoframe__missing">AWAITING FILE</span>
            <code className="photoframe__path">{photoLabel(photo)}</code>
          </div>
        )}
        {tag && <span className="photoframe__tag">{tag}</span>}
        {!exhausted && !loaded && <span className="photoframe__shimmer" aria-hidden="true" />}
      </div>
      {caption && <figcaption className="photoframe__caption">{caption}</figcaption>}
    </figure>
  )
}
