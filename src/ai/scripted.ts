import type { MiaEngine, MiaContext } from './types'
import { MIA_RULES, MIA_FALLBACKS, type MiaRule } from '@/data/miaDialogue'

/**
 * ScriptedEngine — the deterministic core of M.I.A.
 *
 * No network, no model, no API key, no randomness that could strand a player.
 * This engine alone makes the entire CTF completable, which is a hard
 * requirement: M.I.A. is an enhancement, never a dependency.
 */

const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

function groupMatches(haystack: string, group: string[]): boolean {
  return group.every((needle) => haystack.includes(norm(needle)))
}

function scoreRule(rule: MiaRule, text: string): number {
  if (rule.not?.some((n) => text.includes(norm(n)))) return -1
  let best = -1
  for (const group of rule.match) {
    if (!group.length) continue
    if (groupMatches(text, group)) {
      // longer, more specific groups win
      const score = group.reduce((acc, w) => acc + w.length, 0) + group.length * 4
      if (score > best) best = score
    }
  }
  if (best < 0) return -1
  return best + (rule.priority ?? 0)
}

function resolve(reply: MiaRule['reply'], ctx: MiaContext): string[] {
  const value = typeof reply === 'function' ? reply(ctx) : reply
  const lines = Array.isArray(value) ? value : [value]
  return lines.filter((l) => typeof l === 'string' && l.length > 0)
}

export class ScriptedEngine implements MiaEngine {
  readonly name = 'SCRIPTED'
  readonly available = true

  async complete(input: string, ctx: MiaContext): Promise<string[] | null> {
    const text = norm(input)
    if (!text) return null

    let bestRule: MiaRule | null = null
    let bestScore = -1

    for (const rule of MIA_RULES) {
      if (rule.gate && !rule.gate(ctx)) continue
      const score = scoreRule(rule, text)
      if (score > bestScore) {
        bestScore = score
        bestRule = rule
      }
    }

    if (bestRule) return resolve(bestRule.reply, ctx)

    // Deterministic rotation — never random, so a repeat question eventually
    // walks the whole fallback set instead of looping on one line.
    const pool = MIA_FALLBACKS
    const pick = pool[ctx.turn % pool.length]
    return pick(ctx)
  }
}
