import {Doc, RemoteMutationWithVersion, TransactionLogEvent} from './types'

export type TraceEvent =
  | {
      type: 'initial'
      publishedId: string
      draft: Doc | null
      published: Doc | null
    }
  | {type: 'addRemoteMutation'; event: RemoteMutationWithVersion}
  | {type: 'addTranslogEntry'; event: TransactionLogEvent}
  | {type: 'didReachEarliestEntry'}
  | {type: 'updateChunks'}
