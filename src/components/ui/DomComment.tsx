import { useEffect, useRef } from 'react'

/**
 * DomComment — injects a REAL HTML comment node into the live DOM.
 *
 * This is not decoration. It shows up in the DevTools Elements panel and in
 * `document.documentElement.outerHTML`, which is exactly what MEMORY 01 and
 * MEMORY 04 rely on. Vite/React strip JSX comments at build time, so the
 * clues have to be inserted at runtime to survive a production build.
 */
export function DomComment({ text, host = 'inline' }: { text: string; host?: 'inline' | 'body' }) {
  const anchor = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    let node: Comment | null = null
    if (host === 'body') {
      node = document.createComment(text)
      document.body.appendChild(node)
    } else {
      const el = anchor.current
      if (el?.parentNode) {
        node = document.createComment(text)
        el.parentNode.insertBefore(node, el)
      }
    }
    return () => {
      node?.remove()
      node = null
    }
  }, [text, host])

  return <span ref={anchor} hidden aria-hidden="true" />
}

/**
 * DataClue — renders a visually-hidden element carrying a clue in a data-*
 * attribute. Another standard recon surface: the markup holds more than the
 * painted pixels do.
 */
export function DataClue({ attrs, comment }: { attrs: Record<string, string>; comment?: string }) {
  return (
    <>
      {comment ? <DomComment text={comment} /> : null}
      <span hidden aria-hidden="true" {...attrs} />
    </>
  )
}
