import {type MutationPayload} from '../../buffered-doc/types'
import {type MutationEvent} from '../../types'

export function mutationEvent({
  documentId = 'test',
  previousRev,
  resultRev,
  mutations,
}: {
  documentId?: string
  previousRev: string
  resultRev: string
  mutations: MutationPayload[]
}): MutationEvent {
  return {
    type: 'mutation',
    documentId,
    transactionId: resultRev,
    effects: {revert: [], apply: []},
    mutations,
    previousRev: previousRev,
    resultRev: resultRev,
    messageReceivedAt: new Date().toISOString(),
    transition: 'update',
    transactionCurrentEvent: 1,
    transactionTotalEvents: 1,
    visibility: 'transaction',
  }
}
