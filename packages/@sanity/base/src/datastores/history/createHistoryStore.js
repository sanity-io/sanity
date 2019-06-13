import client from 'part:@sanity/base/client'
import {from, merge} from 'rxjs'
import {map, scan, reduce, mergeMap} from 'rxjs/operators'
import {transactionsToEvents} from '@sanity/transaction-collator'

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

const getTransactions = documentIds => {
  const ids = Array.isArray(documentIds) ? documentIds : [documentIds]
  const dataset = client.clientConfig.dataset
  const url = `/data/history/${dataset}/transactions/${ids.join(',')}`
  return client.request({url}).then(ndjsonToArray)
}

const eventStreamer$ = documentIds => {
  const query = '*[_id in $documentIds]'
  const params = {documentIds: documentIds}

  const pastTransactions$ = from(getTransactions(documentIds)).pipe(
    mergeMap(transactions => from(transactions)),
    map(trans => ({
      author: trans.author,
      documentIDs: documentIds,
      id: trans.id,
      mutations: trans.mutations,
      timestamp: trans.timestamp
    })),
    reduce(compileTransactions, {})
  )

  const realtimeTransactions$ = client.observable.listen(query, params).pipe(
    map(item => ({
      author: item.identity,
      documentIDs: documentIds,
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
      transactionsToEvents(
        documentIds,
        Object.keys(transactions).map(key => transactions[key])
      ).reverse()
    )
  )
}

export default function createHistoryStore() {
  return {
    getHistory,
    getTransactions,
    eventStreamer$
  }
}
