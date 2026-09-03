/**
 * Resolve a site-relative path against wherever the app is actually deployed.
 *
 * The build uses a relative Vite `base`, so one bundle works both at a domain
 * root (Netlify, Cloudflare, Vercel) and under a sub-path such as GitHub Pages'
 * `https://user.github.io/repo/`. Hardcoding `/archive/...` would 404 in the
 * second case — and because those files carry real clues, three of the seven
 * memories would silently become unsolvable.
 *
 * Display strings (the `data-*` attributes and file labels that form part of
 * the puzzles' fiction) deliberately keep their leading slash; only the URLs
 * the browser actually requests go through here.
 */
export function assetUrl(path: string): string {
  // `import.meta.env` is undefined when the app is bundled outside Vite (the
  // verification harness uses esbuild), so this has to stay defensive.
  const base = import.meta.env?.BASE_URL || '/'
  const clean = path.replace(/^\/+/, '')
  if (!clean) return base
  return base.endsWith('/') ? `${base}${clean}` : `${base}/${clean}`
}
