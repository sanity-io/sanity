const {Observable} = require('rxjs')
const debug = require('../../src/utils/debug')
const db = require('./db')

function byId(documentId) {
  const record = db.getRecord(documentId)
  return Observable.of({
    type: 'snapshot',
    document: record.snapshot
  })
    .merge(new Observable(observer => {
      return record.events.subscribe(event => {
        observer.next(event)
      })
    }))
}

function query(q) {
  debug(`setting up subscription for query "${q}"`)
  const records = db.getAllRecords()
  const snapshots = records.map(record => record.snapshot)
  return Observable
    .of({
      type: 'snapshot',
      query: q,
      results: snapshots
    })
    .merge(
      new Observable(observer => {
        const unsubscribers = records.map(record => {
          return record.events.subscribe(event => observer.next(event))
        })
        return () => unsubscribers.map(unsub => unsub())
      }))
}

function update(documentId, mutation) {
  return Observable.fromPromise(db.updateRecord(documentId, mutation))
}
function create(document) {
  return Observable.fromPromise(db.createRecord(document))
}

module.exports = {
  byId,
  update,
  query,
  create
}
