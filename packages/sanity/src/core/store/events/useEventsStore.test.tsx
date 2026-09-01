import {type SanityDocument} from '@sanity/types'
import {renderHook} from '@testing-library/react'
import {firstValueFrom, NEVER, toArray} from 'rxjs'
import {afterEach, describe, expect, it, vi} from 'vitest'

import {createMockClient, createTranslogFetchStub} from './__fixtures__/mockClient'
import {useEventsStore} from './useEventsStore'

const {client, requests} = createMockClient({
  respond: (request) => {
    if (request.url.includes('/events/documents/')) {
      return {events: {}, nextCursor: ''}
    }
    return {documents: [publishedDoc]}
  },
})

const publishedDoc: SanityDocument = {
  _id: 'doc-wiring',
  _type: 'author',
  _rev: 'rev-wiring',
  _createdAt: '2024-01-01T00:00:00Z',
  _updatedAt: '2024-01-01T00:00:00Z',
}

vi.mock('../../hooks/useClient', () => ({useClient: () => client}))
vi.mock('../../hooks/useSchema', () => ({useSchema: () => ({get: () => undefined})}))
vi.mock('../document/document-pair/remoteSnapshots', () => ({remoteSnapshots: () => NEVER}))

describe('useEventsStore', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('resolves revisions against the whole document group (#14346)', async () => {
    // Locks the `includeGroupDocuments` wiring: a published revision selected while the pane
    // shows the draft must be fetched with the group id list, or it can never resolve.
    vi.stubGlobal('fetch', createTranslogFetchStub(() => []).fetch)

    const {result} = renderHook(() =>
      useEventsStore({documentId: 'drafts.doc-wiring', documentType: 'author'}),
    )

    const emissions = await firstValueFrom(
      result.current.getDocumentAtRevision('rev-wiring').pipe(toArray()),
    )

    expect(requests.map((request) => request.url)).toContain(
      '/data/history/test-dataset/documents/doc-wiring,drafts.doc-wiring?revision=rev-wiring',
    )
    expect(emissions.at(-1)).toEqual({
      document: publishedDoc,
      loading: false,
      revisionId: 'rev-wiring',
    })
  })
})
