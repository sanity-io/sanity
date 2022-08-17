import {EMPTY, of, Subject} from 'rxjs'
import {getPairListener} from '../getPairListener'
import {MutationEvent} from '../types'

const idPair = {publishedId: 'grrm', draftId: 'drafts.grrm'}
const draft = {_id: idPair.draftId, _type: 'author', name: 'George. R.R. Martin'}
const published = {_id: idPair.publishedId, _type: 'author', name: 'George RR Martin'}

describe('pair listener', () => {
  it('should listen for correct events, and without mutation results', () => {
    const sub = jest.fn()
    const listen = jest.fn().mockReturnValue(EMPTY)
    const mockClient = {observable: {listen, getDocuments: jest.fn()}}
    const pair$ = getPairListener(mockClient, idPair).subscribe(sub)

    expect(sub).not.toHaveBeenCalled()
    expect(listen).toHaveBeenCalledTimes(1) // Shared subscription
    expect(listen).toHaveBeenLastCalledWith('*[_id == $publishedId || _id == $draftId]', idPair, {
      includeResult: false,
      events: ['welcome', 'mutation', 'reconnect'],
      effectFormat: 'mendoza',
      tag: 'document.pair-listener',
    })

    pair$.unsubscribe()
  })

  it('should replace welcome event with document snapshots', () => {
    const sub = jest.fn()
    const listen = jest.fn().mockReturnValue(of({type: 'welcome', listenerName: 'abc123'}))
    const getDocuments = jest.fn().mockReturnValue(of([draft, published]))
    const mockClient = {observable: {listen, getDocuments}}
    const pair$ = getPairListener(mockClient, idPair).subscribe(sub)

    expect(listen).toHaveBeenCalledTimes(1) // Shared subscription

    expect(sub).toHaveBeenCalledTimes(2)
    expect(sub).toHaveBeenNthCalledWith(1, {
      type: 'snapshot',
      documentId: idPair.draftId,
      document: draft,
    })
    expect(sub).toHaveBeenNthCalledWith(2, {
      type: 'snapshot',
      documentId: idPair.publishedId,
      document: published,
    })

    pair$.unsubscribe()
  })

  it('should hold mutations while snapshot is fetched', () => {
    const mutation: MutationEvent = {
      type: 'mutation',
      documentId: idPair.draftId,
      transactionId: 'trxA',
      mutations: [{patch: {id: idPair.draftId, unset: ['dud']}}],
      effects: {apply: [], revert: []},
      transition: 'update',
      eventNumber: {current: 1, total: 1},
    }
    const sub = jest.fn()
    const listen = jest
      .fn()
      .mockReturnValue(of({type: 'welcome', listenerName: 'abc123'}, mutation))
    const snapshots = new Subject()
    const getDocuments = jest.fn().mockReturnValue(snapshots)
    const mockClient = {observable: {listen, getDocuments}}
    const pair$ = getPairListener(mockClient, idPair).subscribe(sub)

    expect(listen).toHaveBeenCalledTimes(1) // Shared subscription

    // Holds while snapshot is fetching, eg async, so nothing emitted yet
    expect(sub).toHaveBeenCalledTimes(0)
    snapshots.next([draft, null])
    snapshots.complete()

    // Should emits two snapshot events
    expect(sub).toHaveBeenNthCalledWith(1, {
      type: 'snapshot',
      documentId: idPair.draftId,
      document: draft,
    })
    expect(sub).toHaveBeenNthCalledWith(2, {
      type: 'snapshot',
      documentId: idPair.publishedId,
      document: null,
    })

    // ...and then release the mutation
    expect(sub).toHaveBeenNthCalledWith(3, mutation)

    pair$.unsubscribe()
  })

  it('should wait for all mutations from the same transaction before releasing', () => {
    const deleteDraftMutation: MutationEvent = {
      type: 'mutation',
      documentId: idPair.draftId,
      transactionId: 'trxA',
      mutations: [{delete: {id: idPair.draftId}}],
      effects: {apply: [0, null], revert: [0, draft]},
      transition: 'disappear',
      eventNumber: {current: 1, total: 2},
    }
    const createDraftMutation: MutationEvent = {
      type: 'mutation',
      documentId: idPair.draftId,
      transactionId: 'trxB', // Note how this is part of a separate transaction
      mutations: [{createIfNotExists: {...draft, birthYear: 1948}}],
      effects: {apply: [0, {...draft, birthYear: 1948}], revert: [0, null]},
      transition: 'appear',
      eventNumber: {current: 1, total: 1},
    }
    const replacePublishedMutation: MutationEvent = {
      type: 'mutation',
      documentId: idPair.publishedId,
      transactionId: 'trxA',
      mutations: [{createOrReplace: {...draft, _id: idPair.publishedId}}],
      // Note: this isn't the correct transition, but 🤷‍♂️ - not used in the pair listener
      effects: {apply: [0, {...draft, _id: idPair.publishedId}], revert: [0, published]},
      transition: 'update',
      eventNumber: {current: 2, total: 2},
    }
    const sub = jest.fn()
    const eventStream = new Subject()
    const listen = jest.fn().mockReturnValue(eventStream)
    const getDocuments = jest.fn().mockReturnValue(of([draft, published]))
    const mockClient = {observable: {listen, getDocuments}}
    const pair$ = getPairListener(mockClient, idPair).subscribe(sub)

    // Listen only once
    expect(listen).toHaveBeenCalledTimes(1) // Shared subscription

    // Welcome event will trigger snapshot fetch and emit (one for each document)
    eventStream.next({type: 'welcome', listenerName: 'abc123'})
    expect(sub).toHaveBeenCalledTimes(2)

    // Delete is part of a 2-event transaction, so it should be held until the other mutation is received
    eventStream.next(deleteDraftMutation)
    expect(sub).toHaveBeenCalledTimes(2) // Still at 2, still waiting for the other mutation

    // Events not related to the partial transaction should be held
    eventStream.next(createDraftMutation)
    expect(sub).toHaveBeenCalledTimes(2) // Still at 2, waiting for the first transaction to complete

    // When transaction is complete, all mutations should be released
    eventStream.next(replacePublishedMutation)
    expect(sub).toHaveBeenCalledTimes(5) // 2 snapshots, 3 mutations: delete draft, create draft, replace published

    pair$.unsubscribe()
  })
})
