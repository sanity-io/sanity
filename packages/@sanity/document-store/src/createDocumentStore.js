const Observable = require('@sanity/observable')
const createCache = require('./utils/createCache')
const canonicalize = require('./utils/canonicalize')
const omit = require('lodash/omit')
const pubsub = require('nano-pubsub')
const assert = require('assert')
const {BufferedDocument, Mutation} = require('@sanity/mutator')

function TODO(msg = 'TODO') {
  return function todo() {
    throw new Error(msg)
  }
}

function defer() {
  const deferred = {}
  deferred.promise = new Promise((resolve, reject) => {
    deferred.resolve = resolve
    deferred.reject = reject
  })
  return deferred
}

function createBufferedDocument(documentId, server) {
  let bufferedDocument = null
  const events = pubsub()

  const bufferedDocumentReady = defer()

  // todo refcount/dispose
  const subscription = server.byId(documentId)
    .subscribe(event => {
      if (event.type === 'snapshot') {
        assert(bufferedDocument === null, 'Expected bufferedDocument to be null when receiving snapshot')
        bufferedDocument = new BufferedDocument(event.document)

        bufferedDocument.onRebase = edge => {
          events.publish({type: 'rebase', document: edge})
        }

        bufferedDocument.onMutation = ({mutation, remote}) => {
          events.publish({
            type: 'mutate',
            document: bufferedDocument.LOCAL,
            mutations: mutation.mutations,
            origin: remote ? 'remote' : 'local'
          })
        }

        bufferedDocument.commitHandler = opts => {
          const payload = opts.mutation.params

          // TODO:
          // right now the BufferedDocument just commits fire-and-forget-ish
          // We should be able to handle failures and retry here

          return server.mutate(omit(payload, 'resultRev'))
            .subscribe({
              next: opts.success,
              error: opts.failure
            })
        }
        bufferedDocumentReady.resolve(bufferedDocument)
      } else {
        bufferedDocument.arrive(new Mutation(event))
      }
    })

  return {
    events: new Observable(observer => {
      bufferedDocumentReady.promise.then(bd => {
        observer.next({type: 'snapshot', document: bd.LOCAL})
        events.subscribe(ev => observer.next(ev))
      })
    }),
    patch(patches) {
      const mutations = patches
        .map(patch => Object.assign({}, patch, {id: documentId}))
        .map(patch => ({patch: patch}))

      if (bufferedDocument) {
        // important: this must be sync, or else cursors in input fields gets wonky
        addMutations(bufferedDocument)
      } else {
        bufferedDocumentReady.promise.then(addMutations)
      }
      function addMutations(bufferedDocument) {
        bufferedDocument.add(new Mutation({mutations: mutations}))
      }
    },
    commit() {
      return Observable
        .from(bufferedDocumentReady.promise)
        // .flatMap(bd => bd.commit()) // todo: flatmap
        .map(bd => bd.commit())
    },
    delete() {
      bufferedDocumentReady.promise.then(bd => {
        bd.add(new Mutation({delete: {id: documentId}}))
      })
    }
  }
}

const identity = val => val

module.exports = function createDocumentStore({serverConnection}) {

  const RECORDS_CACHE = createCache()

  const server = {
    byId: canonicalize(identity, serverConnection.byId),
    query: canonicalize(identity, serverConnection.query),
    mutate: serverConnection.mutate,
    delete: serverConnection.delete,
  }

  return {
    byId,
    byIds,
    query,
    create,
    checkout,
    patch: patchDoc,
    delete: deleteDoc,
    createOrReplace: TODO('Not implemented yet'),
    createIfNotExists: TODO('Not implemented yet'),
  }

  function patchDoc(documentId, patches) {
    return checkout(documentId)
      .patch(patches)
      .commit()
  }

  function deleteDoc(documentId) {
    return checkout(documentId)
      .delete()
      .commit()
  }

  function byId(documentId) {
    return checkout(documentId).events
  }

  function checkout(documentId) {
    return RECORDS_CACHE.fetch(documentId, () => createBufferedDocument(documentId, server))
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
