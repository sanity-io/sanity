const Observable = require('@sanity/observable')
const createCache = require('./utils/createCache')
const canonicalize = require('./utils/canonicalize')
const Record = require('./Record')

const identity = val => val

module.exports = function createDocumentStore({serverConnection}) {
  const RECORDS_CACHE = createCache()

  const server = {
    byId: canonicalize(identity, serverConnection.byId),
    query: canonicalize(identity, serverConnection.query),
    update: serverConnection.update,
    delete: serverConnection.delete,
  }

  return {
    byId,
    byIds,
    query,
    create,
    update,
    delete: deleteDoc,
  }

  function update(documentId, patch) {
    if (RECORDS_CACHE.has(documentId)) {
      // Update the local cache if we have it
      // If we don't have it, that means nothing is interested in its state
      const record = RECORDS_CACHE.get(documentId)
      record.publish({type: 'mutation', origin: 'client', patch: patch})
    }
    return patch.local ? Observable.of({ok: true}) : server.update(documentId, patch)
  }

  function deleteDoc(documentId) {
    const record = RECORDS_CACHE.get(documentId)
    if (record) {
      record.publish({type: 'delete', origin: 'client'})
      RECORDS_CACHE.remove(documentId)
    }

    return server.delete(documentId)
  }

  function byId(documentId) {
    const record = RECORDS_CACHE.fetch(documentId, () => Record.create())

    return new Observable(observer => {
      const eventsSubscription = record.events.subscribe(observer)

      // Listen for changes in document on server
      const serverSubscription = server
        .byId(documentId)
        .subscribe(event => {
          record.publish(Object.assign({}, event, {origin: 'server'}))
        })

      return () => {
        eventsSubscription.unsubscribe()
        serverSubscription.unsubscribe()
      }
    })
  }

  function byIds(documentIds) {
    return new Observable(observer => {
      const documentSubscriptions = documentIds
        .map(id => byId(id).subscribe(observer))

      return () => {
        documentSubscriptions.map(subscription => subscription.unsubscribe())
      }
    })
  }

  function query(_query, params) {
    return Observable.from(serverConnection.query(_query, params))
  }

  function create(document) {
    return Observable.from(serverConnection.create(document))
  }
}
