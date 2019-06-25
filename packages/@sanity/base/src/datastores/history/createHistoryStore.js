import client from 'part:@sanity/base/client'
import {from, merge} from 'rxjs'
import {transactionsToEvents} from '@sanity/transaction-collator'
import {map, mergeMap, reduce, scan} from 'rxjs/operators'
import {getDraftId, getPublishedId} from '../../util/draftUtils'

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

const ndjsonToArray = ndjson => {
  return ndjson
    .toString('utf8')
    .split('\n')
    .filter(Boolean)
    .map(line => JSON.parse(line))
}

const getHistory = (documentIds, options = {}) => {
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

const getDocumentAtRevision = (documentId, revision) => {
  const cacheKey = `${documentId}@${revision}`
  if (!(cacheKey in documentRevisionCache)) {
    const dataset = client.clientConfig.dataset
    const url = `/data/history/${dataset}/documents/${documentId}?revision=${revision}`
    documentRevisionCache[cacheKey] = client.request({url}).then(result => result.documents[0])
  }

  return documentRevisionCache[cacheKey]
}

const getTransactions = documentIds => {
  const ids = Array.isArray(documentIds) ? documentIds : [documentIds]
  const dataset = client.clientConfig.dataset
  const url = `/data/history/${dataset}/transactions/${ids.join(',')}?excludeContent=true`
  return client.request({url}).then(ndjsonToArray)
}

function historyEventsFor(documentId) {
  const pairs = [getDraftId(documentId), getPublishedId(documentId)]

  const query = '*[_id in $documentIds]'

  const pastTransactions$ = from(getTransactions(pairs)).pipe(
    mergeMap(transactions => from(transactions)),
    map(trans => ({
      author: trans.author,
      documentIDs: pairs,
      id: trans.id,
      mutations: trans.mutations,
      timestamp: trans.timestamp
    })),
    reduce(compileTransactions, {})
  )

  const realtimeTransactions$ = client.observable.listen(query, {documentIds: pairs}).pipe(
    map(item => ({
      author: item.identity,
      documentIDs: pairs,
      id: item.transactionId,
      mutations: item.mutations,
      timestamp: item.timestamp
    })),
    scan(compileTransactions, {})
  )

  return merge(realtimeTransactions$, pastTransactions$).pipe(
    scan((prev, next) => {
      return {...prev, ...next}
    }, {}),
    map(transactions =>
      transactionsToEvents(pairs, Object.keys(transactions).map(key => transactions[key])).reverse()
    )
  )
}

export default function createHistoryStore() {
  return {
    getDocumentAtRevision,
    getHistory,
    getTransactions,
    historyEventsFor
  }
}
