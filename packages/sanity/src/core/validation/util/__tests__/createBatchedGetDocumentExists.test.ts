import {of} from 'rxjs'
import type {SanityClient} from '@sanity/client'
import {createBatchedGetDocumentExists} from '../createBatchedGetDocumentExists'

describe('createBatchedGetDocumentExists', () => {
  it('returns a getDocumentExists function that batches calls for document existence', async () => {
    const mockClient = {
      getDataUrl: (operation: string, path?: string) => `https://example.com/${operation}/${path}`,
      observable: {
        request: jest.fn(() => of({omitted: [{id: 'baz', reason: 'existence'}]})),
      },
    }

    const getDocumentExists = createBatchedGetDocumentExists(mockClient as unknown as SanityClient)

    const [fooExists, barExists, bazExists] = await Promise.all([
      getDocumentExists({id: 'foo'}),
      getDocumentExists({id: 'bar'}),
      getDocumentExists({id: 'baz'}),
    ])

    expect(fooExists).toBe(true)
    expect(barExists).toBe(true)
    expect(bazExists).toBe(false)

    expect(mockClient.observable.request).toHaveBeenCalledTimes(1)
  })
})
