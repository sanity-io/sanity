import {ChannelError, createClient, type ListenEvent} from '@sanity/client'
import {defer, of, Subject} from 'rxjs'
import {afterEach, beforeEach, describe, expect, onTestFinished, vi} from 'vitest'

import {it} from '../../../../../test/testUtils/listenerOutagesTest'
import {createDocumentPreviewStore} from '../../../preview/documentPreviewStore'
import {type CompanionDocs, createCanvasCompanionDocsStore} from '../createCanvasCompanionDocsStore'

type Event = ListenEvent<Record<string, unknown>>

const PUBLISHED_ID = 'book-linked-to-canvas'
const DRAFT_ID = `drafts.${PUBLISHED_ID}`
const LINK_ID = 'canvas-link-1'

/**
 * A client for a draft that a Canvas document has locked. Every listener connection can be driven
 * separately, keyed by its query, and fetches answer from what the dataset holds.
 */
function setup(projectId: string) {
  const client = createClient({
    projectId,
    dataset: 'production',
    apiVersion: '2025-02-19',
    useCdn: false,
  })
  vi.spyOn(client, 'withConfig').mockImplementation(() => client)

  // Keyed by the listener's tag: the global preview listener (`preview.global`), which the version
  // ids of the document load from, and the live document id set listeners (`client.observable`).
  const connections = new Map<string, Subject<Event>[]>()
  const open = (_query: string, _params?: unknown, options?: {tag?: string}) =>
    defer(() => {
      const connection = new Subject<Event>()
      const tag = options?.tag ?? ''
      connections.set(tag, [...(connections.get(tag) ?? []), connection])
      return connection
    }) as never
  vi.spyOn(client, 'listen').mockImplementation(open)
  vi.spyOn(client.observable, 'listen').mockImplementation(open)
  const latestConnection = (tag: string) => {
    const connection = connections.get(tag)?.at(-1)
    if (!connection) throw new Error(`No listener tagged ${tag}`)
    return connection
  }

  vi.spyOn(client.observable, 'fetch').mockImplementation(((
    query: string,
    _params: unknown,
    options?: {tag?: string},
  ) => {
    // One set of version ids per document group the batch asks for.
    if (options?.tag === 'preview.observe-version-ids') return of([[PUBLISHED_ID, DRAFT_ID]])
    if (query.includes('sanity.canvas.link')) return of([LINK_ID])
    if (query.includes('isStudioDocumentEditable')) {
      return of({
        _id: LINK_ID,
        canvasDocumentId: 'canvas-document',
        studioDocumentId: DRAFT_ID,
        isStudioDocumentEditable: false,
      })
    }
    throw new Error(`Unexpected fetch: ${query}`)
  }) as never)

  const store = createCanvasCompanionDocsStore({
    client,
    previewStore: createDocumentPreviewStore({client}),
  })
  const states: CompanionDocs[] = []
  const subscription = store.getCompanionDocs(DRAFT_ID).subscribe((state) => states.push(state))
  onTestFinished(() => subscription.unsubscribe())
  return {latestConnection, states}
}

const welcome = {type: 'welcome', listenerName: 'test'} as Event

const GLOBAL_LISTENER = 'preview.global'
// The live document id set the companion docs are found with (`_type == "sanity.canvas.link"`).
const LINK_LISTENER = 'preview.observe-document-set.listen'

describe('canvas companion docs', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('keeps a canvas lock through a channel error on its listener', async ({projectId}) => {
    const {latestConnection, states} = setup(projectId)
    latestConnection(GLOBAL_LISTENER).next(welcome)
    // The version ids are fetched in batches collected for 100ms.
    await vi.advanceTimersByTimeAsync(100)
    latestConnection(LINK_LISTENER).next(welcome)
    await vi.advanceTimersByTimeAsync(0)
    expect(states.at(-1)?.data).toEqual([
      expect.objectContaining({isStudioDocumentEditable: false}),
    ])

    latestConnection(LINK_LISTENER).error(
      new ChannelError('Internal error', {error: {description: 'Internal error'}}),
    )
    await vi.advanceTimersByTimeAsync(1_000)
    latestConnection(LINK_LISTENER).next(welcome)
    await vi.advanceTimersByTimeAsync(0)

    expect(states.at(-1)).toEqual({
      error: null,
      loading: false,
      data: [expect.objectContaining({_id: LINK_ID, isStudioDocumentEditable: false})],
    })
  })
})
