#!/usr/bin/env node
/**
 * scripts/verify.mjs — build the app, bundle the jsdom harness, play the whole
 * game and report.
 *
 *   npm run verify           # build first (checks the shipped bundle too)
 *   npm run verify -- --fast # skip the production build
 */

import { build } from 'esbuild'
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const fast = process.argv.includes('--fast')

function run(cmd, args) {
  const r = spawnSync(cmd, args, { cwd: root, stdio: 'inherit', shell: false })
  if (r.status !== 0) process.exit(r.status ?? 1)
}

const bin = (name) => path.join(root, 'node_modules/.bin', name)

if (!fast) {
  console.log('\n▸ typecheck')
  run(bin('tsc'), ['-b', '--pretty', 'false'])
  console.log('\n▸ production build')
  run(bin('vite'), ['build'])
}

console.log('\n▸ bundling the verification harness')
await build({
  entryPoints: [path.join(root, 'scripts/verify.entry.tsx')],
  outfile: path.join(root, '.verify/bundle.mjs'),
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node20',
  jsx: 'automatic',
  define: { 'process.env.NODE_ENV': '"development"' },
  alias: { '@': path.join(root, 'src') },
  external: ['jsdom', 'qrcode'],
  logLevel: 'warning',
  absWorkingDir: root,
})

console.log('\n▸ playing the whole game under jsdom')
run(process.execPath, [path.join(root, '.verify/bundle.mjs')])
