import {type SanityClient} from '@sanity/client'
import {merge, of} from 'rxjs'
import {delay} from 'rxjs/operators'
import {beforeEach, describe, expect, test, vi} from 'vitest'

import {checkoutPair} from './checkoutPair'

const mockedDataRequest = vi.fn(() => of({}))
const mockedActionRequest = vi.fn(() => of({}))

const client = {
  observable: {
    listen: () => of({type: 'welcome'}).pipe(delay(0)),
    getDocuments: (ids: string[]) =>
      of([
        {_id: ids[0], _type: 'any', _rev: 'any'},
        {_id: ids[1], _type: 'any', _rev: 'any'},
      ]),
    action: mockedActionRequest,
  },
  dataRequest: mockedDataRequest,
  withConfig: vi.fn(() => client),
}

const idPair = {publishedId: 'publishedId', draftId: 'draftId'}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('checkoutPair -- local actions', () => {
  test('patch', async () => {
    const {draft, published} = checkoutPair(client as any as SanityClient, idPair, of(false))
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
    const {draft, published} = checkoutPair(client as any as SanityClient, idPair, of(false))
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
    const {draft, published} = checkoutPair(client as any as SanityClient, idPair, of(false))
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
    const {draft, published} = checkoutPair(client as any as SanityClient, idPair, of(false))
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
    const {draft, published} = checkoutPair(client as any as SanityClient, idPair, of(false))
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
    const {draft, published} = checkoutPair(client as any as SanityClient, idPair, of(true))
    const combined = merge(draft.events, published.events)
    const sub = combined.subscribe()
    await new Promise((resolve) => setTimeout(resolve, 0))

    draft.mutate(draft.patch([{set: {title: 'new title'}}]))
    draft.commit()

    expect(mockedActionRequest).toHaveBeenCalledWith(
      [
        {
          actionType: 'sanity.action.document.edit',
          draftId: 'draftId',
          publishedId: 'publishedId',
          patch: {
            set: {
              title: 'new title',
            },
          },
        },
      ],
      {
        tag: 'document.commit',
        transactionId: expect.any(String),
      },
    )

    sub.unsubscribe()
  })

  test('published patch uses mutation endpoint', async () => {
    const {draft, published} = checkoutPair(client as any as SanityClient, idPair, of(true))
    const combined = merge(draft.events, published.events)
    const sub = combined.subscribe()
    await new Promise((resolve) => setTimeout(resolve, 0))

    //liveEdit should be the only condition to directly patch a published doc
    published.mutate(published.patch([{set: {title: 'new title'}}]))
    published.commit()

    expect(mockedActionRequest).not.toHaveBeenCalled()

    expect(mockedDataRequest).toHaveBeenCalledWith(
      'mutate',
      {
        mutations: [{patch: {id: 'publishedId', set: {title: 'new title'}}}],
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
    const {draft, published} = checkoutPair(client as any as SanityClient, idPair, of(true))
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

    expect(mockedActionRequest).toHaveBeenCalledWith(
      [
        {
          actionType: 'sanity.action.document.create',
          publishedId: 'publishedId',
          attributes: {
            _id: 'draftId',
            _type: 'any',
            _createdAt: 'now',
          },
          ifExists: 'fail',
        },
      ],
      {
        tag: 'document.commit',
        transactionId: expect.any(String),
      },
    )

    sub.unsubscribe()
  })

  test('createIfNotExists', async () => {
    const {draft, published} = checkoutPair(client as any as SanityClient, idPair, of(true))
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

    expect(mockedActionRequest).toHaveBeenCalledWith(
      [
        {
          actionType: 'sanity.action.document.edit',
          draftId: idPair.draftId,
          publishedId: idPair.publishedId,
          patch: {
            unset: ['_empty_action_guard_pseudo_field_'],
          },
        },
      ],
      {
        tag: 'document.commit',
        transactionId: expect.any(String),
      },
    )

    sub.unsubscribe()
  })
})
