import {addCommentSteps} from './features/comments'
import {defineScenario} from './types'

const DOCUMENT_ID = 'bench-comments-field'

/**
 * The comments plugin's cost on a field, measured two ways.
 *
 * Interaction mode (the gated, A/B-compared one) types into a plain string
 * field with comments active — the controlled twin of `singleString`, which
 * has it off, so the delta is the per-field overhead of a plugin that wraps
 * every field.
 *
 * INP mode runs the `steps` choreography below. Read its headline with care:
 * `computeInp` reports the `floor(driven / 50)`-th worst interaction, and at
 * this scenario's 67 driven that is the second worst — so whichever of the
 * composer and send clicks is more expensive is discarded. Useful for a
 * local before/after on a known change, not as a regression series.
 *
 * Measures the default implementation (`core/comments`); the
 * `beta.comments.v2` opt-in renders `core/comments-v2` and would need its
 * own workspace.
 */
export const commentsField = defineScenario({
  name: 'commentsField',
  sourceFile: 'perf/bench/scenarios/commentsField.ts',
  documentType: 'commentsField',
  documentId: DOCUMENT_ID,
  features: ['comments'],
  // No comment documents: the choreography targets the first-comment path.
  fixture: () => [
    {_id: `drafts.${DOCUMENT_ID}`, _type: 'commentsField', stringField: ''},
    {_id: DOCUMENT_ID, _type: 'commentsField', stringField: ''},
  ],
  interactions: [{fieldPath: 'stringField', kind: 'string'}],
  steps: addCommentSteps('stringField'),
})
