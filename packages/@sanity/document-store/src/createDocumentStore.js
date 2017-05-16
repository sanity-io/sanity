import Observable from '@sanity/observable'
import {omit} from 'lodash'
import pubsub from 'nano-pubsub'
import {BufferedDocument, Mutation} from '@sanity/mutator'

const NOOP = () => {}

function createBufferedDocument(documentId, server) {

  const serverEvents$ = Observable.from(server.byId(documentId)).share()
  const saves = pubsub()

  const bufferedDocs$ = serverEvents$
    .filter(event => event.type === 'snapshot')
    .map(event => event.document)
    .map(snapshot => {
      const bufferedDocument = new BufferedDocument(snapshot || null)

      bufferedDocument.commitHandler = function commitHandler(opts) {
        const payload = opts.mutation.params

        // TODO:
        // right now the BufferedDocument just commits fire-and-forget-ish
        // We should be able to handle failures and retry here

        server.mutate(omit(payload, 'resultRev'))
          .subscribe({
            next: res => {
              opts.success(res)
              saves.publish()
            },
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

        const serverMutations = serverEvents$
          .filter(event => event.type === 'mutation')
          // .do(event => {
          //   console.log('server event arrived', event)
          // })
          .subscribe(event => bufferedDocument.arrive(new Mutation(event)))

        return () => {
          serverMutations.unsubscribe()
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
        createIfNotExists(document) {
          bufferedDocument.add(new Mutation({mutations: [{createIfNotExists: document}]}))
        },
        createOrReplace(document) {
          bufferedDocument.add(new Mutation({mutations: [{createOrReplace: document}]}))
        },
        delete() {
          bufferedDocument.add(new Mutation({mutations: [{delete: {id: documentId}}]}))
        },
        commit() {
          return new Observable(observer => {
            // todo: connect observable with request from bufferedDocument.commit somehow
            bufferedDocument.commit()
            return saves.subscribe(() => {
              observer.next()
              observer.complete()
            })
          })
        }
      }
    })
    .share()

  let currentBuffered
  const cachedBuffered = new Observable(observer => {
    if (currentBuffered) {
      observer.next(currentBuffered)
      observer.complete()
    }
    return bufferedDocs$.do(doc => {
      currentBuffered = doc
    })
      .subscribe(observer)
  })

  return {
    events: cachedBuffered.switchMap(bufferedDoc => bufferedDoc.events),
    patch(patches) {
      cachedBuffered.subscribe(bufferedDoc => bufferedDoc.patch(patches))
    },
    create(document) {
      cachedBuffered.subscribe(bufferedDoc => bufferedDoc.create(document))
    },
    createIfNotExists(document) {
      cachedBuffered.subscribe(bufferedDoc => bufferedDoc.createIfNotExists(document))
    },
    createOrReplace(document) {
      cachedBuffered.subscribe(bufferedDoc => bufferedDoc.createOrReplace(document))
    },
    delete() {
      cachedBuffered.subscribe(bufferedDoc => bufferedDoc.delete())
    },
    commit() {
      return cachedBuffered.switchMap(bufferedDoc => bufferedDoc.commit())
    }
  }
}

module.exports = function createDocumentStore({serverConnection}) {

  return {
    byId,
    byIds,
    query,
    create,
    checkout,
    patch: patchDoc,
    delete: deleteDoc,
    createOrReplace: createOrReplace,
    createIfNotExists: createIfNotExists,
  }

  function patchDoc(documentId, patches) {
    const doc = checkout(documentId)
    doc.patch(patches)
    return doc.commit()
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
    return createBufferedDocument(documentId, serverConnection)
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

  function createIfNotExists(document) {
    return Observable.from(serverConnection.createIfNotExists(document))
  }

  function createOrReplace(document) {
    return Observable.from(serverConnection.createOrReplace(document))
  }
}
