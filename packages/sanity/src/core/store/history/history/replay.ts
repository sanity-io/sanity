import {type TransactionLogEventWithEffects} from '@sanity/types'

import {type DocumentRemoteMutationVersionEvent} from './types'

export type TraceEvent =
  | {
      type: 'initial'
      publishedId: string
    }
  | {type: 'addRemoteMutation'; event: DocumentRemoteMutationVersionEvent}
  | {type: 'addTranslogEntry'; event: TransactionLogEventWithEffects}
  | {type: 'didReachEarliestEntry'}
  | {type: 'updateChunks'}
