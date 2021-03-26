import {from, merge} from 'rxjs'
// eslint-disable-next-line import/no-unresolved
import {transactionsToEvents} from '@sanity/transaction-collator'
import {map, mergeMap, reduce, scan} from 'rxjs/operators'
import {omit, isUndefined} from 'lodash'
import jsonReduce from 'json-reduce'
import {getDraftId, getPublishedId} from '../../util/draftUtils'
import {versionedClient} from '../../client/versionedClient'

const documentRevisionCache = Object.create(null)

const compileTransactions = (acc, curr) => {
  if (acc[curr.id]) {
    acc[curr.id].mutations = acc[curr.id].mutations.concat(curr.mutations)
    acc[curr.id].timestamp = curr.timestamp
  } else {
    acc[curr.id] = curr
  }
  return acc
}

const ndjsonToArray = (ndjson) => {
  return ndjson
    .toString('utf8')
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line))
}

type HistoryTransaction = any

const getHistory = (documentIds, options: {time?: number; revision?: string} = {}) => {
  const ids = Array.isArray(documentIds) ? documentIds : [documentIds]
  const {time, revision} = options

  if (time && revision) {
    throw new Error(`getHistory can't handle both time and revision parameters`)
  }

  const dataset = versionedClient.clientConfig.dataset
  let url = `/data/history/${dataset}/documents/${ids.join(',')}`

  if (revision) {
    url = `${url}?revision=${revision}`
  } else {
    const timestamp = time || new Date().toISOString()
    url = `${url}?time=${timestamp}`
  }

  return versionedClient.request({url})
}

const getDocumentAtRevision = (documentId, revision) => {
  const publishedId = getPublishedId(documentId)
  const draftId = getDraftId(documentId)

  const cacheKey = `${publishedId}@${revision}`
  if (!(cacheKey in documentRevisionCache)) {
    const dataset = versionedClient.clientConfig.dataset
    const url = `/data/history/${dataset}/documents/${publishedId},${draftId}?revision=${revision}`
    documentRevisionCache[cacheKey] = versionedClient.request({url}).then(({documents}) => {
      const published = documents.find((res) => res._id === publishedId)
      const draft = documents.find((res) => res._id === draftId)
      return draft || published
    })
  }

  return documentRevisionCache[cacheKey]
}

const getTransactions = (documentIds) => {
  const ids = Array.isArray(documentIds) ? documentIds : [documentIds]
  const dataset = versionedClient.clientConfig.dataset
  const url = `/data/history/${dataset}/transactions/${ids.join(',')}?excludeContent=true`
  return versionedClient.request({url}).then(ndjsonToArray)
}

function historyEventsFor(documentId) {
  const pairs = [getDraftId(documentId), getPublishedId(documentId)]

  const query = '*[_id in $documentIds]'

  const pastTransactions$ = from(getTransactions(pairs)).pipe(
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

  const realtimeTransactions$ = versionedClient.observable.listen(query, {documentIds: pairs}).pipe(
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
    map((transactions) =>
      transactionsToEvents(
        pairs,
        Object.keys(transactions).map((key) => transactions[key])
      ).reverse()
    )
  )
}

const getAllRefIds = (doc) =>
  jsonReduce(
    doc,
    (acc, node) =>
      node && typeof node === 'object' && '_ref' in node && !acc.includes(node._ref)
        ? [...acc, node._ref]
        : acc,
    []
  )

function jsonMap(value, mapFn) {
  if (Array.isArray(value)) {
    return mapFn(value.map((item) => jsonMap(item, mapFn)).filter((item) => !isUndefined(item)))
  }

  if (value && typeof value === 'object') {
    return mapFn(
      Object.keys(value).reduce((res, key) => {
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

const mapRefNodes = (doc, mapFn) =>
  jsonMap(doc, (node) => {
    return node && typeof node === 'object' && typeof node._ref === 'string' ? mapFn(node) : node
  })

export const removeMissingReferences = (doc, existingIds) =>
  mapRefNodes(doc, (refNode) => {
    const documentExists = existingIds[refNode._ref]
    return documentExists ? refNode : undefined
  })

function restore(id, targetId, rev) {
  return from(getDocumentAtRevision(id, rev)).pipe(
    mergeMap((documentAtRevision) => {
      const existingIdsQuery = getAllRefIds(documentAtRevision)
        .map((refId) => `"${refId}": defined(*[_id=="${refId}"]._id)`)
        .join(',')

      return versionedClient.observable
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
      versionedClient.observable.transaction().createOrReplace(restoredDraft).commit()
    )
  )
}

export default function createHistoryStore() {
  return {
    getDocumentAtRevision,
    getHistory,
    getTransactions,
    historyEventsFor,
    restore,
  }
}
