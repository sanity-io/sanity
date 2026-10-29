const VALUE_OPCODE = 0

export interface MendozaEffects {
  apply: unknown[]
  revert: unknown[]
}

// Mendoza opcode 0 outputs the literal that follows it, so `[0, after]` decodes to `after` whatever the input.
export function wholeValueEffects(before: unknown, after: unknown): MendozaEffects {
  return {
    apply: [VALUE_OPCODE, after ?? null],
    revert: [VALUE_OPCODE, before ?? null],
  }
}
