import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'
import { rmSync } from 'node:fs'
import { resolve } from 'node:path'

/**
 * `public/photos/README.md` and `public/assets/README.md` are instructions for
 * whoever maintains this repo. They're useful next to the files they describe
 * but they shouldn't ship on the public site, so drop them from the build.
 */
function stripRepoNotes(): Plugin {
  return {
    name: 'strip-repo-notes',
    apply: 'build',
    closeBundle() {
      for (const rel of ['photos/README.md', 'assets/README.md']) {
        try {
          rmSync(resolve('dist', rel), { force: true })
        } catch {
          /* nothing to strip */
        }
      }
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), stripRepoNotes()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: false,
    // The Arena live-preview proxies this dev server under a *.e2b.app host.
    // `true` disables the host-header allowlist so the preview is reachable.
    allowedHosts: true,
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
    allowedHosts: true,
  },
  build: {
    outDir: 'dist',
    // Vite's own hashed bundles go to dist/static so they never collide with
    // the hand-managed public/assets folder.
    assetsDir: 'static',
    sourcemap: false,
    chunkSizeWarningLimit: 900,
  },
})
