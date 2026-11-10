import {ChannelError, type SanityClient} from '@sanity/client'
import {act, renderHook, screen, waitFor} from '@testing-library/react'
import {firstValueFrom, of, throwError} from 'rxjs'
import {
  createSchema,
  defineConfig,
  defineField,
  defineType,
  type SanityDocument,
  useDocumentForm,
} from 'sanity'
import {afterEach, describe, expect, vi} from 'vitest'

import {createMockSanityClientAsClient} from '../../../test/mocks/mockSanityClient'
import {it} from '../../../test/testUtils/listenerOutagesTest'
import {createTestProvider} from '../../../test/testUtils/TestProvider'
import {listenSearchQuery} from '../panes/documentList/listenSearchQuery'

const schemaTypes = [
  defineType({
    name: 'book',
    type: 'document',
    fields: [defineField({name: 'title', type: 'string'})],
  }),
]

function book(id: string): SanityDocument {
  return {
    _id: id,
    _type: 'book',
    _rev: `${id}-rev`,
    _createdAt: '2026-01-01T00:00:00Z',
    _updatedAt: '2026-01-01T00:00:00Z',
    title: 'Dune',
  }
}

// Grants that let the form edit the document, so read-only can only come from the listener.
const EDIT_EVERYTHING = [
  {filter: '_id in path("**")', permissions: ['read', 'create', 'history', 'update']},
]

// Fails the way the API fails a listener it cannot set up.
const failingListener = () =>
  throwError(() => new ChannelError('Internal error', {error: {description: 'Internal error'}}))

/**
 * A client whose every listener fails, while plain HTTP requests keep working: the search finds
 * the book, and the document is fetched by id.
 */
function createClientWithListenersDown(documentId: string, projectId: string): SanityClient {
  const client = createMockSanityClientAsClient({requests: {'/acl': EDIT_EVERYTHING}}, {projectId})
  vi.spyOn(client, 'listen').mockImplementation(failingListener)
  vi.spyOn(client.observable, 'listen').mockImplementation(failingListener)
  vi.spyOn(client.observable, 'getDocuments').mockImplementation((ids: string[]) =>
    of(ids.map((id) => (id === `drafts.${documentId}` ? book(id) : null))),
  )
  vi.spyOn(client.observable, 'fetch').mockImplementation(((query: string) =>
    of(query.includes('_type == "book"') ? [book(`drafts.${documentId}`)] : [])) as never)
  return client
}

describe('the structure tool while every listener is down', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('lists the documents its search finds', async ({projectId}) => {
    const client = createClientWithListenersDown('book-listed', projectId)

    const state = await firstValueFrom(
      listenSearchQuery({
        client,
        filter: '_type == "book"',
        limit: 25,
        params: {},
        schema: createSchema({name: 'default', types: schemaTypes}),
        searchQuery: '',
        sort: {by: [{field: '_updatedAt', direction: 'desc'}]},
        staticTypeNames: ['book'],
      }),
    )

    expect(state.connected).toBe(false)
    expect(state.documents.map((document) => document._id)).toEqual(['drafts.book-listed'])
  })

  it('opens a document read-only and says why', async ({projectId}) => {
    const client = createClientWithListenersDown('book-opened', projectId)
    const TestProvider = await createTestProvider({
      client,
      config: defineConfig({projectId: 'test', dataset: 'test', schema: {types: schemaTypes}}),
    })
    vi.useFakeTimers({shouldAdvanceTime: true})

    const {result} = renderHook(
      () => useDocumentForm({documentId: 'book-opened', documentType: 'book'}),
      {wrapper: TestProvider},
    )

    await waitFor(() => expect(result.current.value.title).toBe('Dune'))
    await waitFor(() => expect(result.current.connectionState).toBe('reconnecting'))
    expect(result.current.formState?.readOnly).toBe(true)

    // The toast waits two seconds, so a short drop goes unnoticed.
    await act(() => vi.advanceTimersByTimeAsync(3_000))
    expect(
      screen.getByText('Documents are read-only until the connection is restored.'),
    ).toBeInTheDocument()
  })
})
