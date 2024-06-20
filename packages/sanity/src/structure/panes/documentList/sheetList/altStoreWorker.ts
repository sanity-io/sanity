/// <reference lib="WebWorker" />

import {type GroqStore, groqStore, type Subscription} from '@sanity/groq-store'

declare const self: DedicatedWorkerGlobalScope & {window: typeof self}
self.window = self

let store: GroqStore | undefined
let subscription: Subscription | undefined

self.onmessage = async (e) => {
  const {type, projectId, dataset, query, params} = e.data

  switch (type) {
    case 'INIT_STORE':
      store = groqStore({
        projectId,
        dataset,
        listen: true,
        overlayDrafts: true,
      })
      break
    case 'SUBSCRIBE':
      if (store) {
        subscription = store.subscribe(query, params, (err, documents) => {
          if (err) {
            self.postMessage({type: 'ERROR', message: err.message})
            return
          }
          self.postMessage({type: 'DATA', documents})
        })
      }
      break
    case 'UNSUBSCRIBE':
      if (subscription) {
        subscription.unsubscribe()
      }
      break
    case 'CLOSE_STORE':
      if (store) {
        store.close()
      }
      break
    default:
      console.error('Unsupported message type')
  }
}
