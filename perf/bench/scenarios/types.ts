import {type Page} from 'playwright'

import {type DocumentStore} from '../mock-api/store'
import {type BenchDocument} from '../mock-api/types'
import {type RunningSide} from '../runner/servers'
import {type ReadOnlyInterruptions} from '../runner/session/interaction'

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
   * Source file, repo-root-relative (e.g. `perf/bench/scenarios/article.ts`)
   * — recorded in the report so the dashboard can link to the definition.
   * Can't be derived from `name`: syntheticLarge lives in synthetic.ts.
   */
  sourceFile: string
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
  /** Opt-in mock feature modules to activate for this scenario, e.g. ['comments']. */
  features?: string[]
  /** Richer component-interaction sequence (INP mode). Absent ⇒ derived from interactions. */
  steps?: ScenarioStep[]
  /**
   * Per-scenario keystroke counts, overriding the session defaults. For
   * scenarios with pathologically slow keystrokes (synthetic: ~10× the
   * others), the default counts make each session cost minutes without
   * adding statistical power — the median needs samples, not marathons.
   * Applied identically to both A/B sides (the scenario file comes from
   * HEAD on both).
   */
  keystrokes?: {warmup?: number; measured?: number; burst?: number}
}

/** Where a step acts. Field selectors reuse the existing focusField/fieldInput logic. */
export type StepSelector =
  | {field: string; kind: 'string' | 'pte'}
  | {testId: string; within?: string}
  | {label: string; within?: string}
  | {css: string}

export interface StepContext {
  page: Page
  running: RunningSide
  timeoutMs: number
  interruptions: ReadOnlyInterruptions
}

export type ScenarioStep =
  | {
      kind: 'type'
      label?: string
      selector: StepSelector
      text?: string
      keystrokes?: number
      oracle?: (store: DocumentStore) => boolean
    }
  | {
      kind: 'click'
      label?: string
      selector: StepSelector
      oracle?: (store: DocumentStore) => boolean
    }
  | {kind: 'awaitVisible'; selector: StepSelector}
  | {kind: 'hover'; selector: StepSelector}
  | {
      kind: 'raw'
      label: string
      drive: (context: StepContext) => Promise<{interactions: number}>
      oracle?: (store: DocumentStore) => boolean
    }

export function defineScenario(scenario: BenchScenario): BenchScenario {
  return scenario
}
