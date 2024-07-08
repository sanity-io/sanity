import {
  createClient,
  type InitializedClientConfig,
  // unstable__adapter,
  // unstable__environment,
} from '@sanity/client'
import {of, type Subscription} from 'rxjs'

import {type MutationPayload} from '../buffered-doc/types'
import {type IdPair, type PendingMutationsEvent} from '../types'
import {
  checkoutPair,
  type DocumentVersionEvent,
  type Pair,
  type RemoteSnapshotVersionEvent,
} from './checkoutPair'

let instance: Pair | null = null

// eslint-disable-next-line @typescript-eslint/no-shadow
self.addEventListener('message', (event: MessageEvent) => {
  // console.log('Message received from main thread', event.data, {
  //   unstable__adapter,
  //   unstable__environment,
  // })
  if (isWorkerInput(event.data)) {
    if (event.data.type === 'construct') {
      if (instance) {
        instance.complete()
        instance = null
      }
      const {clientConfig, idPair, serverActionsEnabled} = event.data
      const client = createClient(clientConfig)
      // console.log('constructing checkout pair on main thread', {
      //   client,
      //   idPair,
      //   serverActionsEnabled,
      // })
      instance = checkoutPair(client, idPair, of(serverActionsEnabled))
      // console.log('instance on main thread', {instance})

      /**
       * Handle forwarding events from observables
       */
      const {complete: originalComplete} = instance

      const subscriptions: Subscription[] = []

      // @TODO try batching proxy send events to see if helps batching and debouncing
      subscriptions.push(
        instance.transactionsPendingEvents$.subscribe((payload) => {
          // console.log('transactionsPendingEvents$', payload)
          proxy({type: 'transactionsPendingEvents$', payload})
        }),
        instance.draft.consistency$.subscribe((payload) => {
          // console.log('draft.consistency$', payload)
          proxy({type: 'draft.consistency$', payload})
        }),
        instance.draft.events.subscribe((payload) => {
          // console.log('draft.events', payload)
          proxy({type: 'draft.events', payload})
        }),
        instance.draft.remoteSnapshot$.subscribe((payload) => {
          // console.log('draft.remoteSnapshot$', payload)
          proxy({type: 'draft.remoteSnapshot$', payload})
        }),
        instance.published.consistency$.subscribe((payload) => {
          // console.log('published.consistency$', payload)
          proxy({type: 'published.consistency$', payload})
        }),
        instance.published.events.subscribe((payload) => {
          // console.log('published.events', payload)
          proxy({type: 'published.events', payload})
        }),
        instance.published.remoteSnapshot$.subscribe((payload) => {
          // console.log('published.remoteSnapshot$', payload)
          proxy({type: 'published.remoteSnapshot$', payload})
        }),
      )

      instance.complete = () => {
        for (const subscription of subscriptions) {
          subscription.unsubscribe()
        }
        subscriptions.length = 0
        originalComplete()
      }
      // eslint-disable-next-line no-negated-condition
    } else if (!instance) {
      throw new Error('Received message before instance was constructed', {cause: event})
    } else {
      // console.warn('Handling event', event.data.type, event.data)
      switch (event.data.type) {
        case 'draft.commit':
          instance.draft.commit()
          break
        case 'draft.mutate':
          instance.draft.mutate(event.data.payload)
          break
        case 'published.commit':
          instance.published.commit()
          break
        case 'published.mutate':
          instance.published.mutate(event.data.payload)
          break
        default:
          throw new TypeError(`Unknown event type: ${event.data.type}`, {cause: event})
      }
    }
  }
})

function proxy(message: WorkerOutput): void {
  self.postMessage(message)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isWorkerInput(data: any): data is WorkerInput {
  return typeof data === 'object' && data && 'type' in data && typeof data.type === 'string'
}

/** @internal */
export type WorkerInput =
  | {
      type: 'construct'
      clientConfig: InitializedClientConfig
      idPair: IdPair
      serverActionsEnabled: boolean
    }
  | {type: 'draft.commit'}
  | {type: 'draft.mutate'; payload: MutationPayload[]}
  | {type: 'published.commit'}
  | {type: 'published.mutate'; payload: MutationPayload[]}
  /* request shutdown */
  | {type: 'complete'}

/** @internal */
export type WorkerOutput =
  | {type: 'transactionsPendingEvents$'; payload: PendingMutationsEvent}
  | {type: 'draft.consistency$'; payload: boolean}
  | {type: 'draft.events'; payload: DocumentVersionEvent}
  | {type: 'draft.remoteSnapshot$'; payload: RemoteSnapshotVersionEvent}
  | {type: 'published.consistency$'; payload: boolean}
  | {type: 'published.events'; payload: DocumentVersionEvent}
  | {type: 'published.remoteSnapshot$'; payload: RemoteSnapshotVersionEvent}
  /* shutdown complete, safe to terminate worker */
  | {type: 'completed'}
