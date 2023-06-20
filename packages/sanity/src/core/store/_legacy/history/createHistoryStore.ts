import type {SanityClient} from '@sanity/client'
import {
  isReference,
  Reference,
  SanityDocument,
  TransactionLogEventWithMutations,
} from '@sanity/types'
import {reduce as jsonReduce} from 'json-reduce'
import {from, Observable} from 'rxjs'
import {map, mergeMap} from 'rxjs/operators'
import {isDev} from '../../../environment'
import {getDraftId, getPublishedId, isRecord} from '../../../util'
import {Timeline, TimelineController} from './history'

/**
 * @hidden
 * @beta */
export interface HistoryStore {
  getDocumentAtRevision: (
    documentId: string,
    revision: string
  ) => Promise<SanityDocument | undefined>

  getHistory: (
    documentIds: string[],
    options?: {time?: string; revision?: string}
  ) => Promise<{documents: SanityDocument[]}>

  getTransactions: (documentIds: string[]) => Promise<TransactionLogEventWithMutations[]>

  restore: (id: string, targetId: string, rev: string) => Observable<SanityDocument>

  /** @internal */
  getTimelineController: (options: {
    client: SanityClient
    documentId: string
    documentType: string
  }) => TimelineController
}

const documentRevisionCache: Record<string, Promise<SanityDocument | undefined> | undefined> =
  Object.create(null)

const getHistory = (
  client: SanityClient,
  documentIds: string[],
  options: {time?: string; revision?: string} = {}
): Promise<{documents: SanityDocument[]}> => {
  const ids = Array.isArray(documentIds) ? documentIds : [documentIds]
  const {time, revision} = options

  if (time && revision) {
    throw new Error(`getHistory can't handle both time and revision parameters`)
  }

  const dataset = client.config().dataset
  let url = `/data/history/${dataset}/documents/${ids.join(',')}`

  if (revision) {
    url = `${url}?revision=${revision}`
  } else {
    const timestamp = time || new Date().toISOString()

    url = `${url}?time=${timestamp}`
  }

  return client.request({url})
}

const getDocumentAtRevision = (
  client: SanityClient,
  documentId: string,
  revision: string
): Promise<SanityDocument | undefined> => {
  const publishedId = getPublishedId(documentId)
  const draftId = getDraftId(documentId)
  const cacheKey = `${publishedId}@${revision}`
  const cached = documentRevisionCache[cacheKey]
  if (cached) {
    return cached
  }

  const dataset = client.config().dataset
  const url = `/data/history/${dataset}/documents/${publishedId},${draftId}?revision=${revision}`

  const entry = client.request<{documents?: SanityDocument[]}>({url}).then((result) => {
    const documents = result.documents || []
    const published = documents.find((res) => res._id === publishedId)
    const draft = documents.find((res) => res._id === draftId)
    return draft || published
  })

  documentRevisionCache[cacheKey] = entry
  return entry
}

const getTimelineController = ({
  client,
  documentId,
  documentType,
}: {
  client: SanityClient
  documentId: string
  documentType: string
}): TimelineController => {
  const timeline = new Timeline({
    enableTrace: isDev,
    publishedId: documentId,
  })
  return new TimelineController({
    client,
    documentId,
    documentType,
    timeline,
  })
}

const getTransactions = async (
  client: SanityClient,
  documentIds: string | string[]
): Promise<TransactionLogEventWithMutations[]> => {
  const ids = Array.isArray(documentIds) ? documentIds : [documentIds]
  const dataset = client.config().dataset
  const query = {excludeContent: 'true', includeIdentifiedDocumentsOnly: 'true'}
  const url = `/data/history/${dataset}/transactions/${ids.join(',')}`
  const result = await client.request({url, query})
  const transactions = result
    .toString('utf8')
    .split('\n')
    .filter(Boolean)
    .map((line: string) => JSON.parse(line))

  return transactions
}

const getAllRefIds = (doc: SanityDocument): string[] =>
  jsonReduce(
    doc as any,
    (acc: any, node) => (isReference(node) && !acc.includes(node._ref) ? [...acc, node._ref] : acc),
    []
  )

function jsonMap(value: unknown, mapFn: any): any {
  if (Array.isArray(value)) {
    return mapFn(
      value.map((item) => jsonMap(item, mapFn)).filter((item) => typeof item !== 'undefined')
    )
  }

  if (isRecord(value)) {
    return mapFn(
      Object.keys(value).reduce<Record<string, unknown>>((res, key) => {
        const mappedValue = jsonMap(value[key], mapFn)
        if (typeof mappedValue !== 'undefined') {
          res[key] = mappedValue
        }

        return res
      }, {})
    )
  }

  return mapFn(value)
}

const mapRefNodes = (doc: SanityDocument, mapFn: (node: Reference) => Reference | undefined) =>
  jsonMap(doc, (node: unknown) => (isReference(node) ? mapFn(node) : node))

/** @internal */
export const removeMissingReferences = (
  doc: SanityDocument,
  existingIds: Record<string, boolean | undefined>
): SanityDocument =>
  mapRefNodes(doc, (refNode) => {
    const documentExists = existingIds[refNode._ref]
    return documentExists ? refNode : undefined
  })

function restore(client: SanityClient, documentId: string, targetDocumentId: string, rev: string) {
  return from(getDocumentAtRevision(client, documentId, rev)).pipe(
    mergeMap((documentAtRevision) => {
      if (!documentAtRevision) {
        throw new Error(`Unable to find document with ID ${documentId} at revision ${rev}`)
      }

      const existingIdsQuery = getAllRefIds(documentAtRevision)
        .map((refId) => `"${refId}": defined(*[_id=="${refId}"]._id)`)
        .join(',')

      return client.observable
        .fetch<Record<string, boolean | undefined>>(`{${existingIdsQuery}}`)
        .pipe(map((existingIds) => removeMissingReferences(documentAtRevision, existingIds)))
    }),
    map((documentAtRevision) => {
      // Remove _updatedAt and create a new draft from the document at given revision
      const {_updatedAt, ...document} = documentAtRevision
      return {...document, _id: targetDocumentId}
    }),
    mergeMap((restoredDraft) =>
      client.observable.createOrReplace(restoredDraft, {visibility: 'async'})
    )
  )
}

/** @internal */
export interface HistoryStoreOptions {
  client: SanityClient
}

/** @internal */
export function createHistoryStore({client}: HistoryStoreOptions): HistoryStore {
  return {
    getDocumentAtRevision: (documentId, revision) =>
      getDocumentAtRevision(client, documentId, revision),

    getHistory: (documentIds, options) => getHistory(client, documentIds, options),

    getTransactions: (documentIds) => getTransactions(client, documentIds),

    restore: (id, targetId, rev) => restore(client, id, targetId, rev),

    getTimelineController,
  }
}
