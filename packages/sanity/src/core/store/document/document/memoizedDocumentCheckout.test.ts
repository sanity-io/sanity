import {type SanityClient} from '@sanity/client'
import {firstValueFrom, of, Subject} from 'rxjs'
import {beforeEach, describe, expect, it, type Mock, vi} from 'vitest'

import {createMockSanityClient} from '../../../../../test/mocks/mockSanityClient'
import {documentCheckout} from './documentCheckout'
import {memoizedDocumentCheckout} from './memoizedDocumentCheckout'

vi.mock('./documentCheckout', () => ({documentCheckout: vi.fn()}))

const mockDocumentCheckout = documentCheckout as Mock<typeof documentCheckout>

function getMockClient() {
  return createMockSanityClient() as unknown as SanityClient
}

function createCheckout() {
  return {
    transactionsPendingEvents$: of({type: 'pending' as const, phase: 'begin' as const}),
    document: {
      events: new Subject(),
    },
  } as ReturnType<typeof documentCheckout>
}

describe('memoizedDocumentCheckout', () => {
  beforeEach(() => {
    mockDocumentCheckout.mockReset()
  })

  it('shares one checkout for the same client and document id', async () => {
    const client = getMockClient()
    const checkout = createCheckout()

    mockDocumentCheckout.mockReturnValue(checkout)

    const first = memoizedDocumentCheckout(client, 'example-id', {
      tag: 'first',
    })
    const second = memoizedDocumentCheckout(client, 'example-id', {tag: 'second'})

    expect(first).toBe(second)
    await expect(firstValueFrom(first)).resolves.toBe(checkout)
    expect(mockDocumentCheckout).toHaveBeenCalledWith('example-id', client, {tag: 'first'})
  })

  it('keeps the checkout subscribed to document events', async () => {
    const client = getMockClient()
    const checkout = createCheckout()

    mockDocumentCheckout.mockReturnValue(checkout)

    const subscription = memoizedDocumentCheckout(client, 'other-id').subscribe()
    checkout.document.events.next({type: 'committed'})
    subscription.unsubscribe()

    expect(mockDocumentCheckout).toHaveBeenCalledTimes(1)
  })

  it('memoizes clients without project or dataset config', async () => {
    const client = {config: () => ({})} as SanityClient
    const checkout = createCheckout()

    mockDocumentCheckout.mockReturnValue(checkout)

    await expect(firstValueFrom(memoizedDocumentCheckout(client, 'configless-id'))).resolves.toBe(
      checkout,
    )
  })
})
