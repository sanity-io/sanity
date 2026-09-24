import {addCommentSteps} from './features/comments'
import {defineScenario} from './types'

const DOCUMENT_ID = 'bench-comments-field'

/**
 * The comments plugin's cost on a field, measured two ways.
 *
 * Interaction mode (the gated, A/B-compared one) types into a plain string
 * field with the `studioComments` flag active, so the field takes the
 * plugin's real path. Its series is the commit-to-commit A/B, as for every
 * other interaction scenario. `singleString` is not a comments-off control:
 * comments is an unconditional default plugin and
 * `document.comments.enabled` defaults to true, so it wraps every field
 * there too, in upsell mode, with `CommentsUpsellProvider` around the layout
 * on top. A comments-off control would need a workspace that disables it in
 * config.
 *
 * INP mode runs the `steps` choreography below. Read its headline with care:
 * `computeInp` reports the `floor(driven / 50)`-th worst interaction, and at
 * this scenario's 67 driven that is the second worst — so whichever of the
 * composer and send clicks is more expensive is discarded. Useful for a
 * local before/after on a known change, not as a regression series.
 *
 * Deliberately measures whichever implementation the studio resolves, so the
 * scenario tracks what ships instead of pinning `beta.comments.v2`. Today that
 * is `core/comments`, on the addon-dataset transport. When `core/comments-v2`
 * becomes the default it serves comments from the Comments API, which the bench
 * mock does not implement; the session then fails by name with the migration
 * hint instead of quietly measuring a dead backend.
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
