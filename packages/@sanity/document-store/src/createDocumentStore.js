const Observable = require('@sanity/observable')
const createCache = require('./utils/createCache')
const canonicalize = require('./utils/canonicalize')
const omit = require('lodash/omit')
const pubsub = require('nano-pubsub')
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
  const events = pubsub()
  let _bufferedDocument = null
  let whenBufferedDocumentReady = defer()

  function reset() {
    _bufferedDocument = null
    whenBufferedDocumentReady = defer()
  }

  function withBufferedDocument(fn) {
    if (_bufferedDocument) {
      fn(_bufferedDocument)
    } else {
      whenBufferedDocumentReady.promise.then(() => fn(_bufferedDocument))
    }
  }

  // todo refcount/dispose
  const subscription = server.byId(documentId).subscribe({
    next: event => {
      if (event.type === 'snapshot') {
        onSnapshot(event)
      } else if (event.type === 'mutation') {
        onMutation(new Mutation(event))
      } else {
        console.warn('Ignoring unknown event type %s', event.type)
      }
    },
    error: reset
  })

  function onSnapshot(event) {
    _bufferedDocument = new BufferedDocument(event.document)

    _bufferedDocument.onRebase = edge => {
      events.publish({type: 'rebase', document: edge})
    }

    _bufferedDocument.onMutation = ({mutation, remote}) => {
      events.publish({
        type: 'mutate',
        document: _bufferedDocument.LOCAL,
        mutations: mutation.mutations,
        origin: remote ? 'remote' : 'local'
      })
    }

    _bufferedDocument.commitHandler = opts => {
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
    whenBufferedDocumentReady.resolve()
  }

  function onMutation(event) {
    _bufferedDocument.arrive(new Mutation(event))
  }

  return {
    events: new Observable(observer => {
      withBufferedDocument(bufferedDocument => {
        observer.next({type: 'snapshot', document: bufferedDocument.LOCAL})
        events.subscribe(ev => observer.next(ev))
      })
    }),
    patch(patches) {
      const mutations = patches
        .map(patch => Object.assign({}, patch, {id: documentId}))
        .map(patch => ({patch: patch}))

      withBufferedDocument(bufferedDocument => {
        bufferedDocument.add(new Mutation({mutations: mutations}))
      })
    },
    create(document) {
      const mutation = {
        create: Object.assign({id: documentId}, document)
      }
      withBufferedDocument(bufferedDocument => {
        bufferedDocument.add(new Mutation({mutations: [mutation]}))
      })
    },
    delete() {
      withBufferedDocument(bufferedDocument => {
        bufferedDocument.add(new Mutation({mutations: [{delete: {id: documentId}}]}))
      })
    },
    commit() {
      return new Observable(observer => {
        withBufferedDocument(bufferedDocument => {
          // todo: connect with bufferedDocument.commit
          bufferedDocument.commit()
          observer.next()
          observer.complete()
        })
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
