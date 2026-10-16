import {type Page} from 'playwright'

import {type FeatureModuleName} from '../mock-api/features'
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
  /**
   * Workspace-relative route to open instead of the edit intent for the
   * document under test — e.g. a custom structure pane (`structure/<itemId>`).
   * The document fixture is still seeded; `documentId`/`documentType` keep
   * identifying it.
   */
  path?: string
  /**
   * Readiness selector to wait for after navigation. Defaults to the editable
   * document form (`DEFAULT_READY_SELECTOR` in runner/session/navigation.ts);
   * set it for routes that don't render a document form, e.g. custom panes.
   */
  readySelector?: string
  /**
   * Settle-mode expectation (default true). `false` marks a scenario that is
   * red BY DESIGN — it exercises a known, unfixed render-loop footgun, and
   * its `settled: false` sessions are evidence, not failures: they don't
   * exit non-zero and don't page the cron alert. The report warns on any
   * expectation mismatch in either direction, so when the hook hardening
   * lands the same PR must flip this flag.
   */
  expectedToSettle?: boolean
  /**
   * The scenario's workspace only exists in the customization build
   * (`pnpm --filter bench build:customizations` → dist-customizations, which
   * writes `bench-build-flags.json`). The runner skips the scenario with a
   * pointer to that command when the target dist lacks the flag — the
   * pristine dist every other mode measures never includes these workspaces.
   */
  requiresCustomizations?: boolean
  /**
   * Type of the document under test. Required by every mode that opens or
   * types into a document; load scenarios that never open one leave it out
   * (see `scenarioDocument`).
   */
  documentType?: string
  /** Published id of the document under test (draft is `drafts.<id>`). */
  documentId?: string
  /**
   * Documents seeded into the mock before every session (none when absent).
   * Must be deterministic — no randomness without a fixed seed, no shared
   * mutable state (see scenarios/fixtures/prng.ts).
   */
  fixture?: () => BenchDocument[]
  /** Fields measured by interaction mode, in fixed execution order. */
  interactions: InteractionTarget[]
  /**
   * Mock feature modules to activate for this scenario's sessions
   * (mock-api/features). A studio feature gated on a `/features` flag takes
   * its upsell path until its module is active, so a scenario measuring one
   * must opt in here.
   */
  features?: FeatureModuleName[]
  /**
   * Component-interaction choreography for INP mode (runner/session/steps.ts),
   * run to completion each pass. Absent ⇒ one `type` step per interaction
   * target. Interaction mode ignores steps: it measures keystrokes only.
   */
  steps?: ScenarioStep[]
  /**
   * Load choreography for pageload mode (runner/session/pageLoad.ts), run
   * once per load from navigation start. Steps carrying a `milestone` record
   * the time it was reached as a `<condition> · <milestone>` row. Absent ⇒
   * wait for `readySelector`, then `awaitEditable` on `interactions[0]` —
   * the `time to editable` headline.
   */
  load?: {
    steps: ScenarioStep[]
    /**
     * `logged-out` boots without a stored token against a mock that signs in
     * only token-carrying requests, so the studio shows its login screen; a
     * login click lands on the route guard's fake provider, which redirects
     * back with a session id the mock exchanges for the token. Default
     * `authenticated`.
     */
    auth?: 'authenticated' | 'logged-out'
    /**
     * Which load conditions to sample (default both). Drop `open-doc-warm`
     * when the cold load changes state the warm page would inherit, e.g. a
     * login that stores a token in the shared context.
     */
    conditions?: ('boot-cold' | 'open-doc-warm')[]
  }
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

/**
 * Where a step acts. `field` reuses interaction mode's focus/input logic for
 * a `data-testid="field-<path>"` field; `testId` and `label` (accessible
 * name, exact) optionally scope under a `within` test id; `css` is the escape
 * hatch.
 */
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
  /** Appended to step failure messages in parens, e.g. a load condition. */
  label?: string
  /** Console/page/http errors gathered so far, attached to step failures. */
  diagnostics?: () => string[]
}

/**
 * Readback for a step: checked against the mock's document store after the
 * session has driven all its passes, the step's effect must have landed
 * (like interaction mode's typed-text readback).
 */
export type StepReadback = (store: DocumentStore) => boolean

export type ScenarioStep =
  | {
      kind: 'type'
      label?: string
      selector: StepSelector
      /** Literal text to type; otherwise `keystrokes` characters from the bench alphabet. */
      text?: string
      keystrokes?: number
      readback?: StepReadback
    }
  | {
      kind: 'click'
      label?: string
      selector: StepSelector
      readback?: StepReadback
      /** Pageload: record reaching this step, once the target is actionable and before the click. */
      milestone?: string
    }
  | {
      kind: 'awaitVisible'
      selector: StepSelector
      /** Pageload: record reaching this step, once the target is visible. */
      milestone?: string
    }
  | {
      /**
       * Wait until the target is clickable (visible, stable, enabled,
       * receiving events) without clicking it — Playwright's trial click.
       */
      kind: 'awaitClickable'
      selector: StepSelector
      /** Pageload: record reaching this step. */
      milestone?: string
    }
  | {
      /**
       * Wait until every visible `data-testid="field-<path>"` element in the
       * document form holds an enabled, non-read-only control (input,
       * textarea, select, button or contenteditable) outside its header
       * chrome (field actions, comments, presence); a collapsed object's
       * expand toggle counts. Evaluated in-page each
       * animation frame and recorded from there, so the milestone carries
       * no Playwright round trip. Catches field components that load lazily
       * after the first field is editable.
       */
      kind: 'awaitAllFieldsEditable'
      milestone: string
      /** Don't pass before at least this many fields have rendered. */
      minFields?: number
    }
  | {
      /**
       * The editable probe: click the field's text input, press one key and
       * wait for the `input` event, which records `bench:time-to-editable`
       * (navigation start → the keystroke landed). Pageload's headline.
       */
      kind: 'awaitEditable'
      /** `data-testid="field-<path>"` of a string, text or PTE field. */
      field: string
    }
  | {kind: 'hover'; selector: StepSelector}
  | {
      /**
       * Wheel-scroll over an element: hover it, then `repeat` wheel ticks of
       * `deltaY` pixels (negative scrolls up), one paint apart. Scrolls have
       * no interaction id, so they add nothing to the driven count — the work
       * they trigger (scroll listeners, overlay geometry) lands on the next
       * interaction's latency instead.
       */
      kind: 'scroll'
      label?: string
      selector: StepSelector
      deltaY: number
      repeat?: number
    }
  | {
      /**
       * Press a key `repeat` times (e.g. ArrowDown ×5 through a results list),
       * one paint apart. Optionally click `selector` first to focus it. Each
       * press is one interaction.
       */
      kind: 'press'
      label?: string
      key: string
      repeat?: number
      selector?: StepSelector
      readback?: StepReadback
    }
  | {
      kind: 'raw'
      label: string
      drive: (context: StepContext) => Promise<{interactions: number}>
      readback?: StepReadback
    }

/** The scenario's document under test; throws for a scenario without one. */
export function scenarioDocument(scenario: BenchScenario): {
  documentId: string
  documentType: string
} {
  const {documentId, documentType} = scenario
  if (documentId === undefined || documentType === undefined) {
    throw new Error(
      `Scenario "${scenario.name}" has no document under test (documentId/documentType)`,
    )
  }
  return {documentId, documentType}
}

/** The documents to seed for a scenario (its fixture, or none). */
export function scenarioFixture(scenario: BenchScenario): BenchDocument[] {
  return scenario.fixture?.() ?? []
}

export function defineScenario(scenario: BenchScenario): BenchScenario {
  return scenario
}
