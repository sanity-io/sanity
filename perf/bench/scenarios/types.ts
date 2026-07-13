import {type BenchDocument} from '../mock-api/types'

/** A field the interaction mode types into. */
export interface InteractionTarget {
  /** Label used in reports (defaults to fieldPath). */
  label?: string
  /** The `data-testid="field-<path>"` path of the field. */
  fieldPath: string
  /** Input flavour — determines the focus/selector strategy. */
  kind: 'string' | 'pte'
  /**
   * Extract the text the typed characters should have landed in from the
   * mock's copy of the document (readback validation). Defaults to reading
   * `fieldPath` (dot-separated) as a string. Needed when the value isn't a
   * plain string at that path — e.g. i18n arrays, arrays of strings, PTE.
   */
  readbackText?: (doc: BenchDocument) => string
}

export interface BenchScenario {
  /** Scenario id (unique across the suite). */
  name: string
  /**
   * Studio workspace basePath segment to open. Defaults to `name` — set it
   * when several scenarios share one workspace (e.g. syntheticLarge).
   */
  workspace?: string
  documentType: string
  /** Published id of the document under test (draft is `drafts.<id>`). */
  documentId: string
  /**
   * Documents seeded into the mock before every session. Must be
   * deterministic — no randomness without a fixed seed, no shared mutable
   * state (see scenarios/fixtures/prng.ts).
   */
  fixture: () => BenchDocument[]
  /** Fields measured by interaction mode, in fixed execution order. */
  interactions: InteractionTarget[]
}

export function defineScenario(scenario: BenchScenario): BenchScenario {
  return scenario
}
