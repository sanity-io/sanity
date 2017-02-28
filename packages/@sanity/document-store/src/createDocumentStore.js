const Observable = require('@sanity/observable')
const createCache = require('./utils/createCache')
const canonicalize = require('./utils/canonicalize')
const omit = require('lodash/omit')
const {BufferedDocument, Mutation} = require('@sanity/mutator')

function TODO(msg = 'TODO') {
  return function todo() {
    throw new Error(msg)
  }
}
const NOOP = () => {
}

function createBufferedDocument(documentId, server) {

  const serverEvents$ = Observable.from(server.byId(documentId)).share()
  const bufferedDocs$ = serverEvents$
    .first(event => event.type === 'snapshot')
    .map(event => event.document)
    .map(snapshot => {
      const bufferedDocument = new BufferedDocument(snapshot)

      serverEvents$
        .filter(event => event.type === 'mutation')
        .map(event => bufferedDocument.arrive(new Mutation(event)))

      bufferedDocument.commitHandler = function commitHandler(opts) {
        const payload = opts.mutation.params

        // TODO:
        // right now the BufferedDocument just commits fire-and-forget-ish
        // We should be able to handle failures and retry here

        server.mutate(omit(payload, 'resultRev'))
          .subscribe({
            next: opts.success,
            error: opts.failure
          })
      }

      const rebase$ = new Observable(rebaseObserver => {
        bufferedDocument.onRebase = edge => {
          rebaseObserver.next({type: 'rebase', document: edge})
        }
        return () => {
          bufferedDocument.onRebase = NOOP
        }
      }).share()

      const mutation$ = new Observable(mutationObserver => {
        bufferedDocument.onMutation = ({mutation, remote}) => {
          mutationObserver.next({
            type: 'mutation',
            document: bufferedDocument.LOCAL,
            mutations: mutation.mutations,
            origin: remote ? 'remote' : 'local'
          })
        }
        return () => {
          bufferedDocument.onMutation = NOOP
        }
      }).share()

      return {
        events: new Observable(observer => {
          observer.next({type: 'snapshot', document: bufferedDocument.LOCAL})
          return mutation$
            .merge(rebase$)
            .subscribe(observer)
        }),
        patch(patches) {
          const mutations = patches
            .map(patch => Object.assign({}, patch, {id: documentId}))
            .map(patch => ({patch: patch}))

          bufferedDocument.add(new Mutation({mutations: mutations}))
        },
        create(document) {
          const mutation = {
            create: Object.assign({id: documentId}, document)
          }
          bufferedDocument.add(new Mutation({mutations: [mutation]}))
        },
        delete() {
          bufferedDocument.add(new Mutation({mutations: [{delete: {id: documentId}}]}))
        },
        commit() {
          return new Observable(observer => {
            // todo: connect observable with request from bufferedDocument.commit somehow
            bufferedDocument.commit()
            observer.next()
            observer.complete()
          })
        }
      }
    })
    .share()

  let current
  function getCurrent() {
    if (current) {
      return Observable.of(current)
    }
    return bufferedDocs$.first().do(next => {
      current = next
    })
  }

  return {
    events: getCurrent().mergeMap(bufferedDoc => bufferedDoc.events),
    patch(patches) {
      getCurrent().subscribe(bufferedDoc => bufferedDoc.patch(patches))
    },
    create(document) {
      return getCurrent().mergeMap(bufferedDoc => bufferedDoc.create(document))
    },
    delete() {
      return getCurrent().mergeMap(bufferedDoc => bufferedDoc.delete())
    },
    commit() {
      return getCurrent().mergeMap(bufferedDoc => bufferedDoc.commit())
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
