import {type BenchDocument} from '../mock-api/types'
import {defineScenario} from './types'

const DOCUMENT_ID = 'bench-array-i18n'

// Ported from dev/efps/tests/arrayI18n/arrayI18n.ts
export const arrayI18n = defineScenario({
  name: 'arrayI18n',
  documentType: 'arrayI18n',
  documentId: DOCUMENT_ID,
  fixture: () => [
    {
      _id: `drafts.${DOCUMENT_ID}`,
      _type: 'arrayI18n',
      simple: [
        {
          _type: 'internationalizedArrayStringValue',
          _key: 'en',
          value: 'hello world',
        },
      ],
    },
  ],
  interactions: [
    {
      fieldPath: 'simple',
      kind: 'string',
      label: 'simple-en',
      readbackText: (doc: BenchDocument) =>
        ((doc.simple as {value?: string}[] | undefined) ?? [])
          .map((entry) => entry.value ?? '')
          .join(' '),
    },
  ],
})
