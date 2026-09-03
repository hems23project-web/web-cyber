import { ScriptedEngine } from './scripted'
import { LocalModelEngine } from './localModel'
import type { ChatMessage, MiaContext, MiaEngine } from './types'
import {
  MIA_AMBIENT,
  MIA_PROGRESSION,
  MIA_SOLVE_REACTION,
  MEM03_CLUE,
} from '@/data/miaDialogue'
import { MIA, MIA_FINAL_MESSAGE, NICKNAME, RECIPIENT_NAME, SUBJECT_ID } from '@/data/birthdayConfig'
import type { ChallengeId } from '@/data/challenges'

export type { ChatMessage, MiaContext, MiaEngine }

let seq = 0
export function makeMessage(role: ChatMessage['role'], lines: string[]): ChatMessage {
  seq += 1
  return { id: `m${Date.now().toString(36)}-${seq}`, role, lines, ts: Date.now() }
}

/**
 * M.I.A. orchestrator.
 *
 *   ask()  →  LocalModelEngine (optional, off by default)
 *          →  ScriptedEngine    (always available, deterministic)
 *
 * The scripted engine is not a stub: it is the product. The local-model layer
 * is an optional enhancement that can never break the game.
 */
class Mia {
  private readonly local = new LocalModelEngine()
  private readonly scripted = new ScriptedEngine()

  get engineName(): string {
    return this.local.available ? 'LOCAL-MODEL + SCRIPTED FALLBACK' : 'SCRIPTED // DETERMINISTIC'
  }

  get available(): boolean {
    return true
  }

  async ask(input: string, ctx: MiaContext): Promise<{ lines: string[]; engine: string }> {
    if (this.local.available) {
      const lines = await this.local.complete(input, ctx)
      if (lines?.length) return { lines, engine: this.local.name }
    }
    const fallback = await this.scripted.complete(input, ctx)
    return { lines: fallback ?? ['…'], engine: this.scripted.name }
  }

  /* ---------------------------------------------------------------- boot -- */

  bootLines(): string[] {
    return [
      `> mia.core :: booting`,
      `> identity ..... ${MIA.name}`,
      `> expansion .... ${MIA.expansion}`,
      `> bound to ..... ${SUBJECT_ID}`,
      `> engine ....... ${this.engineName}`,
      `> network ...... none required`,
      `> status ....... ONLINE`,
    ]
  }

  greeting(): string[] {
    return [...MIA.greeting]
  }

  /** Line shown on the M.I.A. card in the hub. */
  intro(): string[] {
    return [
      `${MIA.name} — ${MIA.expansion}.`,
      `She wakes up after MEMORY 02, and she is guarding MEMORY 03.`,
      `She will not hand you anything you have not earned, but she will talk.`,
    ]
  }

  lockedLines(): string[] {
    return [
      `${MIA.name}: OFFLINE`,
      `AI CORE IS LOCKED.`,
      `Recover MEMORY 02 and she wakes up.`,
    ]
  }

  /* --------------------------------------------------------- progression -- */

  /** Fired the instant a memory is recovered (brief §14). */
  progressionFor(id: ChallengeId): string[] {
    return MIA_PROGRESSION[id] ?? []
  }

  /** Extra reaction, where one is defined. */
  reactionFor(id: ChallengeId): string[] {
    return MIA_SOLVE_REACTION[id] ?? []
  }

  /** The MEMORY 03 clue, on demand. */
  mem03Clue(): string[] {
    return MEM03_CLUE.lines
  }

  ambient(turn: number): string[] {
    return [MIA_AMBIENT[turn % MIA_AMBIENT.length]]
  }

  /* -------------------------------------------------------------- finale -- */

  finalLines(): string[] {
    return [...MIA_FINAL_MESSAGE]
  }

  farewell(): string[] {
    return [
      `> handing control back to her.`,
      `> ${NICKNAME}, ${RECIPIENT_NAME}: it was a good run.`,
      `> mia.core :: standing down`,
    ]
  }
}

export const mia = new Mia()
