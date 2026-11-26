import {describe, expect, test} from 'vitest'

import {getCompareVersionsDocuments} from './useCompareVersionsDocuments'

const PUBLISHED_ID = 'home'
const DRAFT_ID = 'drafts.home'
const RELEASE_VERSION_ID = 'versions.rASAP.home'
const VARIANT_ID = 'versions.a1b2c3.home'

describe('getCompareVersionsDocuments', () => {
  test('compares the displayed document with the one layered beneath it', () => {
    expect(
      getCompareVersionsDocuments({
        displayedId: DRAFT_ID,
        documentIdStack: {position: 1, previousId: PUBLISHED_ID, nextId: undefined},
        groupDocumentIds: [PUBLISHED_ID, DRAFT_ID],
      }),
    ).toEqual({previousId: PUBLISHED_ID, nextId: DRAFT_ID})
  })

  test('compares the bottom layer with the layer above it', () => {
    expect(
      getCompareVersionsDocuments({
        displayedId: PUBLISHED_ID,
        documentIdStack: {position: 0, previousId: undefined, nextId: DRAFT_ID},
        groupDocumentIds: [PUBLISHED_ID, DRAFT_ID, VARIANT_ID],
      }),
    ).toEqual({previousId: PUBLISHED_ID, nextId: DRAFT_ID})
  })

  test('compares a lone published document with a variant of it', () => {
    expect(
      getCompareVersionsDocuments({
        displayedId: PUBLISHED_ID,
        documentIdStack: {position: 0, previousId: undefined, nextId: undefined},
        groupDocumentIds: [PUBLISHED_ID, VARIANT_ID],
      }),
    ).toEqual({previousId: PUBLISHED_ID, nextId: VARIANT_ID})
  })

  test('compares a version with documents left out of strict layering', () => {
    expect(
      getCompareVersionsDocuments({
        displayedId: RELEASE_VERSION_ID,
        documentIdStack: {position: 0, previousId: undefined, nextId: undefined},
        groupDocumentIds: ['versions.rOther.home', RELEASE_VERSION_ID],
      }),
    ).toEqual({previousId: RELEASE_VERSION_ID, nextId: 'versions.rOther.home'})
  })

  test('has nothing to compare when the group holds only the displayed document', () => {
    expect(
      getCompareVersionsDocuments({
        displayedId: PUBLISHED_ID,
        documentIdStack: {position: 0, previousId: undefined, nextId: undefined},
        groupDocumentIds: [PUBLISHED_ID],
      }),
    ).toBeUndefined()
  })

  test('has nothing to compare while the displayed document is being created', () => {
    expect(
      getCompareVersionsDocuments({
        displayedId: 'versions.d4e5f6.home',
        documentIdStack: {position: -1, previousId: undefined, nextId: PUBLISHED_ID},
        groupDocumentIds: [PUBLISHED_ID, VARIANT_ID],
      }),
    ).toBeUndefined()
  })

  test('has nothing to compare without a displayed document', () => {
    expect(
      getCompareVersionsDocuments({
        displayedId: undefined,
        documentIdStack: {position: -1, previousId: undefined, nextId: undefined},
        groupDocumentIds: [PUBLISHED_ID, VARIANT_ID],
      }),
    ).toBeUndefined()
  })
})
