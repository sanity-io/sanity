import {beforeEach, describe, expect, it, jest} from '@jest/globals'
import {type SanityDocument} from '@sanity/types'
import {of} from 'rxjs'

import {getVisitedDocuments} from './getVisitedDocuments'

const mockObserveDocuments = jest.fn((ids: string[]) => {
  // Return an observable that emits an array of documents corresponding to the IDs
  return of(
    ids.map(
      (id) =>
        ({
          _id: id,
          _type: 'foo',
        }) as unknown as SanityDocument,
    ),
  )
})

type Emissions = (SanityDocument | undefined)[][]

describe('getVisitedDocuments', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should start with an empty array', () => {
    const {visited$} = getVisitedDocuments({observeDocuments: mockObserveDocuments})

    const emissions: Emissions = []

    visited$.subscribe((docs) => {
      emissions.push(docs)
    })

    expect(emissions).toHaveLength(1)
    expect(emissions[0]).toEqual([])
  })

  it('should emit documents when an ID is added', () => {
    const {visited$, add} = getVisitedDocuments({observeDocuments: mockObserveDocuments})

    const emissions: Emissions = []

    visited$.subscribe((docs) => {
      emissions.push(docs)
    })

    add('doc1')

    expect(emissions).toHaveLength(2)

    const expectedDocs = [
      {_id: 'doc1', _type: 'foo'},
      {_id: 'drafts.doc1', _type: 'foo'},
    ]

    expect(emissions[1]).toEqual(expectedDocs)
  })

  it('should emit documents when multiple IDs are added', () => {
    const {visited$, add} = getVisitedDocuments({observeDocuments: mockObserveDocuments})

    const emissions: Emissions = []

    visited$.subscribe((docs) => {
      emissions.push(docs)
    })

    add('doc1')
    add('doc2')

    expect(emissions).toHaveLength(3)

    const expectedDocs = [
      {_id: 'doc1', _type: 'foo'},
      {_id: 'drafts.doc1', _type: 'foo'},
      {_id: 'doc2', _type: 'foo'},
      {_id: 'drafts.doc2', _type: 'foo'},
    ]

    expect(emissions[2]).toEqual(expectedDocs)
  })

  it('should move an existing ID to the end when re-added', () => {
    const {visited$, add} = getVisitedDocuments({observeDocuments: mockObserveDocuments})

    const emissions: Emissions = []

    visited$.subscribe((docs) => {
      emissions.push(docs)
    })

    add('doc1')
    add('doc2')
    add('doc3')
    add('doc2') // Re-add 'doc2'

    // Expected IDs after re-adding 'doc2': ['doc1', 'doc3', 'doc2']
    const expectedDocs = [
      {_id: 'doc1', _type: 'foo'},
      {_id: 'drafts.doc1', _type: 'foo'},
      {_id: 'doc3', _type: 'foo'},
      {_id: 'drafts.doc3', _type: 'foo'},
      {_id: 'doc2', _type: 'foo'},
      {_id: 'drafts.doc2', _type: 'foo'},
    ]

    expect(emissions[emissions.length - 1]).toEqual(expectedDocs)
  })

  it('should not duplicate documents when the same ID is added multiple times', () => {
    const {visited$, add} = getVisitedDocuments({observeDocuments: mockObserveDocuments})

    const emissions: Emissions = []

    visited$.subscribe((docs) => {
      emissions.push(docs)
    })

    add('doc1')
    add('doc1')
    add('doc1')

    expect(emissions).toHaveLength(4)

    const expectedDocs = [
      {_id: 'doc1', _type: 'foo'},
      {_id: 'drafts.doc1', _type: 'foo'},
    ]

    expect(emissions[emissions.length - 1]).toEqual(expectedDocs)
  })

  it('should maintain up to MAX_OBSERVED_DOCUMENTS IDs', () => {
    const {visited$, add} = getVisitedDocuments({observeDocuments: mockObserveDocuments})

    const emissions: Emissions = []
    const docIds = ['doc1', 'doc2', 'doc3', 'doc4', 'doc5', 'doc6']

    visited$.subscribe((docs) => {
      emissions.push(docs)
    })

    docIds.forEach((id) => add(id))

    expect(mockObserveDocuments).toHaveBeenLastCalledWith([
      'doc2',
      'drafts.doc2',
      'doc3',
      'drafts.doc3',
      'doc4',
      'drafts.doc4',
      'doc5',
      'drafts.doc5',
      'doc6',
      'drafts.doc6',
    ])

    // The last emission should only contain the last 5 documents (doc2 to doc6) in the correct order, removes the oldest doc (doc1)
    const expectedDocs = [
      {_id: 'doc2', _type: 'foo'},
      {_id: 'drafts.doc2', _type: 'foo'},
      {_id: 'doc3', _type: 'foo'},
      {_id: 'drafts.doc3', _type: 'foo'},
      {_id: 'doc4', _type: 'foo'},
      {_id: 'drafts.doc4', _type: 'foo'},
      {_id: 'doc5', _type: 'foo'},
      {_id: 'drafts.doc5', _type: 'foo'},
      {_id: 'doc6', _type: 'foo'},
      {_id: 'drafts.doc6', _type: 'foo'},
    ]

    expect(emissions[emissions.length - 1]).toEqual(expectedDocs)
  })

  it('should keep the observer alive even when no one is subscribed', () => {
    const {visited$, add} = getVisitedDocuments({observeDocuments: mockObserveDocuments})

    const emissionsFirstSub: Emissions = []
    const emissionsSecondSub: Emissions = []

    const subscription = visited$.subscribe((docs) => {
      emissionsFirstSub.push(docs)
    })

    add('doc1')
    add('doc2')

    expect(emissionsFirstSub).toHaveLength(3)

    const expectedDocs = [
      {_id: 'doc1', _type: 'foo'},
      {_id: 'drafts.doc1', _type: 'foo'},
      {_id: 'doc2', _type: 'foo'},
      {_id: 'drafts.doc2', _type: 'foo'},
    ]

    expect(emissionsFirstSub[emissionsFirstSub.length - 1]).toEqual(expectedDocs)

    // unsubscribe
    subscription.unsubscribe()

    visited$.subscribe((docs) => {
      emissionsSecondSub.push(docs)
    })
    // Should have the last emitted documents
    expect(emissionsSecondSub).toHaveLength(1)
    expect(emissionsSecondSub[emissionsSecondSub.length - 1]).toEqual(expectedDocs)
  })
})
