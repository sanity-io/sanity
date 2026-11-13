import {ChannelError, type SanityClient} from '@sanity/client'
import {act, renderHook, screen, waitFor} from '@testing-library/react'
import {firstValueFrom, mergeMap, type Observable, of, throwError, timer} from 'rxjs'
import {
  createSchema,
  defineConfig,
  defineField,
  defineType,
  remoteSnapshots,
  type SanityDocument,
  useDocumentForm,
} from 'sanity'
import {afterEach, describe, expect, onTestFinished, vi} from 'vitest'

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

// Fails the way the API fails a listener it refuses to serve, which reconnecting would not change.
// The client reports it from the event stream, so it arrives after the listener is subscribed.
const refusedListener = () =>
  timer(0).pipe(
    mergeMap(() =>
      throwError(
        () =>
          new ChannelError('Permission denied', {
            error: {type: 'permissionDeniedError', description: 'Permission denied'},
          }),
      ),
    ),
  )

/**
 * A client whose every listener fails, while plain HTTP requests keep working: the search finds
 * the book, and the document is fetched by id.
 */
function createClientWithListenersDown(
  documentId: string,
  projectId: string,
  listener: () => Observable<never> = failingListener,
): SanityClient {
  const client = createMockSanityClientAsClient({requests: {'/acl': EDIT_EVERYTHING}}, {projectId})
  vi.spyOn(client, 'listen').mockImplementation(listener)
  vi.spyOn(client.observable, 'listen').mockImplementation(listener)
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

describe('the structure tool when every listener fails for good', () => {
  it('lists the documents its search finds, and reports the lost connection', async ({
    projectId,
    requestErrorChannel,
  }) => {
    const client = createClientWithListenersDown('book-listed', projectId, refusedListener)

    const state = await firstValueFrom(
      listenSearchQuery({
        client,
        // The list caches its last result per query: a filter of its own keeps it from starting
        // with the result of the test above.
        filter: '_type == "book" && defined(title)',
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
    expect(await firstValueFrom(requestErrorChannel.claim$)).toMatchObject({
      type: 'listenerError',
      retryable: false,
    })
  })

  it.for([
    ['', false],
    [', also when the document was first checked out without the studio', true],
  ] as const)(
    'opens a document read-only, and reports the lost connection%s',
    async ([, checkedOutFirst], {projectId, requestErrorChannel}) => {
      const client = createClientWithListenersDown('book-opened', projectId, refusedListener)
      if (checkedOutFirst) {
        // The document pair is shared by every consumer of the document, and the one that checks it
        // out first opens its listener. The events pane checks it out this way, with no options.
        const subscription = remoteSnapshots(
          client,
          {draftId: 'drafts.book-opened', publishedId: 'book-opened'},
          'book',
        ).subscribe()
        onTestFinished(() => subscription.unsubscribe())
      }
      const TestProvider = await createTestProvider({
        client,
        config: defineConfig({projectId: 'test', dataset: 'test', schema: {types: schemaTypes}}),
      })

      const {result} = renderHook(
        () => useDocumentForm({documentId: 'book-opened', documentType: 'book'}),
        {wrapper: TestProvider},
      )

      await waitFor(() => expect(result.current.value.title).toBe('Dune'))
      await waitFor(() => expect(result.current.connectionState).toBe('reconnecting'))
      expect(result.current.formState?.readOnly).toBe(true)
      expect(await firstValueFrom(requestErrorChannel.claim$)).toMatchObject({
        type: 'listenerError',
        retryable: false,
      })
    },
  )
})
