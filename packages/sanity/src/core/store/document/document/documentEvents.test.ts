import {type SanityClient} from '@sanity/client'
import {firstValueFrom, of} from 'rxjs'
import {describe, expect, it, type Mock, vi} from 'vitest'

import {createMockSanityClient} from '../../../../../test/mocks/mockSanityClient'
import {type DocumentCheckout} from './documentCheckout'
import {documentEvents} from './documentEvents'
import {memoizedDocumentCheckout} from './memoizedDocumentCheckout'

vi.mock('./memoizedDocumentCheckout', () => ({memoizedDocumentCheckout: vi.fn()}))

const mockMemoizedDocumentCheckout = memoizedDocumentCheckout as Mock<
  typeof memoizedDocumentCheckout
>

function getMockClient() {
  return createMockSanityClient() as unknown as SanityClient
}

function createCheckout(event: {type: 'committed'; version: 'draft'}): DocumentCheckout {
  return {
    document: {events: of(event)} as DocumentCheckout['document'],
    transactionsPendingEvents$: of({type: 'pending', phase: 'begin'}),
  }
}

describe('documentEvents', () => {
  it('streams events from the resolved document checkout', async () => {
    const client = getMockClient()
    const event = {type: 'committed' as const, version: 'draft' as const}

    mockMemoizedDocumentCheckout.mockReturnValue(of(createCheckout(event)))

    await expect(
      firstValueFrom(documentEvents('drafts.example-id', client, {tag: 'test'})),
    ).resolves.toEqual(event)
    expect(mockMemoizedDocumentCheckout).toHaveBeenCalledWith(client, 'drafts.example-id', {
      tag: 'test',
    })
  })

  it('memoizes by client and document id', () => {
    const client = getMockClient()

    mockMemoizedDocumentCheckout.mockReturnValue(
      of(createCheckout({type: 'committed', version: 'draft'})),
    )

    expect(documentEvents('drafts.example-id', client)).toBe(
      documentEvents('drafts.example-id', client),
    )
  })
})
