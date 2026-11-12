// MOCKED SERVER SIDE. Everything in this file stands in for something the platform does not serve yet. Each export is one seam:
// swap its body for the real call and the lenses keep working. The FRONTEND logic is real and lives elsewhere: the ADR-3 ranking in
// c1/rank.ts, and the lenses in c5/. Where a mocked value reaches the screen the UI says so (MOCK_NOTE).
//
//   declaredValues      the server's dimension document, with the values a dimension declares (an unused value has no definition yet)
//   eligibleTypes       per-type eligibility: which document types can have a version of a definition at all (SAPP-4171)
//
// Not mocked here: resolution. The Visitor lens resolves in the browser by the rank function, as the design says it should.

/** Shown wherever a mocked value is on screen, so a reviewer cannot mistake it for real data. */
export const MOCK_NOTE = 'Mocked server data'

/** The dimension document: a dimension's declared values, as `[value, title]`. */
export const declaredValues: Record<string, readonly (readonly [string, string])[]> = {
  audience: [
    ['students', 'Students'],
    ['partners', 'Partners'],
  ],
  locale: [
    ['fr-FR', 'French (France)'],
    ['ja-JP', 'Japanese'],
  ],
  plan: [['enterprise-trial', 'Enterprise trial']],
}

export interface Eligibility {
  eligible: boolean
  /** Why a type is not eligible, in a user's words. */
  reason?: string
}

/**
 * Per-type eligibility: whether a document of `type` can have a version of a definition. The real rule is a server-side type
 * setting. Mock: a live-edit type (`bookLive`) has no versions, every other type is eligible.
 */
export function eligibleTypes(types: readonly string[]): Record<string, Eligibility> {
  const result: Record<string, Eligibility> = {}
  for (const type of types) {
    result[type] =
      type === 'bookLive'
        ? {eligible: false, reason: 'Live edit documents have no versions.'}
        : {eligible: true}
  }
  return result
}
