const Observable = require('@sanity/observable')
const debug = require('../../src/utils/debug')
const fromPromise = require('../../src/utils/fromPromise')
const db = require('./db')

function byId(documentId) {
  debug('Server is "fetching" document with id %s', documentId)
  const record = db.getRecord(documentId)
  return new Observable(observer => {
    observer.next({
      type: 'snapshot',
      document: record.snapshot
    })
    return record.events.subscribe(event => observer.next(event))
  })
}

function query(q) {
  debug(`setting up subscription for query "${q}"`)
  return new Observable(observer => {
    const records = db.getAllRecords()
    const snapshots = records.map(record => record.snapshot)
    observer.next({
      type: 'snapshot',
      query: q,
      results: snapshots
    })
    const subscriptions = records.map(record => {
      return record.events.subscribe(event => observer.next(event))
    })
    return () => subscriptions.map(subscription => subscription.unsubscribe())
  })
}

function update(documentId, mutation) {
  return fromPromise(db.updateRecord(documentId, mutation))
}

function create(document) {
  return fromPromise(db.createRecord(document))
}

module.exports = {
  byId,
  update,
  query,
  create
}
