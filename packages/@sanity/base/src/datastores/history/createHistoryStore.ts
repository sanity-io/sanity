import {MultipleMutationResult, SanityClient} from '@sanity/client'
import {HistoryEvent, transactionsToEvents} from '@sanity/transaction-collator'
import {SanityDocument} from '@sanity/types'
import jsonReduce from 'json-reduce'
import {omit, isUndefined} from 'lodash'
import {from, merge, Observable} from 'rxjs'
import {map, mergeMap, reduce, scan} from 'rxjs/operators'
import {getDraftId, getPublishedId} from '../../util'
import {Timeline, TimelineController, createObservableController} from './history'

export interface HistoryStore {
  getDocumentAtRevision: (documentId: string, revision: string) => any
  getHistory: (
    documentIds: string[],
    options?: {time?: string; revision?: string}
  ) => Promise<{documents: SanityDocument[]}>
  getTransactions: (documentIds: string[]) => Promise<any>
  historyEventsFor: (documentId: string) => Observable<HistoryEvent[]>
  restore: (id: string, targetId: string, rev: string) => Observable<MultipleMutationResult>

  getTimeline: (options: {publishedId: string; enableTrace?: boolean}) => Timeline
  getTimelineController: (options: {
    client: SanityClient
    documentId: string
    documentType: string
    timeline: Timeline
  }) => Observable<{historyController: TimelineController}>
}

type HistoryTransaction = any

const documentRevisionCache = Object.create(null)

const compileTransactions = (acc: any, curr: Record<string, any>) => {
  if (acc[curr.id]) {
    acc[curr.id].mutations = acc[curr.id].mutations.concat(curr.mutations)
    acc[curr.id].timestamp = curr.timestamp
  } else {
    acc[curr.id] = curr
  }
  return acc
}

const ndjsonToArray = (ndjson: any) => {
  return ndjson
    .toString('utf8')
    .split('\n')
    .filter(Boolean)
    .map((line: string) => JSON.parse(line))
}

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

  const dataset = client.clientConfig.dataset
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
): Promise<SanityDocument> => {
  const publishedId = getPublishedId(documentId)
  const draftId = getDraftId(documentId)
  const cacheKey = `${publishedId}@${revision}`

  if (!(cacheKey in documentRevisionCache)) {
    const dataset = client.clientConfig.dataset
    const url = `/data/history/${dataset}/documents/${publishedId},${draftId}?revision=${revision}`

    documentRevisionCache[cacheKey] = client
      .request({url})
      .then(({documents}: {documents: SanityDocument[]}) => {
        const published = documents.find((res) => res._id === publishedId)
        const draft = documents.find((res) => res._id === draftId)
        return draft || published
      })
  }

  return documentRevisionCache[cacheKey]
}

const getTransactions = async (client: SanityClient, documentIds: string | string[]) => {
  const ids = Array.isArray(documentIds) ? documentIds : [documentIds]
  const dataset = client.clientConfig.dataset
  const url = `/data/history/${dataset}/transactions/${ids.join(',')}?excludeContent=true`
  const result = await client.request({url})

  return ndjsonToArray(result)
}

function historyEventsFor(client: SanityClient, documentId: string) {
  const pairs = [getDraftId(documentId), getPublishedId(documentId)]

  const query = '*[_id in $documentIds]'

  const pastTransactions$ = from(getTransactions(client, pairs)).pipe(
    mergeMap((transactions) => from(transactions)),
    map((trans: HistoryTransaction) => ({
      author: trans.author,
      documentIDs: pairs,
      id: trans.id,
      mutations: trans.mutations,
      timestamp: trans.timestamp,
    })),
    reduce(compileTransactions, {})
  )

  const realtimeTransactions$ = client.observable.listen(query, {documentIds: pairs}).pipe(
    map((item) => ({
      author: item.identity,
      documentIDs: pairs,
      id: item.transactionId,
      mutations: item.mutations,
      timestamp: item.timestamp,
    })),
    scan(compileTransactions, {})
  )

  return merge(realtimeTransactions$, pastTransactions$).pipe(
    scan((prev, next) => {
      return {...prev, ...next}
    }, {}),
    map((transactions: any) =>
      transactionsToEvents(
        pairs,
        Object.keys(transactions).map((key) => transactions[key])
      ).reverse()
    )
  )
}

const getAllRefIds = (doc: SanityDocument): string[] =>
  jsonReduce(
    doc as any,
    (acc: any, node) =>
      node && typeof node === 'object' && '_ref' in node && !acc.includes(node._ref)
        ? [...acc, node._ref]
        : acc,
    []
  )

function jsonMap(value: any, mapFn: any): any {
  if (Array.isArray(value)) {
    return mapFn(value.map((item) => jsonMap(item, mapFn)).filter((item) => !isUndefined(item)))
  }

  if (value && typeof value === 'object') {
    return mapFn(
      Object.keys(value).reduce<Record<string, unknown>>((res, key) => {
        const mappedValue = jsonMap(value[key], mapFn)
        if (!isUndefined(mappedValue)) {
          res[key] = mappedValue
        }

        return res
      }, {})
    )
  }

  return mapFn(value)
}

const mapRefNodes = (doc: SanityDocument, mapFn: (node: any) => any) =>
  jsonMap(doc, (node: any) => {
    return node && typeof node === 'object' && typeof node._ref === 'string' ? mapFn(node) : node
  })

export const removeMissingReferences = (doc: SanityDocument, existingIds: Record<string, string>) =>
  mapRefNodes(doc, (refNode) => {
    const documentExists = existingIds[refNode._ref]
    return documentExists ? refNode : undefined
  })

function restore(client: SanityClient, id: string, targetId: string, rev: string) {
  return from(getDocumentAtRevision(client, id, rev)).pipe(
    mergeMap((documentAtRevision) => {
      const existingIdsQuery = getAllRefIds(documentAtRevision)
        .map((refId) => `"${refId}": defined(*[_id=="${refId}"]._id)`)
        .join(',')

      return client.observable
        .fetch(`{${existingIdsQuery}}`)
        .pipe(map((existingIds) => removeMissingReferences(documentAtRevision, existingIds)))
    }),
    map((documentAtRevision) =>
      // Remove _updatedAt and create a new draft from the document at given revision
      ({
        ...omit(documentAtRevision, '_updatedAt'),
        _id: targetId,
      })
    ),
    mergeMap((restoredDraft: any) =>
      client.observable.transaction().createOrReplace(restoredDraft).commit()
    )
  )
}

export interface HistoryStoreOptions {
  client: SanityClient
}

export function createHistoryStore({client}: HistoryStoreOptions): HistoryStore {
  return {
    getDocumentAtRevision(documentId, revision) {
      return getDocumentAtRevision(client, documentId, revision)
    },
    getHistory: (documentIds, options) => getHistory(client, documentIds, options),
    getTransactions: (documentIds) => getTransactions(client, documentIds),
    historyEventsFor: (documentId) => historyEventsFor(client, documentId),
    restore: (id, targetId, rev) => restore(client, id, targetId, rev),

    getTimeline(options: {publishedId: string; enableTrace?: boolean}) {
      return new Timeline(options)
    },

    getTimelineController(options: {
      client: SanityClient
      documentId: string
      documentType: string
      timeline: Timeline
    }) {
      return createObservableController(options)
    },
  }
}
