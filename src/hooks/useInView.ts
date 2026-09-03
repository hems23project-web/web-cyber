import { useEffect, useRef, useState } from 'react'

/**
 * useInView — adds a scroll-triggered entrance without any animation library.
 * Returns a ref to attach and whether the element has entered the viewport.
 * Fires once; honours reduced motion by resolving immediately.
 */
export function useInView<T extends HTMLElement = HTMLDivElement>(
  options: { threshold?: number; rootMargin?: string; once?: boolean } = {},
) {
  const { threshold = 0.18, rootMargin = '0px 0px -8% 0px', once = true } = options
  const ref = useRef<T | null>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    if (typeof IntersectionObserver === 'undefined') {
      setInView(true)
      return
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setInView(true)
            if (once) io.unobserve(entry.target)
          } else if (!once) {
            setInView(false)
          }
        }
      },
      { threshold, rootMargin },
    )

    io.observe(el)
    return () => io.disconnect()
  }, [threshold, rootMargin, once])

  return { ref, inView }
}
