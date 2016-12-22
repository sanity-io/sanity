import Observable from '@sanity/observable'
import createDocumentStore from '@sanity/document-store'
import client from 'part:@sanity/base/client'
import {timer} from './observableUtils'

function getSnapshot(id) {
  return client.getDocument(id)
    .then(document => {
      return {
        type: 'snapshot',
        document: document
      }
    })
}

const serverConnection = {
  byId(id) {
    return Observable.from(client.listen('*[_id == $id]', {id: id}, {events: ['welcome', 'mutation']}))
      .concatMap(event => {
        return (event.type === 'welcome')
          ? Observable.from(getSnapshot(id))
          : Observable.of(event)
      })
  },

  query(query, params) {
    // todo
    return timer(0, 10000)
      .flatMap(() => client.fetch(query, params))
      .map(documents => ({
        type: 'snapshot',
        documents: documents
      }))
      // .map(event => (console.log('document store event %O', event), event)) // debug
  },

  mutate(mutations) {
    return Observable.from(client.dataRequest('mutate', mutations, {returnDocuments: false}))
  },

  delete(id) {
    return Observable.from(client.delete(id, {returnDocuments: false}))
  },

  create(doc) {
    return Observable.from(client.create(doc))
  }
}

export default createDocumentStore({serverConnection})
