import type { MiaContext } from '@/data/miaDialogue'

export type { MiaContext }

export interface ChatMessage {
  id: string
  role: 'mia' | 'player' | 'system'
  /** each entry renders as its own terminal line */
  lines: string[]
  ts: number
  /** true while the line is still being typed out */
  typing?: boolean
}

/**
 * A pluggable completion backend.
 *
 * The shipped product uses `ScriptedEngine`, which is deterministic, offline
 * and cannot fail. `LocalModelEngine` exists so a browser-local open-weights
 * model can be layered on top later WITHOUT touching any UI code — and it must
 * degrade silently to the scripted engine if anything goes wrong.
 */
export interface MiaEngine {
  readonly name: string
  readonly available: boolean
  /** Returns null/throws-free undefined when the engine cannot answer. */
  complete(input: string, ctx: MiaContext): Promise<string[] | null>
}
