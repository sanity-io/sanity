import {addCommentSteps} from './features/comments'
import {defineScenario} from './types'

const DOCUMENT_ID = 'bench-comments-field'

export const commentsField = defineScenario({
  name: 'commentsField',
  sourceFile: 'perf/bench/scenarios/commentsField.ts',
  documentType: 'commentsField',
  documentId: DOCUMENT_ID,
  features: ['comments'],
  fixture: () => [
    {_id: `drafts.${DOCUMENT_ID}`, _type: 'commentsField', stringField: ''},
    {_id: DOCUMENT_ID, _type: 'commentsField', stringField: ''},
  ],
  interactions: [{fieldPath: 'stringField', kind: 'string'}],
  steps: addCommentSteps('stringField'),
})
