import {expect, jest, test} from '@jest/globals'
import {type SanityClient} from '@sanity/client'
import {merge, of} from 'rxjs'
import {delay} from 'rxjs/operators'

import {checkoutPair} from './checkoutPair'

test('patch', async () => {
  const dataRequest = jest.fn(() => of({}))
  const client = {
    observable: {
      // request: jest.fn(),
      //TODO: make some listener events and some logic (when do we hit "welcome", ec)
      listen: () => of({type: 'welcome'}).pipe(delay(0)),
      getDocuments: (ids: string[]) =>
        of([
          {_id: ids[0], _type: 'any', _rev: 'any'},
          {_id: ids[1], _type: 'any', _rev: 'any'},
        ]),
    },
    dataRequest,
  }
  const idPair = {publishedId: 'publishedId', draftId: 'draftId'}

  const {draft, published} = checkoutPair(client as any as SanityClient, idPair, false)
  const combined = merge(draft.events, published.events)
  const sub = combined.subscribe()
  await new Promise((resolve) => setTimeout(resolve, 0))

  draft.mutate(draft.patch([{set: {title: 'new title'}}]))
  draft.commit()

  expect(dataRequest).toHaveBeenCalledWith(
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
