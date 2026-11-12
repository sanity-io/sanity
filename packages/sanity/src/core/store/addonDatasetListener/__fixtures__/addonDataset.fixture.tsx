import {
  createClient,
  type ListenEvent,
  type MutationEvent,
  type SanityClient,
  type WelcomeEvent,
} from '@sanity/client'
import {type ReactNode} from 'react'
import {Observable, Subject} from 'rxjs'
import {AddonDatasetContext} from 'sanity/_singletons'
import {vi} from 'vitest'

import {type CommentDocument} from '../../../comments/types'
import {type AddonDatasetContextValue} from '../../../studio/addonDataset/types'
import {type TaskDocument} from '../../../tasks/types'
import {ResourceCacheProvider} from '../../ResourceCacheProvider'
import {type AddonDatasetDocument} from '../createAddonDatasetListenerStore'

export const WELCOME: WelcomeEvent = {type: 'welcome', listenerName: 'test'}

export function comment(
  _id: string,
  publishedId: string,
  fields: {documentVersionId?: string; parentCommentId?: string; status?: 'open' | 'resolved'} = {},
): CommentDocument {
  const {documentVersionId, parentCommentId, status = 'open'} = fields
  return {
    _type: 'comment',
    _id,
    _rev: `${_id}-rev`,
    _createdAt: '2026-01-01T00:00:00.000Z',
    authorId: 'user',
    message: null,
    threadId: parentCommentId ?? _id,
    ...(parentCommentId ? {parentCommentId} : {}),
    status,
    reactions: null,
    target: {
      documentType: 'article',
      document: {_type: 'reference', _ref: publishedId, _weak: true},
      ...(documentVersionId ? {documentVersionId} : {}),
    },
  }
}

export function task(_id: string, title = 'A task'): TaskDocument {
  return {
    _type: 'tasks.task',
    _id,
    _rev: `${_id}-rev`,
    _createdAt: '2026-01-01T00:00:00.000Z',
    _updatedAt: '2026-01-01T00:00:00.000Z',
    title,
    status: 'open',
    authorId: 'user',
  }
}

export function mutation(
  transition: 'appear' | 'update' | 'disappear',
  documentId: string,
  result?: AddonDatasetDocument,
  transactionId = 'tx',
): MutationEvent<AddonDatasetDocument> {
  return {
    type: 'mutation',
    documentId,
    eventId: `${documentId}#${transactionId}`,
    identity: 'user',
    mutations: [],
    previousRev: 'rev-0',
    resultRev: 'rev-1',
    timestamp: '2026-01-01T00:00:00.000Z',
    transactionId,
    transition,
    visibility: 'query',
    transactionTotalEvents: 1,
    transactionCurrentEvent: 1,
    ...(result ? {result: {...result, _updatedAt: '2026-01-01T00:00:00.000Z'}} : {}),
  }
}

/**
 * An addon dataset client whose listener connections are served by `server`, with the documents
 * its queries return, and a wrapper that provides it the way `AddonDatasetProvider` does.
 */
export function createAddonDatasetTestClient(documents: {
  comments?: CommentDocument[]
  tasks?: TaskDocument[]
}) {
  const client = createClient({
    projectId: 'abc',
    dataset: 'production-comments',
    apiVersion: '2024-08-27',
    useCdn: false,
  })
  const server = new Subject<ListenEvent<AddonDatasetDocument>>()
  const connections = {opened: 0}
  vi.spyOn(client.observable, 'listen').mockReturnValue(
    new Observable<ListenEvent<AddonDatasetDocument>>((subscriber) => {
      connections.opened += 1
      return server.subscribe(subscriber)
    }),
  )

  function fakeFetch(
    query: string,
    params?: {documentId?: string | null; documentVersionId?: string},
  ) {
    if (query.includes('"tasks.task"')) {
      return Promise.resolve(documents.tasks ?? [])
    }
    return Promise.resolve(
      (documents.comments ?? []).filter(
        (doc) =>
          doc.target.document._ref === params?.documentId &&
          doc.target.documentVersionId === params?.documentVersionId,
      ),
    )
  }
  const fetch = vi.spyOn(client, 'fetch').mockImplementation(fakeFetch as SanityClient['fetch'])

  const contextValue: AddonDatasetContextValue = {
    client,
    isCreatingDataset: false,
    createAddonDataset: () => Promise.resolve(client),
    ready: true,
    error: null,
  }
  function wrapper({children}: {children: ReactNode}) {
    return (
      <ResourceCacheProvider>
        <AddonDatasetContext.Provider value={contextValue}>{children}</AddonDatasetContext.Provider>
      </ResourceCacheProvider>
    )
  }

  return {client, server, connections, fetch, wrapper}
}
