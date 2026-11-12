import {
  type CollaborationCommentDocument,
  createClient,
  type ListenEvent,
  type MutationEvent,
  type WelcomeEvent,
} from '@sanity/client'
import {act, renderHook, waitFor} from '@testing-library/react'
import {Observable, Subject} from 'rxjs'
import {describe, expect, it, vi} from 'vitest'

import {type CommentDocument} from '../../types'
import {comment} from '../__fixtures__/comment.fixture'
import {createCommentsApiListenerStore} from '../createCommentsApiListenerStore'
import {useCommentsStore} from '../useCommentsStore'

const WELCOME: WelcomeEvent = {type: 'welcome', listenerName: 'test'}

const transactionsIdMap = new Map<string, string>()
const onLatestTransactionIdReceived = vi.fn((id: string) => {
  transactionsIdMap.delete(id)
})

/** The comment as the Comments API listener reports it */
function apiComment(
  _id: string,
  sourceDocumentId: string,
  fields: {field?: string | null; status?: 'open' | 'resolved'} = {},
): CollaborationCommentDocument {
  const {field = 'title', status = 'open'} = fields
  const publishedId = sourceDocumentId.split('.').at(-1) ?? sourceDocumentId
  return {
    _type: 'sanity.comment',
    _id,
    _rev: `${_id}-rev`,
    _createdAt: '2026-01-01T00:00:00.000Z',
    _updatedAt: '2026-01-01T00:00:00.000Z',
    threadId: _id,
    message: [],
    reactions: [],
    status,
    target: {
      ...(field === null ? {} : {path: {field}}),
      sourceDocumentId,
      documentType: 'article',
      document: {
        _type: 'globalDocumentReference',
        _ref: `dataset:abc.production:${publishedId}`,
        _weak: true,
      },
    },
  }
}

function mutation(
  transition: 'appear' | 'update' | 'disappear',
  documentId: string,
  result?: CollaborationCommentDocument,
  transactionId = 'tx',
): MutationEvent<CollaborationCommentDocument> {
  return {
    type: 'mutation',
    documentId,
    eventId: `${documentId}#${transactionId}`,
    identity: 'user',
    mutations: [],
    timestamp: '2026-01-01T00:00:00.000Z',
    transactionId,
    transition,
    visibility: 'query',
    transactionTotalEvents: 1,
    transactionCurrentEvent: 1,
    ...(result ? {result} : {}),
  }
}

interface QueryParams {
  gdr?: string
  versionId?: string
  publishedDocumentId?: string
  draftDocumentId?: string
}

/**
 * A Comments API client on `abc.production` whose listener connections are served by `server`,
 * and whose queries return the matching `comments`.
 */
function setup(comments: CommentDocument[]) {
  const client = createClient({
    projectId: 'abc',
    dataset: 'production',
    apiVersion: 'vX',
    useCdn: false,
    collaboration: {organizationId: 'org'},
  })
  const server = new Subject<ListenEvent<CollaborationCommentDocument>>()
  const connections = {opened: 0}
  vi.spyOn(client.collaboration.comments, 'listen').mockReturnValue(
    new Observable<ListenEvent<CollaborationCommentDocument>>((subscriber) => {
      connections.opened += 1
      return server.subscribe(subscriber)
    }),
  )

  function fakeFetch(query: string, params: QueryParams = {}) {
    const sources = params.versionId
      ? [params.versionId]
      : [params.publishedDocumentId, params.draftDocumentId]
    return Promise.resolve(
      comments.filter(
        ({target}) =>
          target.document._ref === params.gdr &&
          sources.includes(target.sourceDocumentId) &&
          (!query.includes('defined(target.path.field)') || target.path !== undefined),
      ),
    )
  }
  const fetch = vi
    .spyOn(client.collaboration.comments, 'fetch')
    .mockImplementation(fakeFetch as typeof client.collaboration.comments.fetch)

  const listenerStore = createCommentsApiListenerStore({client})
  function useStores({docOneVersionId}: {docOneVersionId: string}) {
    const shared = {client, listenerStore, transactionsIdMap, onLatestTransactionIdReceived}
    return {
      docOne: useCommentsStore({
        ...shared,
        groupId: 'doc-1',
        versionId: docOneVersionId,
        type: 'field',
      }),
      docTwo: useCommentsStore({...shared, groupId: 'doc-2', versionId: 'doc-2', type: 'field'}),
    }
  }

  return {server, connections, fetch, useStores}
}

function ids(documents: {_id: string}[] | null) {
  return (documents ?? []).map((document) => document._id).toSorted()
}

async function renderConnected(comments: CommentDocument[]) {
  const testClient = setup(comments)
  const rendered = renderHook(testClient.useStores, {
    initialProps: {docOneVersionId: 'drafts.doc-1'},
  })

  await act(async () => {
    testClient.server.next(WELCOME)
  })
  await waitFor(() => {
    expect(rendered.result.current.docOne.loading).toBe(false)
    expect(rendered.result.current.docTwo.loading).toBe(false)
  })

  return {...testClient, ...rendered}
}

describe('useCommentsStore (comments v2)', () => {
  it('shares one Comments API listener with the other comments stores on the resource', async () => {
    const {result, connections, fetch} = await renderConnected([
      comment('c1', 'doc-1'),
      comment('c2', 'drafts.doc-1'),
      comment('c3', 'doc-2'),
    ])

    expect(connections.opened).toBe(1)
    expect(fetch).toHaveBeenCalledTimes(2)
    expect(ids(result.current.docOne.data)).toEqual(['c1', 'c2'])
    expect(ids(result.current.docTwo.data)).toEqual(['c3'])
  })

  it('keeps only the comments its query reads', async () => {
    const {result, server} = await renderConnected([])

    await act(async () => {
      server.next(mutation('appear', 'c3', apiComment('c3', 'doc-2')))
      server.next(mutation('appear', 'c4', apiComment('c4', 'versions.rSummer.doc-1')))
      server.next(mutation('appear', 'c5', apiComment('c5', 'doc-1', {field: null})))
    })

    expect(ids(result.current.docOne.data)).toEqual([])
    expect(ids(result.current.docTwo.data)).toEqual(['c3'])
  })

  it('drops a comment that an edit moves out of its query', async () => {
    const {result, server} = await renderConnected([comment('c1', 'doc-1')])
    const docTwoData = result.current.docTwo.data

    await act(async () => {
      server.next(mutation('update', 'c1', apiComment('c1', 'versions.rSummer.doc-1')))
    })

    expect(ids(result.current.docOne.data)).toEqual([])
    expect(result.current.docTwo.data).toBe(docTwoData)
  })

  it('skips a stale create echo and an older transaction', async () => {
    const {result, server} = await renderConnected([])
    transactionsIdMap.set('c1', 'tx-2')

    await act(async () => {
      server.next(mutation('appear', 'c1', apiComment('c1', 'doc-1'), 'tx-1'))
    })
    expect(ids(result.current.docOne.data)).toEqual([])

    await act(async () => {
      server.next(mutation('update', 'c1', apiComment('c1', 'doc-1', {status: 'resolved'}), 'tx-2'))
    })
    expect(result.current.docOne.data?.[0]?.status).toBe('resolved')
    expect(onLatestTransactionIdReceived).toHaveBeenCalledWith('c1')
  })

  it('fetches the comments of a version once the store switches to it, on the same listener', async () => {
    const {result, rerender, connections, fetch} = await renderConnected([
      comment('c1', 'doc-1'),
      comment('c4', 'versions.rSummer.doc-1'),
    ])
    expect(ids(result.current.docOne.data)).toEqual(['c1'])

    rerender({docOneVersionId: 'versions.rSummer.doc-1'})
    await waitFor(() => expect(ids(result.current.docOne.data)).toEqual(['c4']))

    expect(fetch).toHaveBeenLastCalledWith(
      expect.stringContaining('target.sourceDocumentId == $versionId'),
      expect.objectContaining({versionId: 'versions.rSummer.doc-1'}),
    )
    expect(connections.opened).toBe(1)
  })
})
