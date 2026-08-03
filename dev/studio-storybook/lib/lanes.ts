/**
 * The four-lane provenance system — one place both surfaces read from:
 *   - the story-canvas / docs decorator (lib/variantFrame.tsx), and
 *   - the sidebar glyphs (.storybook/manager.ts `sidebar.renderLabel`).
 *
 * A story is assigned ONE lane, derived from signals that already exist in the corpus
 * (export name + the meta `source:` / `variant:` tags) — no retagging required. The only
 * new tag is the reserved opt-in for the Envisioned lane, which has no naming convention.
 *
 * Lanes (design contract §3):
 *   1. UI v3     — the raw @sanity/ui primitive (the `Primitive` story on a shadow page,
 *                  or an explicit `source:sanity-ui`). Canon; a quiet chip.
 *   2. Studio    — Studio-shipped component (`source:studio-shadow|studio-only|plugin`).
 *                  Canon; a quiet chip.
 *   3. Proposed  — our audit-anchored fix (a `Recommended` variant). A loud frame.
 *   4. Envisioned— a future-direction story (opt-in `variant:envisioned`/`lane:envisioned`).
 *                  A loud frame.
 *   5. Stubbed   — a SHIPPED Studio component whose data source cannot be reached from a
 *                  story, rendered against a fabricated source (opt-in `variant:stubbed`/
 *                  `lane:stubbed`). A loud frame.
 * Plus the audit overlay that pairs with Proposed:
 *   · Current    — an as-shipped Studio defect repro (a `Current` variant). A loud frame.
 *                  Provenance is Studio; the frame is the audit finding on it.
 *
 * ## Why Stubbed is its own lane and not just "a Studio story with a fixture"
 *
 * Every story here already runs on fabricated data: `WithStudioProviders` invents a workspace,
 * `mockContentLake` invents GROQ results. So the fabrication is not what distinguishes this
 * lane. What distinguishes it is that the fabrication reaches a component the studio would
 * otherwise only mount behind a gate a story cannot pass: an addon dataset, a live auth state,
 * a comlink channel to a running front end.
 *
 * That matters for exactly one reason. A Studio story is evidence about behaviour. A Stubbed
 * story is evidence about EXISTENCE — this screen is in the product, here is what it looks
 * like — and must never be read as the first. Hence the frame, and hence the mandatory
 * `Cannot show:` line in the disclosure block.
 *
 * The lane is deliberately not a separate storybook or a holding-pen chapter: a stubbed
 * comments inspector belongs under Collaboration where someone would look for it. The lane
 * supplies the marker; the chapter supplies the place.
 *
 * This module is pure (no React) so the manager bundle can import it too.
 */

export type Lane = 'uiv3' | 'studio' | 'proposed' | 'envisioned' | 'current' | 'stubbed'

/** The subset that renders a loud frame in the canvas (vs. a quiet chip). */
export type FramedLane = 'proposed' | 'envisioned' | 'current' | 'stubbed'

export interface LaneInput {
  /** Storybook story id, e.g. `actions-commands-button--primitive`. */
  id?: string
  /** Merged meta + story tags (present on both StoryContext and index/sidebar items). */
  tags?: readonly string[]
  /** Export name when available (sidebar items carry it); falls back to the id segment. */
  exportName?: string
}

/**
 * The audit-pair variant from the naming convention, with a tag override.
 *
 * Keyed on the EXPORT NAME (the `--`-suffix of `id`, or `exportName`), never the display
 * name: export names carry the marker as a whole `current` / `recommended` / `envisioned`
 * segment, whereas display names are decorated freely ("similarity — Current (…)").
 * Tags win over the convention (`variant:recommended|current|envisioned|none`,
 * `lane:envisioned`).
 */
export function resolveVariant(
  input: LaneInput,
): 'recommended' | 'current' | 'envisioned' | 'stubbed' | null {
  const tags = input.tags ?? []
  if (tags.includes('variant:none')) return null
  if (tags.includes('variant:envisioned') || tags.includes('lane:envisioned')) return 'envisioned'
  // Stubbed is TAG-ONLY, with no export-name convention. `Stubbed` is a plausible thing to
  // call a story that merely uses a fixture, which is most of the catalog, and inferring the
  // lane from that word would mark half the corpus as unreachable-without-a-stub. The lane
  // carries a disclosure obligation, so entering it has to be a decision, not a spelling.
  if (tags.includes('variant:stubbed') || tags.includes('lane:stubbed')) return 'stubbed'
  if (tags.includes('variant:recommended')) return 'recommended'
  if (tags.includes('variant:current')) return 'current'

  const seg = exportSegment(input)
  if (seg.includes('envisioned')) return 'envisioned'
  if (seg.includes('recommended')) return 'recommended'
  if (seg.includes('current')) return 'current'
  return null
}

/** Provenance (canon) lane from source tags + the Primitive-on-shadow convention. */
function resolveSourceLane(input: LaneInput): 'uiv3' | 'studio' | null {
  const tags = input.tags ?? []
  if (tags.includes('source:sanity-ui')) return 'uiv3'

  // The `Primitive` story on a Studio-shadow page renders the raw @sanity/ui primitive.
  const isPrimitive =
    (input.exportName ?? '').toLowerCase() === 'primitive' || lastSeg(input) === 'primitive'
  if (isPrimitive && tags.includes('source:studio-shadow')) return 'uiv3'

  if (
    tags.includes('source:studio-shadow') ||
    tags.includes('source:studio-only') ||
    tags.includes('source:plugin')
  ) {
    return 'studio'
  }
  return null
}

/**
 * The single lane for a story. Priority: the audit-pair variants (Envisioned / Proposed /
 * Current) win over canon provenance, because a Recommended fix or a defect repro is the
 * thing the viewer must not mistake for shipped canon.
 */
export function resolveLane(input: LaneInput): Lane | null {
  const variant = resolveVariant(input)
  if (variant === 'envisioned') return 'envisioned'
  // Stubbed wins over the Studio source tag, and a stubbed story SHOULD carry both: the
  // component is genuinely Studio-shipped, which is the whole point, but a viewer who reads
  // it as ordinary Studio canon draws a behavioural conclusion the story cannot support.
  if (variant === 'stubbed') return 'stubbed'
  if (variant === 'recommended') return 'proposed'
  if (variant === 'current') return 'current'
  return resolveSourceLane(input)
}

function exportSegment(input: LaneInput): string[] {
  return lastSeg(input).split('-')
}

function lastSeg(input: LaneInput): string {
  if (input.exportName) return kebab(input.exportName)
  return (
    String(input.id ?? '')
      .split('--')
      .pop() ?? ''
  )
}

function kebab(name: string): string {
  return name
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
    .toLowerCase()
}
