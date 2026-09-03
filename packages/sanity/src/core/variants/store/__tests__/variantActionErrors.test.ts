import {describe, expect, it} from 'vitest'

import {getReferencingDocumentCount, isInsufficientPermissionsError} from '../variantActionErrors'

/** Shape `@sanity/client` gives a mutation error: `details` is the response body's `error`. */
function clientError(details: unknown) {
  return Object.assign(new Error('request failed'), {details})
}

describe('isInsufficientPermissionsError', () => {
  it('detects the error type at the top level of the details', () => {
    expect(
      isInsufficientPermissionsError(
        clientError({
          type: 'insufficientPermissionsError',
          description: 'Insufficient permissions',
        }),
      ),
    ).toBe(true)
  })

  it('detects the error type nested in mutation error items', () => {
    expect(
      isInsufficientPermissionsError(
        clientError({
          type: 'mutationError',
          description: 'transaction failed: Insufficient permissions; permission "delete" required',
          items: [{index: 0, error: {type: 'insufficientPermissionsError', permission: 'delete'}}],
        }),
      ),
    ).toBe(true)
  })

  it('is false for other errors', () => {
    expect(isInsufficientPermissionsError(new Error('network down'))).toBe(false)
    expect(
      isInsufficientPermissionsError(
        clientError({type: 'mutationError', description: 'nope', items: [{index: 0}]}),
      ),
    ).toBe(false)
    expect(isInsufficientPermissionsError(undefined)).toBe(false)
  })
})

describe('getReferencingDocumentCount', () => {
  it('counts the documents still referencing the definition, one per document group', () => {
    // The server lists every referencing version (one per bundle, possibly repeated); the Studio
    // counts document groups, so the two versions of `article-1` count once.
    const error = clientError({
      type: 'mutationError',
      description: 'Mutation failed: Document "_.variants.a" cannot be deleted …',
      items: [
        {
          index: 0,
          error: {
            type: 'documentHasExistingReferencesError',
            id: '_.variants.a',
            referencingIDs: [
              'versions.scopeA.article-1',
              'versions.scopeA.article-1',
              'versions.scopeB.article-1',
              'versions.scopeA.article-2',
            ],
          },
        },
      ],
    })

    expect(getReferencingDocumentCount(error)).toBe(2)
  })

  it('is undefined when the server did not list the referencing documents', () => {
    expect(
      getReferencingDocumentCount(
        clientError({
          type: 'mutationError',
          description: 'nope',
          items: [{index: 0, error: {type: 'documentHasExistingReferencesError'}}],
        }),
      ),
    ).toBeUndefined()
    expect(
      getReferencingDocumentCount(
        clientError({
          type: 'mutationError',
          description: 'nope',
          items: [
            {index: 0, error: {type: 'documentHasExistingReferencesError', referencingIDs: []}},
          ],
        }),
      ),
    ).toBeUndefined()
  })

  it('is undefined for other errors', () => {
    expect(getReferencingDocumentCount(new Error('network down'))).toBeUndefined()
    expect(
      getReferencingDocumentCount(
        clientError({
          type: 'mutationError',
          description: 'nope',
          items: [{index: 0, error: {type: 'insufficientPermissionsError'}}],
        }),
      ),
    ).toBeUndefined()
  })
})
