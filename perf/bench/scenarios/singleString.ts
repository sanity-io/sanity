import {defineScenario} from './types'

const DOCUMENT_ID = 'bench-single-string'

export const singleString = defineScenario({
  name: 'singleString',
  documentType: 'singleString',
  documentId: DOCUMENT_ID,
  fixture: () => [
    {
      _id: `drafts.${DOCUMENT_ID}`,
      _type: 'singleString',
      stringField: '',
    },
  ],
  interactions: [{fieldPath: 'stringField', kind: 'string'}],
})
