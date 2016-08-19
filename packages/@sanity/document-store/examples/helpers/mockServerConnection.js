const {Observable} = require('rxjs')
const {range} = require('lodash')
const createEvent = require('../../src/utils/createEvent')
const debug = require('../../src/utils/debug')

function update(documentId, patch) {
  // Send update to server
  return Observable.of({ok: true}).delay(200)
}

function byId(documentId) {
  return Observable.of({
    type: 'snapshot',
    documentId: documentId,
    document: {
      title: 'Some title',
      body: 'Some body',
    }
  })
    // .merge(Observable.interval(2000).map(n => {
    //   return {
    //     type: 'update',
    //     patch: {
    //       body: {
    //         $set: `Updated body ${n} ${(1.111111111 / (n + 1)).toString(32).substring(2)} (Seq id: ${n})`
    //       }
    //     },
    //   }
    // }))
}

const docs = range(100).map(n => ({id: String(n)}))
function query(query) {
  debug(`setting up subscription for query "${query}"`)
  return new Observable(observer => {
    let limit = 4
    const subscription = Observable
      .of(createEvent('snapshot', {
        query: query,
        results: docs.slice(0, limit + limit)
      }))
      .merge(
        Observable.interval(500)
          .map(n => {
            return createEvent('add', {
              query: query,
              items: docs.slice(limit * n, limit + limit * n)
            })
          }))
      .subscribe(observer)

    return () => {
      debug(`tearing down subscription for query "${query}"`)
      subscription.unsubscribe()
    }
  })
}

module.exports = {
  byId,
  update,
  query
}