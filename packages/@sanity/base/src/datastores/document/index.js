import {of as observableOf} from 'rxjs'

import createDocumentStore from '@sanity/document-store'
import client from 'part:@sanity/base/client'
import {getPairListener} from './getPairListener'
import {concatMap, map} from 'rxjs/operators'

function fetchDocumentSnapshot(id) {
  return client.observable.getDocument(id).pipe(
    map(document => ({
      type: 'snapshot',
      document: document
    }))
  )
}

function fetchQuerySnapshot(query, params) {
  return client.observable.fetch(query, params).pipe(
    map(documents => ({
      type: 'snapshot',
      documents: documents
    }))
  )
}

const serverConnection = {
  byIdPair(idPair) {
    return getPairListener(idPair)
  },
  byId(id) {
    return client
      .listen(
        '*[_id == $id]',
        {id: id},
        {includeResult: false, events: ['welcome', 'mutation', 'reconnect']}
      )
      .pipe(
        concatMap(event => {
          return event.type === 'welcome' ? fetchDocumentSnapshot(id) : observableOf(event)
        })
      )
  },

  query(query, params) {
    return client.observable
      .listen(query, params || {}, {
        includeResult: false,
        events: ['welcome', 'mutation', 'reconnect']
      })
      .pipe(
        concatMap(event => {
          return event.type === 'welcome' ? fetchQuerySnapshot(query, params) : observableOf(event)
        })
      )
  },

  mutate(mutations) {
    return client.observable.dataRequest('mutate', mutations, {
      visibility: 'async',
      returnDocuments: false
    })
  },

  delete(id) {
    return client.observable.delete(id, {visibility: 'async', returnDocuments: false})
  },

  create(doc) {
    return client.observable.create(doc)
  },
  createIfNotExists(doc) {
    return client.observable.createIfNotExists(doc)
  },
  createOrReplace(doc) {
    return client.observable.createOrReplace(doc)
  }
}

export default createDocumentStore({serverConnection})
