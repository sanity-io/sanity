import {describe, expect, it} from 'vitest'

import {withReleaseReferences} from '../withReleaseReferences'

// `false` marks a release version that unpublishes its document.
const documents = new Map([
  ['drafts.draft-author', true],
  ['published-author', true],
  ['removed-author', true],
  ['versions.release-a.release-author', true],
  ['versions.release-a.removed-author', false],
  ['versions.release-b.other-release-author', true],
])

describe('withReleaseReferences', () => {
  it.each([
    ['post', 'published-author', true],
    ['drafts.post', 'published-author', true],
    ['versions.release-a.post', 'published-author', true],
    ['versions.release-a.post', 'release-author', true],
    ['versions.release-a.post', 'other-release-author', false],
    ['versions.release-a.post', 'draft-author', false],
    ['versions.release-a.post', 'missing-author', false],
    ['versions.release-a.post', 'removed-author', false],
    ['versions.release-b.post', 'removed-author', true],
    ['post', 'release-author', false],
    ['drafts.post', 'release-author', false],
    ['post', 'draft-author', false],
    ['post', 'missing-author', false],
  ])('%s referencing %s exists: %s', async (documentId, id, expected) => {
    const getDocumentExists = withReleaseReferences({
      documentId,
      getDocumentExists: async (options) => documents.has(options.id),
      isUnpublished: async (options) => documents.get(options.id) === false,
    })
    await expect(getDocumentExists({id})).resolves.toBe(expected)
  })
})
