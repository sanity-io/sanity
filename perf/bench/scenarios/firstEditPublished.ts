import {defineScenario} from './types'

const DOCUMENT_ID = 'bench-first-edit-published'

/**
 * First edit of a published document that has no draft yet (issue #13511):
 * the first keystroke creates the draft as a separate transaction, which
 * changes the version-id set and echoes back through the pair listener
 * mid-typing. Regressions on this path historically flipped the form
 * read-only while the user was typing (see the read-only interruption
 * metric), silently swallowing keystrokes — a state the draft-seeded
 * scenarios can never reach.
 */
export const firstEditPublished = defineScenario({
  name: 'firstEditPublished',
  sourceFile: 'perf/bench/scenarios/firstEditPublished.ts',
  workspace: 'singleString',
  documentType: 'singleString',
  documentId: DOCUMENT_ID,
  fixture: () => [
    {
      _id: DOCUMENT_ID,
      _type: 'singleString',
      stringField: 'Published text that gets its first edit during the session. ',
    },
  ],
  interactions: [{fieldPath: 'stringField', kind: 'string'}],
})
