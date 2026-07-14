/**
 * Minimal mendoza effect encoder.
 *
 * Real Content Lake computes compact structural diffs; the mock only needs
 * effects that *decode correctly*, not compact ones. Mendoza opcode 0
 * ("Value") outputs the literal that follows it in the patch stream, so a
 * whole-value replacement is simply `[0, <value>]` — `applyPatch(before,
 * [0, after])` returns `after` regardless of `before`. Verified against the
 * `mendoza` package in __tests__/mendoza.test.ts.
 */

const VALUE_OPCODE = 0

export interface MendozaEffects {
  apply: unknown[]
  revert: unknown[]
}

export function wholeValueEffects(before: unknown, after: unknown): MendozaEffects {
  return {
    apply: [VALUE_OPCODE, after ?? null],
    revert: [VALUE_OPCODE, before ?? null],
  }
}
