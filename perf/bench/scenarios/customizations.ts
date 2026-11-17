import {type BenchDocument} from '../mock-api/types'
import {buildPreviewTargets, PREVIEW_TARGET_IDS} from './fixtures/customizationsFixture'
import {createFixtureRng, keyGenerator, wordPicker} from './fixtures/prng'
import {defineScenario} from './types'

/**
 * Customization scenarios — one workspace each, named after the scenario
 * (studio/schemas/customizations.tsx). Every scenario exercises public `sanity`
 * customization API in natural customer call shapes; the two marked
 * `expectedToSettle: false` are RED BY DESIGN, exercising known unfixed
 * render-loop footguns (see the component docblocks) — their non-settling
 * settle sessions are living evidence, and the report warns the moment a
 * hardening lands so the flag gets flipped.
 *
 * All of these require the customization build:
 * `pnpm --filter bench build:customizations` → `perf/bench/dist-customizations`
 * (the pristine dist stays byte-identical for every other mode).
 */

const PREVIEW_HEAVY_ID = 'bench-preview-heavy'
const CUSTOM_INPUTS_ID = 'bench-custom-inputs'
const DOCUMENT_ACTIONS_ID = 'bench-document-actions'

function buildPreviewHeavy(): BenchDocument[] {
  const rng = createFixtureRng(19860113)
  const nextKey = keyGenerator(rng)
  return [
    {
      _id: `drafts.${PREVIEW_HEAVY_ID}`,
      _type: 'previewHeavy',
      title: 'Preview heavy',
      // 24 references cycling the 20 targets — enough rows that a
      // re-regressed preview loop dominates the pane immediately.
      refs: Array.from({length: 24}, (_, index) => ({
        _key: nextKey(),
        _type: 'reference',
        _ref: PREVIEW_TARGET_IDS[index % PREVIEW_TARGET_IDS.length],
      })),
    },
    ...buildPreviewTargets(),
  ]
}

export const previewHeavy = defineScenario({
  name: 'previewHeavy',
  sourceFile: 'perf/bench/scenarios/customizations.ts',
  requiresCustomizations: true,
  documentType: 'previewHeavy',
  documentId: PREVIEW_HEAVY_ID,
  fixture: buildPreviewHeavy,
  // Settle-primary; the title target keeps interaction mode runnable locally.
  interactions: [{fieldPath: 'title', kind: 'string'}],
})

function buildCustomInputs(): BenchDocument[] {
  const rng = createFixtureRng(19911117)
  const word = wordPicker(rng)
  return [
    {
      _id: `drafts.${CUSTOM_INPUTS_ID}`,
      _type: 'customInputs',
      title: `${word()} ${word()}`,
      summary: '',
      status: '',
    },
  ]
}

export const customInputs = defineScenario({
  name: 'customInputs',
  sourceFile: 'perf/bench/scenarios/customizations.ts',
  requiresCustomizations: true,
  documentType: 'customInputs',
  documentId: CUSTOM_INPUTS_ID,
  fixture: buildCustomInputs,
  interactions: [
    {fieldPath: 'title', kind: 'string'},
    // Types THROUGH a custom input (TitleEchoInput wraps renderDefault).
    {fieldPath: 'summary', kind: 'string'},
  ],
})

export const documentActions = defineScenario({
  name: 'documentActions',
  sourceFile: 'perf/bench/scenarios/customizations.ts',
  requiresCustomizations: true,
  documentType: 'documentActions',
  documentId: DOCUMENT_ACTIONS_ID,
  fixture: () => [
    {_id: `drafts.${DOCUMENT_ACTIONS_ID}`, _type: 'documentActions', title: 'Document actions'},
  ],
  // Red by design: BenchTemplateBadge passes an inline templateItems array to
  // useTemplatePermissions, whose factory memo keys on the array reference
  // (createHookFromObservableFactory — unhardened). Flip when it is fixed.
  expectedToSettle: false,
  // No typing targets: a red scenario would time out any interaction run.
  interactions: [],
})

export const debugLoop = defineScenario({
  name: 'debugLoop',
  sourceFile: 'perf/bench/scenarios/customizations.ts',
  requiresCustomizations: true,
  documentType: 'debugLoop',
  documentId: 'bench-debug-loop',
  fixture: () => [{_id: 'drafts.bench-debug-loop', _type: 'debugLoop', title: 'Debug loop'}],
  // Deliberate, self-terminating render burst (quiet 2s → loop 6s → quiet):
  // a debug/chart fixture with a known shape, and the loop-detection
  // self-test — it must settle at ≈8s, never instantly, with its commit
  // count and its `debugLoop.burst` render-mark count agreeing (~1,400
  // each). In the daily track-main settle list for that reason: a commit
  // counter that went dark shows here as the two diverging (commits at
  // zero, marks still counting) — see 'sessions without commit counter'.
  interactions: [],
})

export const structurePane = defineScenario({
  name: 'structurePane',
  sourceFile: 'perf/bench/scenarios/customizations.ts',
  requiresCustomizations: true,
  documentType: 'previewTarget',
  documentId: PREVIEW_TARGET_IDS[0],
  fixture: buildPreviewTargets,
  path: 'structure/bench-pane',
  readySelector: '[data-testid="bench-custom-pane"]',
  interactions: [],
})

export const listenQueryPane = defineScenario({
  name: 'listenQueryPane',
  sourceFile: 'perf/bench/scenarios/customizations.ts',
  requiresCustomizations: true,
  documentType: 'previewTarget',
  documentId: PREVIEW_TARGET_IDS[0],
  fixture: buildPreviewTargets,
  path: 'structure/listen-query-pane',
  readySelector: '[data-testid="bench-listen-query-pane"]',
  // Red by design: the pane builds documentStore.listenQuery inline per
  // render into useLoadable (which keys on the observable reference). Flip
  // when that class is hardened.
  expectedToSettle: false,
  interactions: [],
})
