import {merge, Observable} from 'rxjs'
import {filter, share} from 'rxjs/operators'
import {createObservableBufferedDocument} from './createObservableBufferedDocument'

function createBufferedDocument(documentId, serverEvents$, doCommit) {
  const bufferedDocument = createObservableBufferedDocument(serverEvents$, doCommit)

  const reconnects$ = serverEvents$.pipe(filter(event => event.type === 'reconnect'))

  return {
    events: merge(reconnects$, bufferedDocument.updates$),
    patch(patches) {
      bufferedDocument.addMutations(patches.map(patch => ({patch: {...patch, id: documentId}})))
    },
    create(document) {
      bufferedDocument.addMutation({
        create: Object.assign({id: documentId}, document)
      })
    },
    createIfNotExists(document) {
      bufferedDocument.addMutation({createIfNotExists: document})
    },
    createOrReplace(document) {
      bufferedDocument.addMutation({createOrReplace: document})
    },
    delete() {
      bufferedDocument.addMutation({delete: {id: documentId}})
    },
    commit() {
      return bufferedDocument.commit()
    }
  }
}

const isEventForDocId = id => event => event.type === 'reconnect' || event.documentId === id

export default function createDocumentStore({serverConnection}) {
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
      serverEvents$.pipe(filter(isEventForDocId(draftId))),
      doCommit
    )

    const published = createBufferedDocument(
      publishedId,
      serverEvents$.pipe(filter(isEventForDocId(publishedId))),
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
