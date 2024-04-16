import {beforeEach, describe, expect, jest, test} from '@jest/globals'
import {type SanityClient} from '@sanity/client'
import {merge, of} from 'rxjs'
import {delay} from 'rxjs/operators'

import {checkoutPair} from './checkoutPair'

const mockedDataRequest = jest.fn(() => of({}))
const mockedObservableRequest = jest.fn(() => of({}))

const client = {
  observable: {
    listen: () => of({type: 'welcome'}).pipe(delay(0)),
    getDocuments: (ids: string[]) =>
      of([
        {_id: ids[0], _type: 'any', _rev: 'any'},
        {_id: ids[1], _type: 'any', _rev: 'any'},
      ]),
  },
  dataRequest: mockedDataRequest,
}

const clientWithConfig = {
  ...client,
  withConfig: () => ({
    ...client,
    observable: {...client.observable, request: mockedObservableRequest},
  }),
  config: () => ({dataset: 'production'}),
}

const idPair = {publishedId: 'publishedId', draftId: 'draftId'}

beforeEach(() => {
  jest.clearAllMocks()
})

describe('checkoutPair -- local actions', () => {
  test('patch', async () => {
    const {draft, published} = checkoutPair(client as any as SanityClient, idPair, false)
    const combined = merge(draft.events, published.events)
    const sub = combined.subscribe()
    await new Promise((resolve) => setTimeout(resolve, 0))

    draft.mutate(draft.patch([{set: {title: 'new title'}}]))
    draft.commit()

    expect(mockedDataRequest).toHaveBeenCalledWith(
      'mutate',
      {
        mutations: [{patch: {id: 'draftId', set: {title: 'new title'}}}],
        transactionId: expect.any(String),
      },
      {
        returnDocuments: false,
        skipCrossDatasetReferenceValidation: true,
        tag: 'document.commit',
        visibility: 'async',
      },
    )
    sub.unsubscribe()
  })

  test('createIfNotExists', async () => {
    const {draft, published} = checkoutPair(client as any as SanityClient, idPair, false)
    const combined = merge(draft.events, published.events)
    const sub = combined.subscribe()
    await new Promise((resolve) => setTimeout(resolve, 0))

    draft.mutate([
      draft.createIfNotExists({
        _id: 'draftId',
        _type: 'any',
        _createdAt: 'now',
        _updatedAt: 'now',
        _rev: 'any',
      }),
    ])
    draft.commit()

    expect(mockedDataRequest).toHaveBeenCalledWith(
      'mutate',
      {
        mutations: [
          {
            createIfNotExists: {
              _id: 'draftId',
              _type: 'any',
              _createdAt: 'now',
            },
          },
        ],
        transactionId: expect.any(String),
      },
      {
        returnDocuments: false,
        skipCrossDatasetReferenceValidation: true,
        tag: 'document.commit',
        visibility: 'async',
      },
    )

    sub.unsubscribe()
  })

  test('create', async () => {
    const {draft, published} = checkoutPair(client as any as SanityClient, idPair, false)
    const combined = merge(draft.events, published.events)
    const sub = combined.subscribe()
    await new Promise((resolve) => setTimeout(resolve, 0))

    draft.mutate([
      draft.create({
        _id: 'draftId',
        _type: 'any',
        _createdAt: 'now',
        _updatedAt: 'now',
        _rev: 'any',
      }),
    ])
    draft.commit()

    expect(mockedDataRequest).toHaveBeenCalledWith(
      'mutate',
      {
        mutations: [
          {
            create: {
              _id: 'draftId',
              _type: 'any',
              _createdAt: 'now',
            },
          },
        ],
        transactionId: expect.any(String),
      },
      {
        returnDocuments: false,
        skipCrossDatasetReferenceValidation: true,
        tag: 'document.commit',
        visibility: 'async',
      },
    )

    sub.unsubscribe()
  })

  test('createOrReplace', async () => {
    const {draft, published} = checkoutPair(client as any as SanityClient, idPair, false)
    const combined = merge(draft.events, published.events)
    const sub = combined.subscribe()
    await new Promise((resolve) => setTimeout(resolve, 0))

    draft.mutate([
      draft.createOrReplace({
        _id: 'draftId',
        _type: 'any',
        _createdAt: 'now',
        _updatedAt: 'now',
        _rev: 'any',
      }),
    ])
    draft.commit()

    expect(mockedDataRequest).toHaveBeenCalledWith(
      'mutate',
      {
        mutations: [
          {
            createOrReplace: {
              _id: 'draftId',
              _type: 'any',
              _rev: expect.any(String),
              _createdAt: 'now',
            },
          },
        ],
        transactionId: expect.any(String),
      },
      {
        returnDocuments: false,
        skipCrossDatasetReferenceValidation: true,
        tag: 'document.commit',
        visibility: 'async',
      },
    )

    sub.unsubscribe()
  })

  test('delete', async () => {
    const {draft, published} = checkoutPair(client as any as SanityClient, idPair, false)
    const combined = merge(draft.events, published.events)
    const sub = combined.subscribe()
    await new Promise((resolve) => setTimeout(resolve, 0))

    draft.mutate([draft.delete()])
    draft.commit()

    expect(mockedDataRequest).toHaveBeenCalledWith(
      'mutate',
      {
        mutations: [
          {
            delete: {
              id: 'draftId',
            },
          },
        ],
        transactionId: expect.any(String),
      },
      {
        returnDocuments: false,
        skipCrossDatasetReferenceValidation: true,
        tag: 'document.commit',
        visibility: 'async',
      },
    )

    sub.unsubscribe()
  })
})

describe('checkoutPair -- server actions', () => {
  test('patch', async () => {
    const {draft, published} = checkoutPair(clientWithConfig as any as SanityClient, idPair, true)
    const combined = merge(draft.events, published.events)
    const sub = combined.subscribe()
    await new Promise((resolve) => setTimeout(resolve, 0))

    draft.mutate(draft.patch([{set: {title: 'new title'}}]))
    draft.commit()

    expect(mockedObservableRequest).toHaveBeenCalledWith({
      url: '/data/actions/production',
      method: 'post',
      tag: 'document.commit',
      body: {
        transactionId: expect.any(String),
        actions: [
          {
            actionType: 'sanity.action.document.edit',
            draftId: 'draftId',
            publishedId: 'publishedId',
            patch: {
              id: 'draftId',
              set: {
                title: 'new title',
              },
            },
          },
        ],
      },
    })

    sub.unsubscribe()
  })

  test('createIfNotExists', async () => {
    const {draft, published} = checkoutPair(clientWithConfig as any as SanityClient, idPair, true)
    const combined = merge(draft.events, published.events)
    const sub = combined.subscribe()
    await new Promise((resolve) => setTimeout(resolve, 0))

    draft.mutate([
      draft.createIfNotExists({
        _id: 'draftId',
        _type: 'any',
        _createdAt: 'now',
        _updatedAt: 'now',
        _rev: 'any',
      }),
    ])
    draft.commit()

    expect(mockedObservableRequest).toHaveBeenCalledWith({
      url: '/data/actions/production',
      method: 'post',
      tag: 'document.commit',
      body: {
        transactionId: expect.any(String),
        actions: [
          {
            actionType: 'sanity.action.document.create',
            publishedId: 'publishedId',
            attributes: {
              _id: 'draftId',
              _type: 'any',
              _createdAt: 'now',
            },
            ifExists: 'ignore',
          },
        ],
      },
    })

    sub.unsubscribe()
  })

  test('delete', async () => {
    const {draft, published} = checkoutPair(clientWithConfig as any as SanityClient, idPair, true)
    const combined = merge(draft.events, published.events)
    const sub = combined.subscribe()
    await new Promise((resolve) => setTimeout(resolve, 0))

    draft.mutate([draft.delete()])
    draft.commit()

    expect(mockedObservableRequest).toHaveBeenCalledWith({
      url: '/data/actions/production',
      method: 'post',
      tag: 'document.commit',
      body: {
        transactionId: expect.any(String),
        actions: [
          {
            actionType: 'sanity.action.document.delete',
            draftId: 'draftId',
            publishedId: 'publishedId',
          },
        ],
      },
    })

    sub.unsubscribe()
  })
})
