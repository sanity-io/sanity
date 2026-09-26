/**
 * Feature modules — the mock's answer to studio features gated on a
 * `/features` flag. A scenario measuring one opts in via
 * `features: ['<name>']`, and every session mode activates it through
 * runner/session/seed.ts.
 *
 * Without its flag the feature degrades rather than disappears, and the
 * degradation is slow to diagnose: the comments field button renders and
 * clicks identically, but the click takes the upsell branch and never opens
 * the composer, so the session dies on a visibility timeout a step or two
 * later, far from the cause. Centralising activation is what keeps a new
 * session mode from reintroducing that.
 */
const FEATURE_MODULES = {
  comments: ['studioComments'],
} as const

export type FeatureModuleName = keyof typeof FEATURE_MODULES

/** Names are typed at the scenario, so the throw only guards dynamic callers. */
export function resolveFeatureFlags(names: readonly string[]): string[] {
  const flags = names.flatMap((name) => {
    if (!Object.hasOwn(FEATURE_MODULES, name)) {
      const available = Object.keys(FEATURE_MODULES).join(', ')
      throw new Error(`Unknown feature module "${name}". Available: ${available}`)
    }
    return FEATURE_MODULES[name as FeatureModuleName]
  })
  return [...new Set(flags)]
}
