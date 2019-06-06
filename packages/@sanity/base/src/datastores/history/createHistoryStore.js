import client from 'part:@sanity/base/client'
import {from, merge} from 'rxjs'
import {transactionsToEvents} from '@sanity/transaction-collator'
import {map, scan, reduce, mergeMap, tap} from 'rxjs/operators'

const compileTransactions = (acc, curr) => {
  if (acc[curr.id]) {
    acc[curr.id].mutations = acc[curr.id].mutations.concat(curr.mutations)
    acc[curr.id].timestamp = curr.timestamp
  } else {
    acc[curr.id] = curr
  }
  return acc
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
  const pastTransactions$ = from(getTransactions([documentIds])).pipe(
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
        documentIds[0],
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

export function ndjsonToArray(ndjson) {
  return ndjson
    .toString('utf8')
    .split('\n')
    .filter(Boolean)
    .map(line => JSON.parse(line))
}

// setupListener = () => {
//   const {documentId} = this.props
//   const query = '*[_id in [$documentId, $draftId]]'
//   const params = {documentId, draftId: `drafts.${documentId}`}
//   HistoryStore.getTransactions([documentId, `drafts.${documentId}`]).then(
//     previousTransactions => {
//       const oldEvents = transactionsToEvents(documentId, previousTransactions).reverse()
//       this.setState({events: oldEvents, selectedRev: oldEvents[0].rev})

//       this.mutationListener$ = client.observable.listen(query, params).subscribe(item => {
//         console.log(item)
//         this.setState((prevState, props) => {
//           const events = transactionsToEvents(
//             documentId,
//             `${previousTransactions}\n${JSON.stringify(listenerItemToTransaction(item))}`
//           ).reverse()
//           return {
//             events,
//             selectedRev: events[0].rev
//           }
//         })
//       })
//     }
//   )
// }
