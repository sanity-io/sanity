import {Observable, merge} from 'rxjs'
import {share, filter, map, concat, switchMap, tap} from 'rxjs/operators'

import {omit} from 'lodash'
import pubsub from 'nano-pubsub'
import {BufferedDocument, Mutation} from '@sanity/mutator'

const NOOP = () => {}

function createBufferedDocument(documentId, serverEvents$, doCommit) {
  const reconnects$ = serverEvents$.pipe(filter(event => event.type === 'reconnect'))

  const saves = pubsub()

  const bufferedDocs$ = serverEvents$.pipe(
    filter(event => event.type === 'snapshot'),
    map(event => event.document),
    map(snapshot => {
      const bufferedDocument = new BufferedDocument(snapshot || null)

      bufferedDocument.commitHandler = function commitHandler(opts) {
        const payload = opts.mutation.params

        // TODO:
        // right now the BufferedDocument just commits fire-and-forget-ish
        // We should be able to handle failures and retry here

        doCommit(omit(payload, 'resultRev')).subscribe({
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
      }).pipe(share())

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
          .pipe(filter(event => event.type === 'mutation'))
          .subscribe(event => bufferedDocument.arrive(new Mutation(event)))

        return () => {
          serverMutations.unsubscribe()
          bufferedDocument.onMutation = NOOP
        }
      }).pipe(share())

      return {
        events: new Observable(observer => {
          observer.next({type: 'snapshot', document: bufferedDocument.LOCAL})
          observer.complete()
        }).pipe(concat(merge(mutation$, rebase$, reconnects$))),

        patch(patches) {
          const mutations = patches.map(patch => ({patch: {...patch, id: documentId}}))

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
    }),
    share()
  )

  let currentBuffered
  const cachedBuffered = new Observable(observer => {
    if (currentBuffered) {
      observer.next(currentBuffered)
      observer.complete()
    }
    return bufferedDocs$
      .pipe(
        tap(doc => {
          currentBuffered = doc
        })
      )
      .subscribe(observer)
  })

  return {
    events: cachedBuffered.pipe(switchMap(bufferedDoc => bufferedDoc.events)),
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
      return cachedBuffered.pipe(switchMap(bufferedDoc => bufferedDoc.commit()))
    }
  }
}

const isDocId = id => event => event.documentId === id

module.exports = function createDocumentStore({serverConnection}) {
  return {
    byId,
    byIds,
    query,
    create,
    checkout,
    checkoutPair,
    patch: patchDoc,
    delete: deleteDoc,
    createOrReplace: createOrReplace,
    createIfNotExists: createIfNotExists
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

  function checkoutPair(idPair) {
    const {publishedId, draftId} = idPair

    const serverEvents$ = serverConnection.byIdPair({publishedId, draftId}).pipe(share())

    const draft = createBufferedDocument(
      draftId,
      serverEvents$.pipe(filter(isDocId(draftId))),
      doCommit
    )
    const published = createBufferedDocument(
      publishedId,
      serverEvents$.pipe(filter(isDocId(publishedId))),
      doCommit
    )
    return {draft, published}
  }

  function checkout(documentId) {
    const serverEvents$ = serverConnection.byId(documentId).pipe(share())
    return createBufferedDocument(documentId, serverEvents$, doCommit)
  }

  function byIds(documentIds) {
    return new Observable(observer => {
      const documentSubscriptions = documentIds.map(id => byId(id).subscribe(observer))

      return () => {
        documentSubscriptions.map(subscription => subscription.unsubscribe())
      }
    })
  }

  function query(_query, params) {
    return serverConnection.query(_query, params)
  }

  function create(document) {
    return serverConnection.create(document)
  }

  function createIfNotExists(document) {
    return serverConnection.createIfNotExists(document)
  }

  function createOrReplace(document) {
    return serverConnection.createOrReplace(document)
  }

  function doCommit(payload) {
    return serverConnection.mutate(payload)
  }
}
